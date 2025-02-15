import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DiscountConfigurationEntity, CreateDiscountConfigDto, CustomerType, UpdateDiscountConfigDto } from "src/entities/discounts-configuration.entity";
import { Repository } from "typeorm";

// discounts-configuration.service.ts
@Injectable()
export class DiscountsConfigurationService {
  constructor(
    @InjectRepository(DiscountConfigurationEntity)
    private discountRepo: Repository<DiscountConfigurationEntity>,
  ) {}

  async create(data: CreateDiscountConfigDto) {
    const discount = this.discountRepo.create(data);
    const result = await this.discountRepo.save(discount);
    return {
      status: 201,
      message: 'Discount created successfully',
      data: result
    };
  }

  async findAll() {
    const discounts = await this.discountRepo.find();
    return {
      status: 200,
      message: 'Discounts retrieved successfully',
      data: discounts
    };
  }

  async findOne(id: number) {
    const discount = await this.discountRepo.findOne({ where: { discount_id: id } });
    if (!discount) {
      throw new HttpException('Discount not found', HttpStatus.NOT_FOUND);
    }
    return {
      status: 200,
      message: 'Discount retrieved successfully',
      data: discount
    };
  }

  async findByCustomerType(customerType: CustomerType) {
    const discounts = await this.discountRepo.find({
      where: [
        { customer_type: customerType },
        { customer_type: CustomerType.ALL }
      ],
      order: { min_purchase: 'ASC' }
    });
    return {
      status: 200,
      message: 'Discounts retrieved successfully',
      data: discounts
    };
  }

  async update(id: number, data: UpdateDiscountConfigDto) {
    await this.discountRepo.update(id, data);
    const updated = await this.discountRepo.findOne({ where: { discount_id: id } });
    return {
      status: 200,
      message: 'Discount updated successfully',
      data: updated
    };
  }

  async delete(id: number) {
    const discount = await this.findOne(id);
    await this.discountRepo.delete(id);
    return {
      status: 200,
      message: 'Discount deleted successfully'
    };
  }
}