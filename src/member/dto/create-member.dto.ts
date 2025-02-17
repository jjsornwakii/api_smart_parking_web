import { IsString, IsNotEmpty } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  f_name: string;

  @IsString()
  @IsNotEmpty()
  l_name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}