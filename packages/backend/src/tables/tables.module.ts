import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { Table } from 'src/entities/table.entity';
import { OrderItem } from 'src/entities/order-item.entity';
import { CompletedOrder } from 'src/entities/completed-order.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Table, OrderItem,CompletedOrder])], // Kullanılan entity'ler
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService] // OrdersModule'ün kullanabilmesi için
})
export class TablesModule {}