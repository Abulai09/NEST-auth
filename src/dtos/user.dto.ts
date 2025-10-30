import { IsString, MinLength } from 'class-validator';

export class userDto {
  @IsString()
  @MinLength(3, { message: 'Error' })
  email: string;
  @IsString()
  @MinLength(3, { message: 'Error' })
  password: string;
}
