import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class userDto {
  @ApiPropertyOptional({
    description: 'Имя пользователя',
    minLength: 3,
    example: 'Baqtiyar',
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: ' Should be min 3' })
  username?: string;

  @ApiPropertyOptional({
    description: 'Пароль пользователя',
    minLength: 6,
    example: 'secret123',
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: ' Should be min 6' })
  password?: string;
}
