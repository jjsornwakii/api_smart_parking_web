import { IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional, IsInt, Min, IsBoolean } from "class-validator";
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// discounts-configuration/entities/discount-configuration.entity.ts
export enum CustomerType {
    ALL = 'ALL',
    VIP = 'VIP',
    GENERAL = 'GENERAL',
  }
  
  // discounts-configuration/entities/discount-configuration.entity.ts
@Entity('discounts_configuration')
export class DiscountConfigurationEntity {
  @PrimaryGeneratedColumn()
  discount_id: number;

  @Column({ type: 'text' })
  title: string;

  @Column({ 
    type: 'enum', 
    enum: CustomerType,
    default: CustomerType.ALL
  })
  customer_type: CustomerType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  min_purchase: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  max_purchase: number;

  @Column({ type: 'int', default: 0 })
  free_hours: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}

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
  @IsInt()
  @Min(0)
  free_hours?: number = 0;

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
  @IsInt()
  @Min(0)
  free_hours?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}