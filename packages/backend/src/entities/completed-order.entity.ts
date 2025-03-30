import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { Table } from './table.entity';
import { CompletedOrderItem } from './completed-order-item.entity';


@Entity('completed_orders')
export class CompletedOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Table, (table) => table.completedOrders, {
    onDelete: 'SET NULL', // Masa silinince tableId NULL olsun
    nullable: true       // İlişkinin null olmasına izin ver
 })
  table: Table; // Hangi masanın siparişiydi

  @Column({ nullable: true }) // <<< ÖNEMLİ: Sütun NULL olabilmeli
  tableId: string | null;

  @Column()
  tableName: string; // O anki masa adı

  @OneToMany(() => CompletedOrderItem, (item) => item.completedOrder, {
      cascade: true, // Sipariş silinirse kalemleri de sil
      eager: true, // Siparişi çekince kalemleri de getir (performansa dikkat!)
  })
  items: CompletedOrderItem[];

  @Column('real')
  total: number;

  @CreateDateColumn() // Otomatik oluşturulma tarihi
  timestamp: Date;
}