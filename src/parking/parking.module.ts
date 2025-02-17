// src/parking/parking.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingController } from './parking.controller';
import { ParkingService } from './parking.service';
import { Car } from '../entities/car.entity';
import { EntryRecord } from '../entities/entry-record.entity';
import { EntryExitRecord } from '../entities/entry-exit-record.entity';
import { Payment } from '../entities/payment.entity';
import { OptionConfigurationEntity } from 'src/entities/option-configuration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Car, 
      EntryRecord, 
      EntryExitRecord,
      Payment,
      OptionConfigurationEntity // Add this line

    ])
  ],
  controllers: [ParkingController],
  providers: [ParkingService]
})
export class ParkingModule {}