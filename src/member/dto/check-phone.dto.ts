import { IsString, IsNotEmpty } from 'class-validator';

export class CheckPhoneDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}