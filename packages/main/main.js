// packages/main/main.js (Frontend Olmadan - Veritabanını userData'ya Kopyalama - Tam Hali)
const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs'); // Dosya sistemi modülü

// -----------------------------------------------------------------------------
// Geliştirme mi Üretim mi? Tespiti
// -----------------------------------------------------------------------------
const isDev = !app.isPackaged;
console.log(`[Startup Check] app.isPackaged: ${app.isPackaged}, determined isDev: ${isDev}`);

// -----------------------------------------------------------------------------
// Global Değişkenler
// -----------------------------------------------------------------------------
let mainWindow = null; // Pencere referansı (opsiyonel)
let nestProcess = null; // NestJS alt süreci referansı

// -----------------------------------------------------------------------------
// (Opsiyonel) Minimal Pencere Oluşturma Fonksiyonu
// -----------------------------------------------------------------------------
function createMinimalWindow() {
    console.log('[Window] Creating minimal browser window (for logs/devtools)...');
    mainWindow = new BrowserWindow({
        width: 600,
        height: 400,
        show: isDev, // Geliştirmede göster, üretimde gizle
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    // İçerik yüklenmiyor.

    // Geliştirme modunda DevTools'u aç
    if (isDev) {
        mainWindow.webContents.openDevTools();
        console.log('[Window] Development mode: Opened DevTools in minimal window.');
    } else {
         console.log('[Window] Production mode: Minimal window created but hidden.');
    }

    mainWindow.on('closed', () => {
        console.log('[Window] Minimal window closed.');
        mainWindow = null;
    });
} // --- createMinimalWindow sonu ---

// -----------------------------------------------------------------------------
// NestJS Backend'i Başlatma Fonksiyonu (Sadece Üretim)
// -----------------------------------------------------------------------------
function startNestBackend() {
    console.log('[NestJS Starter] Preparing to start backend process...');

    let backendBasePath; // NestJS kodunun bulunduğu yer (paket içinde)
    let sourceDbPath;    // Başlangıç DB'sinin paket içindeki yeri
    if (app.isPackaged) {
       // Üretimde: Paket içindeki kopyalanmış backend klasörü
       backendBasePath = path.join(path.dirname(app.getAppPath()), 'app', 'backend');
       sourceDbPath = path.join(backendBasePath, 'pos-database.sqlite'); // Paket içindeki kaynak DB
    } else {
       // Geliştirmede: Kaynak koddaki backend klasörü
       backendBasePath = path.join(__dirname, '..', '..', 'packages', 'backend');
       sourceDbPath = path.join(backendBasePath, 'pos-database.sqlite'); // Geliştirmedeki kaynak DB
       // Geliştirme modu uyarısı - bu fonksiyon normalde çağrılmaz
       console.warn('[NestJS Starter] Warning: startNestBackend called in development mode. Ensure this is intended.');
    }

    const backendEntryPoint = path.join(backendBasePath, 'dist', 'main.js'); // Çalıştırılacak JS dosyası

    console.log(`[NestJS Starter] Resolved Backend Base Path (cwd): ${backendBasePath}`);
    console.log(`[NestJS Starter] Source DB Path (in package/source): ${sourceDbPath}`);
    console.log(`[NestJS Starter] Attempting to start NestJS process from: ${backendEntryPoint}`);

    // Backend giriş noktasının varlığını kontrol et
    if (!fs.existsSync(backendEntryPoint)) {
        const errorMsg = `Backend entry point not found: ${backendEntryPoint}\nCheck electron-builder.yml 'extraResources' mapping and ensure backend was built correctly.`;
        console.error(`[NestJS Starter] ${errorMsg}`);
        dialog.showErrorBox('Backend Başlatma Hatası', errorMsg);
        return; // Başlatmayı durdur
    }

    // --- USER DATA VE VERİTABANI KOPYALAMA MANTIĞI ---
    const userDataPath = app.getPath('userData'); // Kullanıcı verileri dizini
    const targetDbPath = path.join(userDataPath, 'pos-database.sqlite'); // userData içindeki hedef DB yolu
    console.log(`[NestJS Starter] Target DB Path (in userData): ${targetDbPath}`);

    // userData dizinini oluştur (yoksa)
    try {
        if (!fs.existsSync(userDataPath)) {
            console.log(`[NestJS Starter] User data directory does not exist. Creating: ${userDataPath}`);
            fs.mkdirSync(userDataPath, { recursive: true });
        }
    } catch (err) {
         console.error(`[NestJS Starter] Failed to create user data directory: ${userDataPath}`, err);
         dialog.showErrorBox('Kritik Hata', `Kullanıcı veri dizini oluşturulamadı:\n${userDataPath}\n\n${err}`);
         return; // Başlatmayı durdur
    }

    // Sadece Üretimde ve Hedef DB Yoksa Başlangıç DB'sini Kopyala
    if (!isDev && !fs.existsSync(targetDbPath)) {
        console.log(`[NestJS Starter] Target database not found at ${targetDbPath}. Checking source DB...`);
        if (fs.existsSync(sourceDbPath)) {
            console.log(`[NestJS Starter] Source DB found at ${sourceDbPath}. Attempting to copy...`);
            try {
                fs.copyFileSync(sourceDbPath, targetDbPath);
                console.log(`[NestJS Starter] Successfully copied initial database to ${targetDbPath}`);
            } catch (err) {
                console.error(`[NestJS Starter] Failed to copy database from ${sourceDbPath} to ${targetDbPath}`, err);
                dialog.showErrorBox('Veritabanı Hatası', `Başlangıç veritabanı kopyalanamadı.\n\nKaynak: ${sourceDbPath}\nHedef: ${targetDbPath}\n\nHata: ${err}`);
                // return; // Kopyalama başarısız olursa başlatmayı durdurabilirsin
            }
        } else {
            console.warn(`[NestJS Starter] Source database not found at ${sourceDbPath}. Cannot copy initial database. NestJS might create a new one.`);
        }
    } else if (!isDev && fs.existsSync(targetDbPath)) {
        console.log(`[NestJS Starter] Target database already exists at ${targetDbPath}. No copy needed.`);
    } else if (isDev) {
         // Geliştirmede kopyalama yapmıyoruz.
         console.log(`[NestJS Starter] Development mode. Skipping database copy.`);
    }
    // --- KOPYALAMA MANTIĞI SONU ---

    // NestJS sürecine geçirilecek ortam değişkenleri
    const nestEnv = {
        ...process.env,
        USER_DATA_PATH: userDataPath, // NestJS'e HER ZAMAN userData yolunu gönder
        NODE_ENV: 'production',
        // Gerekli diğer ortam değişkenleri
        JWT_SECRET: process.env.JWT_SECRET || 'YOUR_FALLBACK_SECRET_IF_NEEDED' // Kendi secret'ınızı ekleyin
    };

    try {
        // NestJS sürecini başlat
        nestProcess = fork(
            backendEntryPoint,
            [], // Argümanlar
            {
                cwd: backendBasePath, // NestJS'in çalışma dizini
                silent: false,        // NestJS loglarını bu konsolda göster
                env: nestEnv          // Hesaplanan ortam değişkenlerini ilet
            }
        );

        // NestJS sürecinden gelen mesajları dinle (IPC için)
        nestProcess.on('message', (msg) => console.log('[NestJS Process Msg]', msg));

        // NestJS sürecindeki hataları yakala
        nestProcess.on('error', (err) => {
             console.error('[NestJS Process Error]', err);
             if (app.isReady() && mainWindow) { // Pencere varsa göster
                 dialog.showErrorBox('Backend Hatası', `Arka plan NestJS süreci hata verdi:\n\n${err}`);
             }
        });

        // NestJS süreci kapandığında ne olacağını belirle
        nestProcess.on('exit', (code, signal) => {
            console.log(`[NestJS Process Exit] Process exited with code: ${code}, signal: ${signal}`);
            // Beklenmedik kapanma durumunda kullanıcıyı bilgilendir
            if (code !== 0 && signal !== 'SIGTERM' && app.isReady() && mainWindow) { // Pencere varsa göster
                dialog.showErrorBox('Backend Durdu', `Arka plan NestJS süreci beklenmedik şekilde durdu (Kod: ${code}, Sinyal: ${signal}). Uygulama düzgün çalışmayabilir.`);
            }
            nestProcess = null; // Referansı temizle
        });

        console.log('[NestJS Starter] NestJS process fork initiated successfully.');

    } catch (error) {
        console.error("[NestJS Starter] Failed to fork NestJS process:", error);
        if (app.isReady() && mainWindow) { // Pencere varsa göster
            dialog.showErrorBox('Backend Başlatma Hatası', `Arka plan NestJS süreci başlatılamadı:\n\n${error}`);
        }
    }
} // --- startNestBackend sonu ---

// -----------------------------------------------------------------------------
// Electron Uygulama Yaşam Döngüsü Olayları
// -----------------------------------------------------------------------------

// Geliştirme sırasında localhost sertifika hatalarını yoksay (gerekirse)
if (isDev) {
    app.commandLine.appendSwitch('allow-insecure-localhost');
}

// Uygulama hazır olduğunda
app.whenReady().then(() => {
    console.log(`[App Lifecycle] App ready. Determined isDev: ${isDev}`);

    // Minimal pencereyi oluştur (opsiyonel)
    createMinimalWindow();

    // Sadece üretim modunda backend'i başlat
    if (!isDev) {
        startNestBackend();
    } else {
        // Geliştirmede backend'i manuel başlatman gerekir (`npm run dev:backend`)
        console.log('[App Lifecycle] Development mode: Assuming backend is running separately via `npm run dev:backend`.');
    }

    // macOS: Dock ikonu tıklandığında pencereyi yeniden oluştur (opsiyonel)
    app.on('activate', () => {
        // Sadece pencere kapatıldıysa yeniden oluştur
        if (BrowserWindow.getAllWindows().length === 0) {
            console.log('[App Lifecycle] Activate event: No windows open, creating minimal window.');
            createMinimalWindow();
        }
    });
});

// Tüm pencereler kapatıldığında (macOS hariç)
app.on('window-all-closed', () => {
    console.log('[App Lifecycle] All windows closed.');
    // Eğer pencere hiç gösterilmiyorsa veya kullanıcı kapattıysa çıkış yap
    if (process.platform !== 'darwin') {
        console.log('[App Lifecycle] Quitting application (non-macOS).');
        app.quit();
    } else {
        console.log('[App Lifecycle] On macOS, app remains active until explicitly quit.');
    }
});

// Uygulamadan çıkmadan hemen önce
app.on('before-quit', (event) => {
    console.log('[App Lifecycle] Before-quit event triggered.');
    // Çalışıyorsa NestJS sürecini durdur
    if (nestProcess && !nestProcess.killed) {
        console.log('[App Lifecycle] Attempting to kill NestJS process gracefully (SIGTERM)...');
        const killed = nestProcess.kill('SIGTERM');
        if (killed) {
            console.log('[App Lifecycle] SIGTERM sent to NestJS process.');
        } else {
             console.log('[App Lifecycle] Failed to send SIGTERM to NestJS process (already exited?).');
        }
    } else {
        console.log('[App Lifecycle] NestJS process already killed or was not running.');
    }
});

// Uygulama çıktığında
app.on('quit', (event, exitCode) => {
     console.log(`[App Lifecycle] Application quit with exit code: ${exitCode}`);
});

// -----------------------------------------------------------------------------
// Genel Hata Yakalama
// -----------------------------------------------------------------------------

// Ana Süreçte Yakalanmayan İstisnalar
process.on('uncaughtException', (error, origin) => {
    console.error(`[Error Handling] Uncaught Exception. Origin: ${origin}`, error);
    try {
        // Hata anında pencere varsa göster
        if (app.isReady() && BrowserWindow.getAllWindows().length > 0) {
             dialog.showErrorBox('Kritik Hata (Ana Süreç)', `Uygulamada beklenmedik bir hata oluştu:\n\n${error}\n\nOrigin: ${origin}`);
        }
    } catch (e) { console.error("Could not show error box for uncaughtException:", e); }
    // Kritik hatadan sonra çıkış yapmak genellikle daha güvenlidir
    // process.exit(1);
});

// Yakalanmayan Promise Reddetmeleri
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Error Handling] Unhandled Rejection at:', promise, 'reason:', reason);
    try {
         // Hata anında pencere varsa göster
         if (app.isReady() && BrowserWindow.getAllWindows().length > 0) {
            dialog.showErrorBox('İşlenmeyen Hata (Promise)', `Bir async işlemde hata oluştu:\n\n${reason}`);
         }
    } catch (e) { console.error("Could not show error box for unhandledRejection:", e); }
});

// -----------------------------------------------------------------------------
console.log('[Main Process] Script finished initial execution. Event listeners registered.');
// -----------------------------------------------------------------------------

/*
// packages/main/main.js (Veritabanını userData'ya Kopyalama Mantığıyla)
const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs'); // Dosya sistemi modülü

const isDev = !app.isPackaged;
console.log(`[Startup Check] app.isPackaged: ${app.isPackaged}, determined isDev: ${isDev}`);

let mainWindow = null;
let nestProcess = null;

function createWindow() {
    // ... (createWindow fonksiyonu aynı kalır) ...
    console.log('[Window] Creating main browser window...');
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        },
        show: false,
    });

    const loadFrontend = () => {
        if (isDev) { 
            const vitePort = process.env.VITE_PORT || 4173;
            const devUrl = `http://localhost:${vitePort}`;
            console.log(`[Frontend Loader] Development Mode: Loading Vite dev server URL: ${devUrl}`);
            let attempt = 0; const maxAttempts = 5; const retryDelay = 2000;
            const tryLoad = () => {
                mainWindow.loadURL(devUrl).then(() => {
                    console.log(`[Frontend Loader] Vite dev server loaded successfully on attempt ${attempt + 1}.`);
                    mainWindow.webContents.openDevTools(); mainWindow.show();
                }).catch(err => {
                    attempt++; console.warn(`[Frontend Loader] Failed to load Vite dev server (Attempt ${attempt}/${maxAttempts}): ${err.message}`);
                    if (attempt < maxAttempts) { setTimeout(tryLoad, retryDelay); }
                    else { dialog.showErrorBox('Geliştirme Hatası', `...`); mainWindow.show(); }
                });
            }; tryLoad();
        } else { 
            const frontendIndexPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
            console.log(`[Frontend Loader] Production Mode: Loading built frontend from: ${frontendIndexPath}`);
            if (!fs.existsSync(frontendIndexPath)) {  return; }
            mainWindow.loadFile(frontendIndexPath).then(() => {
                console.log('[Frontend Loader] Built frontend loaded successfully.'); mainWindow.show();
            }).catch(err => {  });
        }
    };
    loadFrontend();
    mainWindow.on('closed', () => { mainWindow = null; });
}

function startNestBackend() {
    console.log('[NestJS Starter] Preparing to start backend process...');

    let backendBasePath; // NestJS kodunun bulunduğu yer (paket içinde)
    let sourceDbPath;    // Başlangıç DB'sinin paket içindeki yeri
    if (app.isPackaged) {
       backendBasePath = path.join(path.dirname(app.getAppPath()), 'app', 'backend');
       sourceDbPath = path.join(backendBasePath, 'pos-database.sqlite'); // Paket içindeki kaynak DB
    } else {
       backendBasePath = path.join(__dirname, '..', '..', 'packages', 'backend');
       sourceDbPath = path.join(backendBasePath, 'pos-database.sqlite'); // Geliştirmedeki kaynak DB
       // Geliştirmede kopyalama yapmayacağız ama yolu tanımlayalım
    }

    const backendEntryPoint = path.join(backendBasePath, 'dist', 'main.js');

    console.log(`[NestJS Starter] Resolved Backend Base Path (cwd): ${backendBasePath}`);
    console.log(`[NestJS Starter] Source DB Path (in package): ${sourceDbPath}`);
    console.log(`[NestJS Starter] Attempting to start production NestJS from: ${backendEntryPoint}`);

    if (!fs.existsSync(backendEntryPoint)) {  return; }

    // --- USER DATA VE VERİTABANI KOPYALAMA MANTIĞI ---
    const userDataPath = app.getPath('userData'); // Kullanıcı verileri dizini
    const targetDbPath = path.join(userDataPath, 'pos-database.sqlite'); // userData içindeki hedef DB yolu
    console.log(`[NestJS Starter] Target DB Path (in userData): ${targetDbPath}`);

    // userData dizinini oluştur (yoksa)
    try {
        if (!fs.existsSync(userDataPath)) {
            console.log(`[NestJS Starter] User data directory does not exist. Creating: ${userDataPath}`);
            fs.mkdirSync(userDataPath, { recursive: true });
        }
    } catch (err) {  return; }

    // Sadece Üretimde ve Hedef DB Yoksa Kopyala
    if (!isDev && !fs.existsSync(targetDbPath)) {
        console.log(`[NestJS Starter] Target database not found at ${targetDbPath}. Attempting to copy from package...`);
        if (fs.existsSync(sourceDbPath)) {
            try {
                fs.copyFileSync(sourceDbPath, targetDbPath);
                console.log(`[NestJS Starter] Successfully copied initial database to ${targetDbPath}`);
            } catch (err) {
                console.error(`[NestJS Starter] Failed to copy database from ${sourceDbPath} to ${targetDbPath}`, err);
                dialog.showErrorBox('Veritabanı Hatası', `Başlangıç veritabanı kopyalanamadı.\n\nKaynak: ${sourceDbPath}\nHedef: ${targetDbPath}\n\nHata: ${err}`);
                // Kopyalama başarısız olursa devam etmek sorun yaratabilir, isteğe bağlı olarak return;
            }
        } else {
            console.warn(`[NestJS Starter] Source database not found at ${sourceDbPath}. Cannot copy initial database.`);
            // İsteğe bağlı olarak kullanıcıya bilgi verilebilir.
            // NestJS boş bir DB oluşturmayı deneyecektir (synchronize: true ise).
        }
    } else if (!isDev && fs.existsSync(targetDbPath)) {
        console.log(`[NestJS Starter] Target database already exists at ${targetDbPath}. No copy needed.`);
    } else if (isDev) {
         console.log(`[NestJS Starter] Development mode. Skipping database copy check.`);
    }
    // --- KOPYALAMA MANTIĞI SONU ---

    const nestEnv = {
        ...process.env,
        USER_DATA_PATH: userDataPath, // NestJS'e HER ZAMAN userData yolunu gönder
        NODE_ENV: 'production',
        JWT_SECRET: process.env.JWT_SECRET || 'YOUR_FALLBACK_SECRET_IF_NEEDED'
    };

    try {
        nestProcess = fork(backendEntryPoint, [], { cwd: backendBasePath, silent: false, env: nestEnv });
        // ... (hata dinleyicileri aynı) ...
        console.log('[NestJS Starter] NestJS process fork initiated successfully.');
    } catch (error) {  }
}

// --- Electron Yaşam Döngüsü ve Hata Yakalama (Aynı kalır) ---
if (isDev) { app.commandLine.appendSwitch('allow-insecure-localhost'); }
app.whenReady().then(() => {  });
app.on('activate', () => {  });
app.on('window-all-closed', () => {  });
app.on('before-quit', (event) => {  });
app.on('quit', (event, exitCode) => {  });
process.on('uncaughtException', (error, origin) => {  });
process.on('unhandledRejection', (reason, promise) => {  });
console.log('[Main Process] Script finished initial execution. Event listeners registered.');
*/