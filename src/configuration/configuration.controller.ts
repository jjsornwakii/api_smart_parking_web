// configuration.controller.ts
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { DiscountsConfigurationService } from './discounts-configuration/discounts-configuration.service';
import { OptionConfigurationService } from './option-configuration/option-configuration.service';
import { ParkingRatesConfigurationService } from './parking-rates-configuration/parking-rates-configuration.service';
import { CreateDiscountConfigDto, UpdateDiscountConfigDto } from './discounts-configuration/dto/discounts-configuration.dto';
import { CreateOptionConfigDto, UpdateOptionConfigDto } from './option-configuration/dto/option-configuration.dto';
import { CreateParkingRateDto, UpdateParkingRateDto } from './parking-rates-configuration/dto/parking-rates-configuration.dto';

@Controller('configuration')
export class ConfigurationController {
  constructor(
    private readonly discountsService: DiscountsConfigurationService,
    private readonly optionService: OptionConfigurationService,
    private readonly parkingRatesService: ParkingRatesConfigurationService,
  ) {}

  // Discounts Configuration
  @Get('discounts')
  getAllDiscounts() {
    return this.discountsService.findAll();
  }

  @Get('discounts/:id')
  getDiscount(@Param('id') id: number) {
    return this.discountsService.findOne(id);
  }

  @Post('discounts')
  createDiscount(@Body() createDiscountDto: CreateDiscountConfigDto) {
    return this.discountsService.create(createDiscountDto);
  }

  @Put('discounts/:id')
  updateDiscount(
    @Param('id') id: number,
    @Body() updateDiscountDto: UpdateDiscountConfigDto,
  ) {
    return this.discountsService.update(id, updateDiscountDto);
  }

  @Delete('discounts/:id')
  deleteDiscount(@Param('id') id: number) {
    return this.discountsService.delete(id);
  }

  // Option Configuration

  @Get('options')
  getAllOptions() {
    return this.optionService.getOption();
  }


  @Put('options/:id')
  async updateOption(
    @Param('id') id: number, 
    @Body() updateOptionConfigDto: UpdateOptionConfigDto
  ) {
    return this.optionService.updateOption(id, updateOptionConfigDto);
  }


//   @Get('options')
//   getAllOptions() {
//     return this.optionService.findAll();
//   }

//   @Get('options/:id')
//   getOption(@Param('id') id: number) {
//     return this.optionService.findOne(id);
//   }

//   @Post('options')
//   createOption(@Body() createOptionDto: CreateOptionConfigDto) {
//     return this.optionService.create(createOptionDto);
//   }

//   @Put('options/:id')
//   updateOption(
//     @Param('id') id: number,
//     @Body() updateOptionDto: UpdateOptionConfigDto,
//   ) {
//     return this.optionService.update(id, updateOptionDto);
//   }

//   @Delete('options/:id')
//   deleteOption(@Param('id') id: number) {
//     return this.optionService.delete(id);
//   }

  // Parking Rates Configuration
  @Get('rates')
  getAllRates() {
    return this.parkingRatesService.findAll();
  }

  @Get('rates/:hours')
  getRate(@Param('hours') hours: number) {
    return this.parkingRatesService.findOne(hours);
  }

  @Post('rates')
  createRate(@Body() createRateDto: CreateParkingRateDto) {
    return this.parkingRatesService.create(createRateDto);
  }

  @Put('rates/:hours')
  updateRate(
    @Param('hours') hours: number,
    @Body() updateRateDto: UpdateParkingRateDto,
  ) {
    return this.parkingRatesService.update(hours, updateRateDto);
  }

  @Delete('rates/:hours')
  deleteRate(@Param('hours') hours: number) {
    return this.parkingRatesService.delete(hours);
  }
}
