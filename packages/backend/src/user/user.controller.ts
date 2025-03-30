import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { Role } from 'src/auth/enums/role.enum';
import { Roles, ROLES_KEY } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Public } from 'src/auth/decorators/public.decorator';



@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Req() req){
    return this.userService.findOne(req.user.id)
  }

   //@Public()
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  //@SetMetadata('role',(Role.ADMIN))
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
