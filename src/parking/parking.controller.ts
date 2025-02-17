// src/parking/parking.controller.ts
import { 
    Controller, 
    Post, 
    Get,
    Body,
    Param,
    HttpException,
    HttpStatus, 
    Query,
    HttpCode,
    UploadedFile,
    UseInterceptors
  } from '@nestjs/common';
  import { ParkingService } from './parking.service';
  import { CreateEntryDto } from './dto/create-entry.dto';
import { PaginationDto } from './dto/pagination.dto';
import { LicensePlateDto } from './dto/license-plate.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';

import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as moment from 'moment';
  
  @Controller('parking')
  export class ParkingController {
    dataSource: any;
    paymentRepository: any;
    entryRepository: any;
    entryExitRepository: any;
    constructor(private readonly parkingService: ParkingService) {}
  
    @Post('entry')
    async createEntry(@Body() createEntryDto: CreateEntryDto) {
      try {
        const result = await this.parkingService.createEntry(createEntryDto);
        return {
          success: true,
          data: result,
          message: 'บันทึกข้อมูลรถเข้าสำเร็จ'
        };
      } catch (error) {
        throw new HttpException({
          success: false,
          message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
          error: error.message
        }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    @Post('entry-raspi')
@UseInterceptors(FileInterceptor('image', {
  storage: diskStorage({
    destination: (req, file, callback) => {
      const today = moment().format('DDMMYYYY'); // รูปแบบ 12022025
      const uploadRoot = './uploads'; // โฟลเดอร์หลัก
      const uploadPath = `${uploadRoot}/${today}`; // โฟลเดอร์ของวันนั้นๆ

      // ตรวจสอบและสร้าง /uploads ถ้าไม่มี
      if (!fs.existsSync(uploadRoot)) {
        fs.mkdirSync(uploadRoot, { recursive: true });
      }

      // ตรวจสอบและสร้างโฟลเดอร์ของวันนั้นๆ
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      callback(null, uploadPath);
    },
    filename: (req, file, callback) => {
      const licensePlate = req.body.licensePlate.replace(/\s+/g, '_'); // เอาชื่อทะเบียนมาใช้ ตั้งชื่อไฟล์
      const timestamp = moment().format('HHmmss'); // เวลา 140523
      const fileExt = extname(file.originalname);
      const fileName = `${licensePlate}_${timestamp}${fileExt}`;
      callback(null, fileName);
    }
  })
}))
async createEntryRaspi(
  @UploadedFile() file: Express.Multer.File,
  @Body() createEntryDto: CreateEntryDto
) {
  try {
    if (file) {
      const today = moment().format('DDMMYYYY');
      createEntryDto.imagePath = `/uploads/${today}/${file.filename}`;
    }

    const result = await this.parkingService.createEntry(createEntryDto);
    return {
      success: true,
      data: result,
      message: 'บันทึกข้อมูลรถเข้าสำเร็จ'
    };
  } catch (error) {
    throw new HttpException({
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
      error: error.message
    }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

  
    @Get('car/:licensePlate')
    async findCarByLicensePlate(@Param('licensePlate') licensePlate: string) {
      try {
        const car = await this.parkingService.findCarByLicensePlate(licensePlate);
        return {
          success: true,
          data: car
        };
      } catch (error) {
        throw new HttpException({
          success: false,
          message: 'ไม่พบข้อมูลรถ',
          error: error.message
        }, HttpStatus.NOT_FOUND);
      }
    }
  
    @Get('entry/latest/:licensePlate')
    async getLatestEntry(@Param('licensePlate') licensePlate: string) {
      try {
        const entry = await this.parkingService.getLatestEntry(licensePlate);
        return {
          success: true,
          data: entry
        };
      } catch (error) {
        throw new HttpException({
          success: false,
          message: 'ไม่พบข้อมูลการเข้าล่าสุด',
          error: error.message
        }, HttpStatus.NOT_FOUND);
      }
    }

    @Get('entry-records')
  async getEntryRecords(@Query() paginationDto: PaginationDto) {
    try {
      const records = await this.parkingService.getEntryRecords(
        paginationDto.page,
        paginationDto.limit
      );
      return {
        success: true,
        ...records
      };
    } catch (error) {
      throw new HttpException({
        success: false,
        message: 'ไม่สามารถดึงข้อมูลได้',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('entry-exit-records')
  async getEntryExitRecords(@Query() paginationDto: PaginationDto) {
    try {
      const records = await this.parkingService.getEntryExitRecords(
        paginationDto.page,
        paginationDto.limit
      );
      return {
        success: true,
        ...records
      };
    } catch (error) {
      throw new HttpException({
        success: false,
        message: 'ไม่สามารถดึงข้อมูลได้',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  @Get('records')
  async getAllParkingRecords(
   @Query('page') page?: number,
   @Query('limit') limit?: number,
   @Query('sortBy') sortBy?: 'entry_time' | 'exit_time',
   @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ) {
   return this.parkingService.getAllParkingRecords(
     page || 1, 
     limit || 10, 
     sortBy || 'entry_time', 
     sortOrder || 'DESC'
   );
  }



  /////////////////////// PAYMENT /////////////////////////
  


  // @Get('check-payment/:licensePlate')
  // async checkPaymentStatus(@Param('licensePlate') licensePlate: string) {
  //   try {
  //     const result = await this.parkingService.checkPaymentStatus(licensePlate);
  //     return {
  //       success: true,
  //       data: result
  //     };
  //   } catch (error) {
  //     throw new HttpException({
  //       success: false,
  //       message: 'เกิดข้อผิดพลาดในการตรวจสอบการชำระเงิน',
  //       error: error.message
  //     }, HttpStatus.INTERNAL_SERVER_ERROR);
  //   }
  // }

  @Post('payment/mock')
  @HttpCode(HttpStatus.OK)
  async mockPayment(@Body() { licensePlate }: LicensePlateDto) {
    try {
      const result = await this.parkingService.mockPayment(licensePlate);
      return {
        success: true,
        data: result,
        message: 'ชำระเงินสำเร็จ'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException({
        success: false,
        message: 'เกิดข้อผิดพลาดในการชำระเงิน',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('payment/check')
  async checkPaymentAmount(@Body() { licensePlate }: LicensePlateDto) {
    try {
      const result = await this.parkingService.checkPaymentAmount(licensePlate);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException({
        success: false,
        message: 'เกิดข้อผิดพลาดในการตรวจสอบค่าจอดรถ',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('exit')
  @HttpCode(HttpStatus.OK)
  async recordCarExit(@Body() { licensePlate }: LicensePlateDto) {
    try {
      const result = await this.parkingService.recordCarExit(licensePlate);
      return {
        success: true,
        data: result,
        message: 'บันทึกการออกสำเร็จ'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException({
        success: false,
        message: 'เกิดข้อผิดพลาดในการบันทึกการออก',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  @Get('paymenthistory/:licensePlate')
  async getPaymentHistory(
    @Param('licensePlate') licensePlate: string
  ) {
    return this.parkingService.getPaymentHistory(licensePlate);
  }


 
}