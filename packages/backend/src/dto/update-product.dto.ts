import { PartialType } from '@nestjs/mapped-types'; // Veya @nestjs/swagger
import { CreateProductDto } from './create-product.dto';

// PartialType, CreateProductDto'daki tüm alanları opsiyonel yapar.
export class UpdateProductDto extends PartialType(CreateProductDto) {}