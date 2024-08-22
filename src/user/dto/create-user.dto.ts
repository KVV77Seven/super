import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
