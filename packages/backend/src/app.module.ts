// packages/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config'; // ConfigService eklendi
import { AppService } from './app.service';
import { Product } from './entities/product.entity';
import { Table } from './entities/table.entity';
import { OrderItem } from './entities/order-item.entity';
import { CompletedOrder } from './entities/completed-order.entity';
import { CompletedOrderItem } from './entities/completed-order-item.entity';
import { ProductsModule } from './products/products.module';
import { TablesModule } from './tables/tables.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { User } from './entities/user.entity';
import { AppController } from './app.controller';
import { EventsGateway } from './events/events.gateway';
import { join } from 'path'; // Node.js path modülünden join eklendi

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    // --- GÜNCELLENDİ: TypeOrmModule.forRootAsync ---
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // ConfigService'i inject edebilmek için
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Ortam değişkeninden userData yolunu al (main.js'den gönderilen)
        const userDataPath = configService.get<string>('USER_DATA_PATH');

        // Üretimde userDataPath kullanılmalı, geliştirme için fallback ayarla
        // Geliştirmede (userDataPath tanımsızsa) veritabanını proje köküne göre ayarla
        const dbDirectory = userDataPath || join(__dirname, '..', '..'); // __dirname = dist, ../.. = proje kökü

        const databasePath = join(dbDirectory, 'pos-database.sqlite'); // Veritabanı dosyasının tam yolu

        console.log(`[TypeOrmModule] Initializing SQLite database at: ${databasePath}`); // Hangi yolun kullanıldığını logla

        return {
          type: 'sqlite',
          database: databasePath, // Hesaplanan tam yolu kullan
          entities: [
            Product,
            Table,
            OrderItem,
            CompletedOrder,
            CompletedOrderItem,
            User,
          ],
          // DİKKAT: 'synchronize: true' sadece geliştirme içindir.
          // Üretimde false yapıp TypeORM Migrations kullanın!
          synchronize: true,
          logging: true, // Geliştirme sırasında SQL logları için true bırakılabilir
        };
      },
    }),
    // --- GÜNCELLEME SONU ---
    ProductsModule,
    TablesModule,
    OrdersModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, EventsGateway],
})
export class AppModule {}