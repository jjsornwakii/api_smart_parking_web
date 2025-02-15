import { IsOptional, IsString, IsNotEmpty, IsInt, Min, Max, IsNumber } from "class-validator";

// option-configuration/dto/create-option.dto.ts
export class CreateOptionConfigDto {
  @IsOptional()
  @IsString()
  note_description?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(59)
  minute_rounding_threshold: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  exit_buffer_time: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  overflow_hour_rate: number;
}

// option-configuration/dto/update-option.dto.ts
export class UpdateOptionConfigDto {
  @IsOptional()
  @IsString()
  note_description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(59)
  minute_rounding_threshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  exit_buffer_time?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overflow_hour_rate?: number;
}