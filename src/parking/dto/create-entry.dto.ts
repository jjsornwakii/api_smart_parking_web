// src/parking/dto/create-entry.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CreateEntryDto {
  @IsString()
  licensePlate: string;

  @IsOptional()
  @IsString()
  imagePath?: string;
}