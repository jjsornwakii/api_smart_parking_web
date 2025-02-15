import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { OptionConfigurationEntity } from "src/entities/option-configuration.entity";
import { Repository } from "typeorm";
import { UpdateOptionConfigDto } from "./dto/option-configuration.dto";

@Injectable()
export class OptionConfigurationService {
  private readonly DEFAULT_ID = 1;
  private readonly DEFAULT_OPTION = {
    parking_option_id: 1,
    note_description: "Default parking options",
    minute_rounding_threshold: 0, 
    exit_buffer_time: 30,
    overflow_hour_rate: 0
  };

  constructor(
    @InjectRepository(OptionConfigurationEntity)
    private optionRepo: Repository<OptionConfigurationEntity>,
  ) {}

  async getOption() {
    let option = await this.optionRepo.findOne({ 
      where: { parking_option_id: this.DEFAULT_ID } 
    });

    if (!option) {
      // ถ้ายังไม่มีข้อมูล ให้สร้าง default
      option = await this.optionRepo.save(this.DEFAULT_OPTION);
    }

    return {
      status: 200,
      message: 'Option retrieved successfully',
      data: option
    };
  }

  async updateOption(id: number, data: UpdateOptionConfigDto) {
    // Validate minute_rounding_threshold
    if (data.minute_rounding_threshold) {
      if (data.minute_rounding_threshold < 1 || data.minute_rounding_threshold > 59) {
        throw new HttpException(
          'minute_rounding_threshold must be between 1 and 59',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    let option = await this.optionRepo.findOne({ 
      where: { parking_option_id: id } 
    });

    if (!option) {
      // ถ้ายังไม่มีข้อมูล ให้สร้าง default ก่อนแล้วค่อย update
      option = await this.optionRepo.save({
        ...this.DEFAULT_OPTION,
        parking_option_id: id
      });
    }

    await this.optionRepo.update(id, data);
    const updated = await this.optionRepo.findOne({
      where: { parking_option_id: id }
    });

    return {
      status: 200,
      message: 'Option updated successfully',
      data: updated
    };
  }
}