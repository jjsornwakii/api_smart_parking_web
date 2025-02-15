import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ParkingRatesConfigurationEntity } from "src/entities/parking-rates-configuration.entity";
import { Repository } from "typeorm";
import { CreateParkingRateDto, UpdateParkingRateDto } from "./dto/parking-rates-configuration.dto";

// parking-rates-configuration.service.ts
@Injectable()
export class ParkingRatesConfigurationService {
  constructor(
    @InjectRepository(ParkingRatesConfigurationEntity)
    private rateRepo: Repository<ParkingRatesConfigurationEntity>,
  ) {}

  async create(data: CreateParkingRateDto) {
    const existing = await this.rateRepo.findOne({ where: { hours: data.hours } });
    if (existing) {
      throw new HttpException('Hour rate already exists', HttpStatus.BAD_REQUEST);
    }
    const rate = this.rateRepo.create(data);
    const result = await this.rateRepo.save(rate);
    return {
      status: 201,
      message: 'Rate created successfully',
      data: result
    };
  }

  async findAll() {
    const rates = await this.rateRepo.find({
      order: { hours: 'ASC' }
    });
    return {
      status: 200,
      message: 'Rates retrieved successfully',
      data: rates
    };
  }

  async findOne(hours: number) {
    const rate = await this.rateRepo.findOne({ where: { hours } });
    if (!rate) {
      throw new HttpException('Rate not found', HttpStatus.NOT_FOUND);
    }
    return {
      status: 200,
      message: 'Rate retrieved successfully',
      data: rate
    };
  }

  async update(hours: number, data: UpdateParkingRateDto) {
    await this.rateRepo.update(hours, data);
    const updated = await this.rateRepo.findOne({ where: { hours } });
    return {
      status: 200,
      message: 'Rate updated successfully',
      data: updated
    };
  }

  async delete(hours: number) {
    const rate = await this.findOne(hours);
    await this.rateRepo.delete(hours);
    return {
      status: 200,
      message: 'Rate deleted successfully'
    };
  }
}