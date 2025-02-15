// configuration.module.ts
import { Module } from '@nestjs/common';
import { ConfigurationController } from './configuration.controller';
import { DiscountsConfigurationService } from './discounts-configuration/discounts-configuration.service';
import { OptionConfigurationService } from './option-configuration/option-configuration.service';
import { ParkingRatesConfigurationService } from './parking-rates-configuration/parking-rates-configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountConfigurationEntity } from '../entities/discounts-configuration.entity';
import { OptionConfigurationEntity } from '../entities/option-configuration.entity';
import { ParkingRatesConfigurationEntity } from '../entities/parking-rates-configuration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DiscountConfigurationEntity,
      OptionConfigurationEntity,
      ParkingRatesConfigurationEntity,
    ]),
  ],
  controllers: [ConfigurationController],
  providers: [
    DiscountsConfigurationService,
    OptionConfigurationService,
    ParkingRatesConfigurationService,
  ],
  exports: [
    DiscountsConfigurationService,
    OptionConfigurationService,
    ParkingRatesConfigurationService,
  ],
})
export class ConfigurationModule {}