import { ConflictException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTableDto } from 'src/dto/create-table.dto';
import { UpdateTableDto } from 'src/dto/update-table.dto';
import { CompletedOrder } from 'src/entities/completed-order.entity';
import { OrderItem } from 'src/entities/order-item.entity';
import { Table, TableStatus } from 'src/entities/table.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class TablesService {
  private readonly logger = new Logger(TablesService.name);

  constructor(
    @InjectRepository(Table)
    private tablesRepository: Repository<Table>,
    @InjectRepository(OrderItem) // Table status güncellemek için lazım olabilir
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(CompletedOrder) // CompletedOrder Repository ekle
    private completedOrdersRepository: Repository<CompletedOrder>,
    private readonly entityManager: EntityManager, // Transaction için


  ) {}

  
  async create(createTableDto: CreateTableDto): Promise<Table> {
    const existingTable = await this.tablesRepository.findOneBy({ name: createTableDto.name });
    if (existingTable) {
      // İsteğe bağlı: Aynı isimde masa varsa hata fırlat
      // throw new ConflictException(`Table with name "${createTableDto.name}" already exists`);
    }
    const newTable = this.tablesRepository.create(createTableDto);
    return this.tablesRepository.save(newTable);
  }




  async findAll(): Promise<Table[]> {
    // 'order' ilişkisini yüklemek isteyebilirsiniz, performansa dikkat!
    return this.tablesRepository.find({ relations: ['order', 'order.product'] });
  }

  async findOne(id: string): Promise<Table> {
    const table = await this.tablesRepository.findOne({
       where: { id },
       relations: ['order', 'order.product'] // Aktif siparişi de getir
    });
    if (!table) {
      throw new NotFoundException(`Table with ID "${id}" not found`);
    }
    return table;
  }

   async findOneSimple(id: string): Promise<Table> {
    const table = await this.tablesRepository.findOneBy({ id });
    if (!table) {
      throw new NotFoundException(`Table with ID "${id}" not found`);
    }
    return table;
  }

  async update(id: string, updateTableDto: UpdateTableDto): Promise<Table> {
    const table = await this.tablesRepository.preload({
      id: id,
      ...updateTableDto,
    });
    if (!table) {
      throw new NotFoundException(`Table with ID "${id}" not found`);
    }
    return this.tablesRepository.save(table);
  }

  async remove(id: string): Promise<void> {
     // İlişkili OrderItem'ları da silmek için önce onları bulup silmek veya cascade kullanmak gerekir.
     // Eğer Table entity'sinde OrderItem ilişkisinde { cascade: true } varsa, TypeORM halleder.
     // Yoksa manuel silme:
     // await this.orderItemsRepository.delete({ tableId: id });

    const result = await this.tablesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Table with ID "${id}" not found`);
    }
  }

  // Yardımcı fonksiyon: Masa durumunu güncelle
  async updateTableStatus(tableId: string): Promise<Table> {
     const table = await this.findOneSimple(tableId); // Sadece masa bilgisi yeterli
     const orderItemCount = await this.orderItemsRepository.count({ where: { tableId: tableId } });
     const newStatus: TableStatus = orderItemCount > 0 ? 'occupied' : 'empty';

     if (table.status !== newStatus) {
        table.status = newStatus;
        return this.tablesRepository.save(table);
     }
     return table; // Durum değişmediyse tekrar kaydetmeye gerek yok
  }
}