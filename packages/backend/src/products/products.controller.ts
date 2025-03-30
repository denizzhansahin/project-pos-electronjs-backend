import {
  Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UsePipes, ValidationPipe, HttpCode, HttpStatus,
  UseGuards
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from 'src/dto/create-product.dto';
import { UpdateProductDto } from 'src/dto/update-product.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';


@Controller('products') // Bu kontrolör /products yolunu dinleyecek
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Roles(Role.ADMIN)
  @Post()
  @UsePipes(ValidationPipe) // DTO üzerindeki validasyonları otomatik uygular
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Roles(Role.ADMIN, Role.USER)
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Roles(Role.ADMIN, Role.USER)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { // ID'nin UUID formatında olmasını zorunlu kılar
    return this.productsService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id') // Veya Put
  @UsePipes(ValidationPipe)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Başarılı silmede 204 döner (içerik yok)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}