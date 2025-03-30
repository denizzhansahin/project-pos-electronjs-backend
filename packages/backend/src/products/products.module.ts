import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from 'src/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product])], // Bu modülün Product entity'sini kullanacağını belirtir
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService] // Başka modüllerin kullanması gerekirse
})
export class ProductsModule {}