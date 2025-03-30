import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { CompletedOrderItem } from './completed-order-item.entity';


@Entity('products') // Tablo adı
export class Product {
  @PrimaryGeneratedColumn('uuid') // Otomatik artan ID yerine UUID daha iyi olabilir
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column('real') // SQLite için ondalıklı sayı
  price: number;

  @Column({ length: 50 })
  category: string;

  // Bir ürün birden çok aktif sipariş kaleminde olabilir (ilişkinin diğer ucu)
  @OneToMany(() => OrderItem, (orderItem) => orderItem.product, { onDelete: 'CASCADE'})
  orderItems: OrderItem[];

  // Bir ürün birden çok tamamlanmış sipariş kaleminde olabilir
  @OneToMany(() => CompletedOrderItem, (completedItem) => completedItem.product,{ onDelete: 'CASCADE'})
  completedOrderItems: CompletedOrderItem[];
}