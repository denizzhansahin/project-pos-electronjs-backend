import {
    Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UsePipes, ValidationPipe, HttpCode, HttpStatus
  } from '@nestjs/common';
  import { TablesService } from './tables.service';
import { CreateTableDto } from 'src/dto/create-table.dto';
import { UpdateTableDto } from 'src/dto/update-table.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';

  
  @Controller('tables')
  export class TablesController {
    constructor(private readonly tablesService: TablesService) {}
  
    @Roles(Role.ADMIN, Role.USER)
    @Post()
    @UsePipes(ValidationPipe)
    create(@Body() createTableDto: CreateTableDto) {
      return this.tablesService.create(createTableDto);
    }
  
    @Roles(Role.ADMIN, Role.USER)
    @Get()
    findAll() {
      // Frontend'de masa listesi + sipariş özeti gösteriliyorsa bu endpoint kullanılabilir
      return this.tablesService.findAll();
    }
  
    @Roles(Role.ADMIN, Role.USER)
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
      // Masa detayını (aktif siparişiyle birlikte) almak için
      return this.tablesService.findOne(id);
    }
  
    @Roles(Role.ADMIN, Role.USER)
    @Patch(':id')
    @UsePipes(ValidationPipe)
    update(@Param('id', ParseUUIDPipe) id: string, @Body() updateTableDto: UpdateTableDto) {
      return this.tablesService.update(id, updateTableDto);
    }
  
    @Roles(Role.ADMIN, Role.USER)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseUUIDPipe) id: string) {
      return this.tablesService.remove(id);
    }
  }