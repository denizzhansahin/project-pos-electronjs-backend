import {
    Controller, Post, Body, Param, Patch, Delete, ParseUUIDPipe, UsePipes, ValidationPipe, Get, HttpCode, HttpStatus
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AddOrderItemDto } from 'src/dto/add-order-item.dto';
import { UpdateOrderItemDto } from 'src/dto/update-order-item.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';


// Sipariş işlemlerini ilgili masanın altına yerleştirmek RESTful yaklaşımına daha uygun olabilir
@Controller('tables/:tableId/order') // Ana rota: /tables/{tableId}/order
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    // POST /tables/{tableId}/order -> Siparişe ürün ekle/güncelle
    @Roles(Role.ADMIN, Role.USER)
    @Post()
    @UsePipes(ValidationPipe)
    addOrUpdateItem(
        @Param('tableId', ParseUUIDPipe) tableId: string,
        @Body() addOrderItemDto: AddOrderItemDto
    ) {
        return this.ordersService.addOrUpdateItem(tableId, addOrderItemDto);
    }

    // PATCH /tables/{tableId}/order/items/{orderItemId} -> Siparişteki ürün miktarını güncelle
    @Roles(Role.ADMIN, Role.USER)
    @Patch('items/:orderItemId')
    @UsePipes(ValidationPipe)
    updateItemQuantity(
        @Param('tableId', ParseUUIDPipe) tableId: string,
        @Param('orderItemId', ParseUUIDPipe) orderItemId: string,
        @Body() updateOrderItemDto: UpdateOrderItemDto
    ) {
        return this.ordersService.updateItemQuantity(tableId, orderItemId, updateOrderItemDto);
    }

    // DELETE /tables/{tableId}/order/items/{orderItemId} -> Siparişten ürünü sil
    @Roles(Role.ADMIN, Role.USER)
    @Delete('items/:orderItemId')
    @HttpCode(HttpStatus.OK) // Veya NO_CONTENT(204), güncel masa durumunu döndürdüğümüz için OK(200) daha mantıklı
    removeItem(
        @Param('tableId', ParseUUIDPipe) tableId: string,
        @Param('orderItemId', ParseUUIDPipe) orderItemId: string,
    ) {
        return this.ordersService.removeItem(tableId, orderItemId);
    }

    // POST /tables/{tableId}/order/complete -> Siparişi tamamla
    @Roles(Role.ADMIN, Role.USER)
    @Post('complete')
    completeOrder(@Param('tableId', ParseUUIDPipe) tableId: string) {
        return this.ordersService.completeOrder(tableId);
    }

    // --- Tamamlanmış Siparişler İçin Ayrı Rotalar (isteğe bağlı olarak ayrı controller'a taşınabilir) ---

    // GET /completed-orders -> Tüm tamamlanmış siparişleri listele
    @Roles(Role.ADMIN,Role.USER)
    @Get('/completed-orders') // Bağımsız rota
    findAllCompleted() {
        // Bu rotayı /orders/completed gibi farklı bir controller'a taşımak daha mantıklı olabilir.
        // Şimdilik burada bırakıyorum.
        const controllerRoot = this.ordersService; // Hata vermemesi için geçici atama
        return controllerRoot.findAllCompleted();
    }

    // GET /completed-orders/{id} -> Tek bir tamamlanmış siparişi getir
    @Roles(Role.ADMIN,Role.USER)
    @Get('/completed-orders/:id') // Bağımsız rota
    findOneCompleted(@Param('id', ParseUUIDPipe) id: string) {
        // Bu rotayı /orders/completed/:id gibi farklı bir controller'a taşımak daha mantıklı olabilir.
        const controllerRoot = this.ordersService; // Hata vermemesi için geçici atama
        return controllerRoot.findOneCompleted(id);
    }

}