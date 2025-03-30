import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { CompletedOrder } from './completed-order.entity';


export type TableStatus = 'empty' | 'occupied';

@Entity('tables')
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true }) // Masa adı benzersiz olabilir
  name: string;

  // Bir masanın birden çok aktif sipariş kalemi olabilir
  @OneToMany(() => OrderItem, (orderItem) => orderItem.table, {
      cascade: true, // Masa silinirse ilgili orderItem'lar da silinsin (isteğe bağlı)
      eager: true, // Table çekildiğinde orderItems da gelsin (performansa dikkat!)
  })
  order: OrderItem[]; // Frontend'deki isimlendirme ile aynı

  @Column({ type: 'varchar', length: 10, default: 'empty' })
  status: TableStatus;

  // Bir masanın birden çok tamamlanmış siparişi olabilir
  @OneToMany(() => CompletedOrder, (completedOrder) => completedOrder.table,{ onDelete: 'CASCADE'})
  completedOrders: CompletedOrder[];
}