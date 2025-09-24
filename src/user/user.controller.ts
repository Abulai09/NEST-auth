import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/guards/jwtAuthGuard';
import { RolesGuard } from 'src/guards/RolesGuard';
import { Roles } from 'src/guards/roleDecorator';
import { userDto } from './userDto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(private userServ: UserService) {}

  @ApiOperation({
    summary: 'Получить список всех пользователей (только админ)',
  })
  @ApiResponse({ status: 200, description: 'Успешно', type: [userDto] })
  @ApiResponse({ status: 403, description: 'Нет доступа' })
  @Get('getAll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAll() {
    return await this.userServ.getAll();
  }

  @ApiOperation({
    summary: 'Обновить данные пользователя по ID (только админ)',
  })
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно обновлён',
    type: userDto,
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @Put('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Body() dto: userDto, @Param('id') id: number) {
    return await this.userServ.update(dto, Number(id));
  }

  @ApiOperation({ summary: 'Удалить пользователя по ID (только админ)' })
  @ApiResponse({ status: 200, description: 'Пользователь успешно удалён' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async delete(@Param('id') id: number) {
    return await this.userServ.delete(id);
  }
}
