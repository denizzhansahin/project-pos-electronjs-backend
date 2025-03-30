import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Between } from 'typeorm';

import { TablesService } from '../tables/tables.service'; // Masa durumunu güncellemek için
import { OrderItem } from 'src/entities/order-item.entity';
import { CompletedOrder } from 'src/entities/completed-order.entity';
import { CompletedOrderItem } from 'src/entities/completed-order-item.entity';
import { Table } from 'src/entities/table.entity';
import { Product } from 'src/entities/product.entity';
import { AddOrderItemDto } from 'src/dto/add-order-item.dto';
import { UpdateOrderItemDto } from 'src/dto/update-order-item.dto';



@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(CompletedOrder)
    private completedOrdersRepository: Repository<CompletedOrder>,
    @InjectRepository(CompletedOrderItem)
    private completedOrderItemsRepository: Repository<CompletedOrderItem>,
    @InjectRepository(Table)
    private tablesRepository: Repository<Table>, // Direkt erişim için
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private readonly tablesService: TablesService, // TablesService'i enjekte et
    private readonly entityManager: EntityManager, // Transaction için
  ) {}

  async addOrUpdateItem(tableId: string, addOrderItemDto: AddOrderItemDto): Promise<Table> {
    const { productId, quantity } = addOrderItemDto;

    // Masa ve Ürünü bul
    const table = await this.tablesService.findOneSimple(tableId); // Status güncellemesi için service'i kullan
    const product = await this.productsRepository.findOneBy({ id: productId });
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    // Mevcut OrderItem'ı kontrol et
    let orderItem = await this.orderItemsRepository.findOne({
      where: { tableId: tableId, productId: productId },
    });

    if (orderItem) {
      // Varsa: Miktarı güncelle
      orderItem.quantity += quantity;
      await this.orderItemsRepository.save(orderItem);
    } else {
      // Yoksa: Yeni OrderItem oluştur
      orderItem = this.orderItemsRepository.create({
        tableId: tableId,
        productId: productId,
        quantity: quantity,
        // product ve table nesnelerini direkt atamak yerine ID'leri kullanmak yeterli olabilir
        // product: product,
         table: table
      });
      await this.orderItemsRepository.save(orderItem);
    }

    // Masa durumunu 'occupied' yap (eğer zaten değilse)
    await this.tablesService.updateTableStatus(tableId);

    // Güncellenmiş masayı döndür (yeni sipariş durumuyla)
    return this.tablesService.findOne(tableId);
  }

  async updateItemQuantity(tableId: string, orderItemId: string, updateOrderItemDto: UpdateOrderItemDto): Promise<Table> {
      const { quantity } = updateOrderItemDto;

      const orderItem = await this.orderItemsRepository.findOne({
          where: { id: orderItemId, tableId: tableId } // Hem item hem masa ID kontrolü
      });

      if (!orderItem) {
          throw new NotFoundException(`Order item with ID "${orderItemId}" not found on table "${tableId}"`);
      }

      if (quantity <= 0) {
          // Miktar 0 veya altına düşerse sil
          await this.orderItemsRepository.remove(orderItem);
      } else {
          orderItem.quantity = quantity;
          await this.orderItemsRepository.save(orderItem);
      }

      // Masa durumunu güncelle (boşalmış olabilir)
      await this.tablesService.updateTableStatus(tableId);

      return this.tablesService.findOne(tableId); // Güncel masa durumunu döndür
  }


  async removeItem(tableId: string, orderItemId: string): Promise<Table> {
      const orderItem = await this.orderItemsRepository.findOne({
          where: { id: orderItemId, tableId: tableId }
      });

      if (!orderItem) {
          throw new NotFoundException(`Order item with ID "${orderItemId}" not found on table "${tableId}"`);
      }

      await this.orderItemsRepository.remove(orderItem);

      // Masa durumunu güncelle
      await this.tablesService.updateTableStatus(tableId);

      return this.tablesService.findOne(tableId); // Güncel masa durumunu döndür
  }


  async completeOrder(tableId: string): Promise<CompletedOrder> {
    // --- TRANSACTION BAŞLANGICI ---
    return this.entityManager.transaction(async transactionalEntityManager => {
      const table = await transactionalEntityManager.findOne(Table, {
        where: { id: tableId },
        relations: ['order', 'order.product'], // Aktif sipariş ve ürün bilgileri lazım
      });

      if (!table) {
        throw new NotFoundException(`Table with ID "${tableId}" not found`);
      }
      if (!table.order || table.order.length === 0) {
        throw new BadRequestException(`Table "${table.name}" has no active order to complete.`);
      }

      // Toplamı hesapla
      const total = table.order.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );

      // CompletedOrder oluştur
      const completedOrder = transactionalEntityManager.create(CompletedOrder, {
        tableId: table.id,
        tableName: table.name,
        total: total,
        // items daha sonra eklenecek
      });
      const savedCompletedOrder = await transactionalEntityManager.save(completedOrder);

      // CompletedOrderItem'ları oluştur
      const completedItems: CompletedOrderItem[] = [];
      for (const item of table.order) {
        const completedItem = transactionalEntityManager.create(CompletedOrderItem, {
          completedOrderId: savedCompletedOrder.id,
          productId: item.product.id,
          quantity: item.quantity,
          pricePerUnit: item.product.price, // O ANKİ fiyatı kaydet!
          // product: item.product // İstersen tüm product nesnesini de bağlayabilirsin
        });
        completedItems.push(completedItem);
      }
      await transactionalEntityManager.save(CompletedOrderItem, completedItems); // Toplu kaydetme

      // Aktif OrderItem'ları sil
      const activeOrderItemIds = table.order.map(item => item.id);
      if (activeOrderItemIds.length > 0) {
         await transactionalEntityManager.delete(OrderItem, activeOrderItemIds);
      }


      // Masa durumunu 'empty' yap
      table.status = 'empty';
      table.order = []; // Bellekteki listeyi de temizle (opsiyonel ama iyi pratik)
      await transactionalEntityManager.save(Table, table); // Transaction içindeki repository ile kaydet

      // Kaydedilen completedOrder'ı ilişkili item'larla birlikte döndür
       // Not: Eğer CompletedOrder entity'sinde items için eager: true yoksa, burada tekrar fetch etmek gerekebilir.
      savedCompletedOrder.items = completedItems; // Kaydedilen itemları ekle
      return savedCompletedOrder;

    });
    // --- TRANSACTION SONU ---
  }


  async findAllCompleted(): Promise<CompletedOrder[]> {
      // İlişkileri yüklemek için 'relations' kullan
      return this.completedOrdersRepository.find({
          relations: ['items', 'items.product', 'table'], // İhtiyaca göre ayarla
          order: { timestamp: 'DESC' } // En yeniden eskiye sırala
      });
  }

  async findOneCompleted(id: string): Promise<CompletedOrder> {
      const completedOrder = await this.completedOrdersRepository.findOne({
          where: { id },
          relations: ['items', 'items.product', 'table'],
      });
      if (!completedOrder) {
          throw new NotFoundException(`Completed Order with ID "${id}" not found`);
      }
      return completedOrder;
  }

  async findAllCompletedDate(dateString?: string): Promise<CompletedOrder[]> {
    const findOptions: any = { // FindManyOptions tipini kullanmak daha iyi ama basitlik için any
         relations: ['items', 'items.product', 'table'], // İhtiyaca göre ilişkiler
         order: { timestamp: 'DESC' } // En yeniden eskiye sırala
    };

    if (dateString) {
        try {
            // Gelen YYYY-MM-DD formatındaki string'i Date nesnesine çevir
            // Dikkat: Timezone sorunlarına yol açabilir. Backend ve DB'nin aynı timezone'da çalıştığını varsayıyoruz.
            // Veya UTC kullanmak daha güvenilir olabilir.
            const targetDate = new Date(dateString);

            // YYYY-MM-DD için başlangıç ve bitiş zamanlarını oluştur
            const startDate = new Date(targetDate);
            startDate.setHours(0, 0, 0, 0); // Günün başlangıcı

            const endDate = new Date(targetDate);
            endDate.setHours(23, 59, 59, 999); // Günün sonu

            // Where koşuluna timestamp filtresini ekle
            findOptions.where = {
                timestamp: Between(startDate, endDate)
            };
        } catch (e) {
            console.error("Invalid date string received:", dateString, e);
            // Hatalı formatta tarih gelirse boş döndür veya hata fırlat
            throw new BadRequestException('Invalid date format. Please use YYYY-MM-DD.');
        }
    }

    // Filtre uygulanmış veya uygulanmamış options ile sorguyu çalıştır
    return this.completedOrdersRepository.find(findOptions);
}

    // İleride finansal raporlar için:
  // async getDailySummaries(startDate: Date, endDate: Date): Promise<any> {
  //   // QueryBuilder kullanarak gruplama ve toplama işlemleri...
  // }

}