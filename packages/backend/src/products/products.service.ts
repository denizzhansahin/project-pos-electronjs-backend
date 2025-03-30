import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProductDto } from 'src/dto/create-product.dto';
import { UpdateProductDto } from 'src/dto/update-product.dto';
import { Product } from 'src/entities/product.entity';
import { Repository } from 'typeorm';


@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const newProduct = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(newProduct);
  }

  async findAll(): Promise<Product[]> {
    return this.productsRepository.find();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    // preload: ID ile eşleşen entity'yi bulur ve DTO'daki verilerle günceller, bulamazsa undefined döner.
    const product = await this.productsRepository.preload({
      id: id,
      ...updateProductDto,
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const result = await this.productsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
  }
}