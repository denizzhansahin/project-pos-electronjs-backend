import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
     // Gerekli entity
import { TablesModule } from '../tables/tables.module'; // TablesService'i kullanmak için
import { OrderItem } from 'src/entities/order-item.entity';
import { CompletedOrder } from 'src/entities/completed-order.entity';
import { CompletedOrderItem } from 'src/entities/completed-order-item.entity';
import { Product } from 'src/entities/product.entity';
import { Table } from 'src/entities/table.entity';
import { CompletedOrdersController } from './completed-orders.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ // Bu modülün yönettiği ve ihtiyaç duyduğu entity'ler
      OrderItem,
      CompletedOrder,
      CompletedOrderItem,
      Product, // ProductRepository'ye erişim için
      Table   // TableRepository'ye erişim için
    ]),
    TablesModule, // TablesService'i import etmek için
  ],
  controllers: [OrdersController,CompletedOrdersController],
  providers: [OrdersService],
  // exports: [OrdersService] // Gerekirse başka modüller için
})
export class OrdersModule {}