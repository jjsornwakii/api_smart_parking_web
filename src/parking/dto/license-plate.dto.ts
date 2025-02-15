// src/parking/dto/license-plate.dto.ts
import { IsString, MinLength } from 'class-validator';

export class LicensePlateDto {
  @IsString()
  @MinLength(2, { message: 'เลขทะเบียนต้องมีความยาวอย่างน้อย 2 ตัวอักษร' })
  licensePlate: string;
}