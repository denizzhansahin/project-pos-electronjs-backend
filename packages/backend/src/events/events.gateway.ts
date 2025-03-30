import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common'; // Loglama için

@WebSocketGateway({
  cors: {
    origin: '*', // Geliştirme için tüm originlere izin ver. Prodüksiyonda kısıtla!
    // Örneğin: origin: 'http://localhost:5173' (Vite dev sunucu portu)
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server; // Sunucu örneğine erişim

  private logger: Logger = new Logger('EventsGateway'); // Loglama

  // İstemci bağlandığında çalışır
  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`İstemci bağlandı: ${client.id}`);
  }

  // İstemci bağlantısı kesildiğinde çalışır
  handleDisconnect(client: Socket) {
    this.logger.log(`İstemci ayrıldı: ${client.id}`);
  }

  // 'mesajGonder' olayını dinler
  @SubscribeMessage('mesajGonder')
  handleMessage(
    @MessageBody() data: string, // Gelen mesajın içeriği
    @ConnectedSocket() client: Socket, // Mesajı gönderen istemci soketi
  ): void { // Genellikle void veya WsResponse<T> döner
    this.logger.log(`Alınan mesaj (${client.id}): ${data}`);

    // Mesajı gönderen istemciye geri gönder (echo)
    // client.emit('mesajAl', `Sunucu aldı: ${data}`);

    // VEYA: Bağlı tüm istemcilere gönder (broadcast)
    this.server.emit('mesajAl', `(${client.id}) dedi ki: ${data}`);

    // İsteğe bağlı: Gönderene özel bir yanıt göndermek isterseniz:
    // return { event: 'mesajOnayi', data: 'Mesajınız başarıyla alındı!' };
  }

  // Başka bir olay örneği (isteğe bağlı)
  @SubscribeMessage('banaOzel')
  handlePrivateMessage(
      @MessageBody() data: any,
      @ConnectedSocket() client: Socket,
  ) {
      this.logger.log(`Özel mesaj isteği (${client.id}):`, data);
      client.emit('ozelYanit', { message: 'Bu sadece sana özel bir yanıt!', timestamp: new Date() });
  }
}