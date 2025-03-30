import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from './product.entity';
import { Table } from './table.entity';


@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.orderItems, { eager: true ,  onDelete: 'CASCADE'}) // Ürün bilgisini de çekelim
  product: Product;

  @ManyToOne(() => Table, (table) => table.order, { onDelete: 'CASCADE',nullable: true }) // Masa silinirse bu da silinsin
  table: Table;

  @Column('integer')
  quantity: number;

  // Product ID ve Table ID'yi ayrıca tutmak bazen sorgularda kolaylık sağlar
  @Column()
  productId: string;

  @Column()
  tableId: string;
}