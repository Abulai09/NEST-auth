import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class authDto {
  @ApiPropertyOptional({
    description: 'Имя пользователя',
    minLength: 3,
    example: 'Baqtiyar',
  })
  @IsString()
  @MinLength(3, { message: ' Should be min 3' })
  username: string;

  @ApiPropertyOptional({
    description: 'Пароль пользователя',
    minLength: 6,
    example: 'secret123',
  })
  @IsString()
  @MinLength(6, { message: ' Should be min 6' })
  password: string;
}
