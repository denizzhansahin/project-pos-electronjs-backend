import { BadRequestException, Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { OrdersService } from './orders.service'; // Aynı service'i kullanacağız
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';

// Tamamlanmış siparişlere özel endpoint'ler için kontrolör
@Controller('completed-orders') // Ana rota: /completed-orders
export class CompletedOrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    // GET /completed-orders -> Tüm tamamlanmış siparişleri listele
    @Roles(Role.ADMIN,Role.USER)
    @Get()
    findAllCompleted() {
        return this.ordersService.findAllCompleted();
    }

    @Roles(Role.ADMIN,Role.USER)
    @Get('date')
    findAllCompletedDate(@Query('date') dateString?: string) {
        // İsteğe bağlı: Tarih formatını burada da validate edebilirsin
         if (dateString && !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
             throw new BadRequestException('Invalid date format. Please use YYYY-MM-DD.');
         }
        return this.ordersService.findAllCompletedDate(dateString); // Service'e tarihi gönder
    }

    // GET /completed-orders/{id} -> Tek bir tamamlanmış siparişi getir
    @Roles(Role.ADMIN,Role.USER)
    @Get(':id')
    findOneCompleted(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.findOneCompleted(id);
    }

    // İleride buraya tamamlanmış siparişlerle ilgili başka endpoint'ler eklenebilir
    // Örn: Tarih aralığına göre filtreleme, belirli bir müşterinin siparişleri vb.
}