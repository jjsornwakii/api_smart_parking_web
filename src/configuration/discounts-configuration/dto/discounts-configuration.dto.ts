import { IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional, IsBoolean } from "class-validator";
import { CustomerType } from "src/entities/discounts-configuration.entity";

// discounts-configuration/dto/create-discount.dto.ts
export class CreateDiscountConfigDto {
    @IsNotEmpty()
    @IsString()
    title: string;
  
    @IsNotEmpty()
    @IsEnum(CustomerType)
    customer_type: CustomerType;
  
    @IsNotEmpty()
    @IsNumber()
    min_purchase: number;
  
    @IsNotEmpty()
    @IsNumber()
    max_purchase: number;
  
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
  }
  
  // discounts-configuration/dto/update-discount.dto.ts
  export class UpdateDiscountConfigDto {
    @IsOptional()
    @IsString()
    title?: string;
  
    @IsOptional()
    @IsEnum(CustomerType)
    customer_type?: CustomerType;
  
    @IsOptional()
    @IsNumber()
    min_purchase?: number;
  
    @IsOptional()
    @IsNumber()
    max_purchase?: number;
  
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
  }