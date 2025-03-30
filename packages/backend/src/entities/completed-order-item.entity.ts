import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { CompletedOrder } from './completed-order.entity';
import { Product } from './product.entity';

@Entity('completed_order_items')
export class CompletedOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.completedOrderItems, { eager: true ,  onDelete: 'CASCADE'})
  product: Product;

  @ManyToOne(() => CompletedOrder, (order) => order.items, { onDelete: 'CASCADE' })
  completedOrder: CompletedOrder;

  @Column('integer')
  quantity: number;

  @Column('real')
  pricePerUnit: number; // O anki ürün fiyatını kaydetmek önemlidir! Fiyat değişebilir.

  @Column()
  productId: string;

  @Column()
  completedOrderId: string;
}