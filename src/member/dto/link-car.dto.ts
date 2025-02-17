import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from "class-validator";

export class LinkCarDto {
    @IsString()
    @IsNotEmpty()
    phone: string;
  
    @IsString()
    @IsNotEmpty()
    licenseplate: string;
  
    @IsOptional()
    @IsNumber()
    @Min(0)
    vip_days?: number;
  }