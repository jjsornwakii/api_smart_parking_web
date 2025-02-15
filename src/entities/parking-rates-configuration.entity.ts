// parking-rates-configuration/entities/parking-rates-configuration.entity.ts
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('parking_rates_configuration')
export class ParkingRatesConfigurationEntity {
 @PrimaryColumn()
 hours: number;

 @Column({ 
   type: 'decimal', 
   precision: 10, 
   scale: 2 
 })
 rate_at_hour: number;
}