import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Car } from "src/entities/car.entity";
import { EntryRecord } from "src/entities/entry-record.entity";
import { Repository, DataSource, IsNull, Not } from "typeorm";
import { CreateEntryDto } from "./dto/create-entry.dto";
import { EntryExitRecord } from "src/entities/entry-exit-record.entity";
import { Payment } from "src/entities/payment.entity";
import { OptionConfigurationEntity } from "src/entities/option-configuration.entity";

// src/parking/parking.service.ts
@Injectable()
export class ParkingService {

  private readonly HOURLY_RATE = 20;
  private readonly PAYMENT_VALID_MINUTES = 1;
  
  constructor(
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
    @InjectRepository(EntryRecord)
    private entryRecordRepository: Repository<EntryRecord>,
    @InjectRepository(EntryExitRecord)
    private entryExitRecordRepository: Repository<EntryExitRecord>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(OptionConfigurationEntity)
    private optionConfigRepository: Repository<OptionConfigurationEntity>,
    private dataSource: DataSource
  ) {}


  private async getConfiguration() {
    const config = await this.optionConfigRepository.findOne({
      order: { parking_option_id: 'DESC' } // Get the most recent configuration
    });

    if (!config) {
      // Fallback to default values if no configuration found
      return {
        minuteRoundingThreshold: 30, // Default 30 minutes
        exitBufferTime: 15, // Default 15 minutes
        overflowHourRate: 20 // Default 20 baht
      };
    }

    return {
      minuteRoundingThreshold: config.minute_rounding_threshold,
      exitBufferTime: config.exit_buffer_time,
      overflowHourRate: config.overflow_hour_rate
    };
  }

  private calculateRoundedHours(parkedTimeMs: number, minuteRoundingThreshold: number): number {
    const hours = parkedTimeMs / (1000 * 60 * 60);
    const integerHours = Math.floor(hours);
    const remainingMinutes = (hours - integerHours) * 60;

    // Round up if remaining minutes are above the threshold
    return remainingMinutes > minuteRoundingThreshold 
      ? integerHours + 1 
      : integerHours;
  }

  async createEntry(createEntryDto: CreateEntryDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      // 1. Find or create car
      let car = await this.carRepository.findOne({
        where: { license_plate: createEntryDto.licensePlate }
      });
  
      if (!car) {
        car = this.carRepository.create({
          license_plate: createEntryDto.licensePlate
        });
        await queryRunner.manager.save(car);
      }
  
      // 2. Create entry record
      const entryRecord = this.entryRecordRepository.create({
        car_id: car.car_id,
        entry_time: new Date(),
        entry_car_image_path: createEntryDto.imagePath
      });
      await queryRunner.manager.save(entryRecord);
  
      // 3. Create initial payment with null paid_at
      const initialPayment = this.paymentRepository.create({
        entry_record_id: entryRecord.entry_records_id,
        amount: 0,
        discount: 0,
        paid_at: null  // ตั้งค่าเป็น null
      });
      await queryRunner.manager.save(initialPayment);
  
      await queryRunner.commitTransaction();
  
      return {
        carId: car.car_id,
        entryRecordId: entryRecord.entry_records_id,
        paymentId: initialPayment.payment_id
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


  async findCarByLicensePlate(licensePlate: string) {
    const car = await this.carRepository.findOne({
      where: { license_plate: licensePlate },
      relations: ['member'] // ถ้าต้องการดึงข้อมูล member ด้วย
    });

    if (!car) {
      throw new NotFoundException(`ไม่พบรถทะเบียน ${licensePlate}`);
    }

    return car;
  }

  async getLatestEntry(licensePlate: string) {
    const entry = await this.entryRecordRepository
      .createQueryBuilder('entry')
      .innerJoin('entry.car', 'car')
      .where('car.license_plate = :licensePlate', { licensePlate })
      .orderBy('entry.entry_time', 'DESC')
      .getOne();

    if (!entry) {
      throw new NotFoundException(`ไม่พบประวัติการเข้าของรถทะเบียน ${licensePlate}`);
    }

    return entry;
  }

  async getEntryRecords(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const currentTime = new Date();
    const hourlyRate = 20; // บาทต่อชั่วโมง
  
    const [records, total] = await this.entryRecordRepository.findAndCount({
      relations: {
        car: true,
        payments: true
      },
      order: { entry_time: 'DESC' },
      skip,
      take: limit,
    });
  
    // แปลงข้อมูลพร้อมคำนวณค่าบริการและสถานะ VIP
    const processedRecords = records.map(record => {
      // คำนวณเวลาจอด
      const parkedTimeMs = currentTime.getTime() - record.entry_time.getTime();
      const parkedHours = Math.ceil(parkedTimeMs / (1000 * 60 * 60));
      const parkingFee = parkedHours * hourlyRate;
  
      // ตรวจสอบสถานะ VIP
      const isVip = record.car?.vip_expiry_date 
        ? new Date(record.car.vip_expiry_date) > currentTime 
        : false;
  
      return {
        ...record,
        parkedHours,
        parkingFee,
        isVip,
        car: {
          ...record.car,
          isVip
        }
      };
    });
  
    return {
      data: processedRecords,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  async getEntryExitRecords(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const currentTime = new Date();
    const hourlyRate = 20; // บาทต่อชั่วโมง
  
    const [records, total] = await this.entryExitRecordRepository.findAndCount({
      relations: {
        car: true,
        payments: true
      },
      order: { entry_time: 'DESC' },
      skip,
      take: limit,
    });
  
    // แปลงข้อมูลพร้อมคำนวณค่าบริการและสถานะ VIP
    const processedRecords = records.map(record => {
      // คำนวณเวลาจอด
      const parkedTimeMs = record.exit_time.getTime() - record.entry_time.getTime();
      const parkedHours = Math.ceil(parkedTimeMs / (1000 * 60 * 60));
      const parkingFee = parkedHours * hourlyRate;
  
      // ตรวจสอบสถานะ VIP
      const isVip = record.car?.vip_expiry_date 
        ? new Date(record.car.vip_expiry_date) > currentTime 
        : false;
  
      return {
        ...record,
        parkedHours,
        parkingFee,
        isVip,
        car: {
          ...record.car,
          isVip
        }
      };
    });
  
    return {
      data: processedRecords,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getAllParkingRecords(
    page: number = 1, 
    limit: number = 10, 
    sortBy: 'entry_time' | 'exit_time' = 'entry_time',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ) {

    // Get configuration
    const config = await this.getConfiguration();


    const skip = (page - 1) * limit;
    const currentTime = new Date();
    const hourlyRate = 20;
  
    // Fetch active entries (entry records)
    const [activeEntries, activeTotal] = await this.entryRecordRepository.findAndCount({
      relations: { car: true, payments: true },
      order: { 
        entry_time: sortOrder === 'DESC' ? 'DESC' : 'ASC' 
      },
      skip,
      take: limit
    });
  
    // Fetch completed entries (entry-exit records)
    const [completedEntries, completedTotal] = await this.entryExitRecordRepository.findAndCount({
      relations: { car: true, payments: true },
      order: { 
        exit_time: sortOrder === 'DESC' ? 'DESC' : 'ASC' 
      },
      skip,
      take: limit
    });
  
    // Process active entries
    const processedActiveEntries = activeEntries.map(entry => {
      const parkedTimeMs = currentTime.getTime() - entry.entry_time.getTime();
      const parkedHours = this.calculateRoundedHours(parkedTimeMs, config.minuteRoundingThreshold);
      const parkingFee = parkedHours * config.overflowHourRate;
  
      return {
        entry_records_id: entry.entry_records_id,
        car_id: entry.car_id,
        type: 'active',
        entry_time: entry.entry_time,
        exit_time: null,
        entry_car_image_path: entry.entry_car_image_path,
        car: {
          car_id: entry.car.car_id,
          license_plate: entry.car.license_plate,
          vip_expiry_date: entry.car.vip_expiry_date,
          member_id: entry.car.member_id,
          //isVip: entry.car.isVip
        },
        parked_hours: parkedHours,
        parking_fee: parkingFee,
        //isVip: entry.car.isVip,
        payments: entry.payments.map(payment => ({
          payment_id: payment.payment_id,
          entry_record_id: payment.entry_record_id,
          amount: payment.amount,
          discount: payment.discount,
          paid_at: payment.paid_at
        }))
      };
    });
  
    // Process completed entries
    const processedCompletedEntries = completedEntries.map(entry => {
      const parkedTimeMs = entry.exit_time.getTime() - entry.entry_time.getTime();
      const parkedHours = this.calculateRoundedHours(parkedTimeMs, config.minuteRoundingThreshold);
      const parkingFee = parkedHours * config.overflowHourRate;
      
      return {
        entry_exit_records_id: entry.entry_exit_records_id,
        car_id: entry.car_id,
        type: 'completed',
        entry_time: entry.entry_time,
        exit_time: entry.exit_time,
        entry_car_image_path: entry.entry_car_image_path,
        car: {
          car_id: entry.car.car_id,
          license_plate: entry.car.license_plate,
          vip_expiry_date: entry.car.vip_expiry_date,
          member_id: entry.car.member_id,
          //isVip: entry.car.isVip
        },
        parked_hours: parkedHours,
        parking_fee: parkingFee,
        //isVip: entry.car.isVip,
        payments: entry.payments.map(payment => ({
          payment_id: payment.payment_id,
          entry_exit_record_id: payment.entry_exit_record_id, 
          amount: payment.amount,
          discount: payment.discount,
          paid_at: payment.paid_at
        }))
      };
    });
  
    // Combine and sort entries
    const allEntries = [...processedActiveEntries, ...processedCompletedEntries]
      .sort((a, b) => {
        const timeA = sortBy === 'entry_time' ? a.entry_time : a.exit_time || a.entry_time;
        const timeB = sortBy === 'entry_time' ? b.entry_time : b.exit_time || b.entry_time;
        return sortOrder === 'DESC' 
          ? timeB.getTime() - timeA.getTime() 
          : timeA.getTime() - timeB.getTime();
      });
  
    return {
      data: allEntries,
      pagination: {
        current_page: page,
        page_size: limit,
        total_active_entries: activeTotal,
        total_completed_entries: completedTotal,
        total_entries: activeTotal + completedTotal
      }
    };
  }


  ///////////////////////////// PAYMENT //////////

  private async getLatestEntryAndCar(licensePlate: string) {
    const car = await this.carRepository.findOne({
      where: { license_plate: licensePlate }
    });

    if (!car) {
      throw new NotFoundException(`ไม่พบรถทะเบียน ${licensePlate}`);
    }

    const latestEntry = await this.entryRecordRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.payments', 'payments')
      .where('entry.car_id = :carId', { carId: car.car_id })
      .orderBy('entry.entry_time', 'DESC')
      .getOne();

    if (!latestEntry) {
      throw new NotFoundException(`ไม่พบประวัติการเข้าของรถทะเบียน ${licensePlate}`);
    }

    return { car, latestEntry };
  }

  async mockPayment(licensePlate: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      const { latestEntry } = await this.getLatestEntryAndCar(licensePlate);
  
      // หา payment ที่ยังไม่ได้จ่าย (amount = 0 และ paid_at = null)
      const unpaidPayment = await this.paymentRepository.findOne({
        where: { 
          entry_record_id: latestEntry.entry_records_id,
          amount: 0,
          paid_at: IsNull()
        }
      });
  
      if (!unpaidPayment) {
        throw new NotFoundException(`ไม่พบรายการค้างชำระของรถทะเบียน ${licensePlate}`);
      }
  
      const currentTime = new Date();
      const hoursDiff = Math.ceil(
        (currentTime.getTime() - latestEntry.entry_time.getTime()) / (1000 * 60 * 60)
      );
  
      // คำนวณค่าจอดและอัพเดทข้อมูลในเรคอร์ดเดิมโดยตรง
      let amount = (hoursDiff * this.HOURLY_RATE) - unpaidPayment.discount;
      amount = amount < 0 ? 0 : amount;
  
      // อัพเดทโดยใช้ Query Builder เพื่อให้แน่ใจว่าเป็นการอัพเดทเรคอร์ดเดิม
      await this.paymentRepository
        .createQueryBuilder()
        .update(Payment)
        .set({
          amount: amount,
          paid_at: currentTime
        })
        .where('payment_id = :id', { id: unpaidPayment.payment_id })
        .execute();
  
      await queryRunner.commitTransaction();
  
      // ดึงข้อมูลที่อัพเดทแล้วมาแสดง
      const updatedPayment = await this.paymentRepository.findOne({
        where: { payment_id: unpaidPayment.payment_id }
      });
  
      return {
        paymentId: updatedPayment.payment_id,
        licensePlate,
        amount: updatedPayment.amount,
        discount: updatedPayment.discount,
        paidAt: updatedPayment.paid_at,
        entryTime: latestEntry.entry_time,
        parkingHours: hoursDiff
      };
  
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async recordCarExit(licensePlate: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ดึงข้อมูลโดยใช้ relations
      const { car, latestEntry } = await this.getLatestEntryAndCar(licensePlate);

      // Check if any payment is needed
      const paymentStatus = await this.checkPaymentAmount(licensePlate);
      if (paymentStatus.needNewPayment &&  paymentStatus.newPaymentDetails.amount > 0) {
        throw new BadRequestException('ไม่สามารถออกได้: ต้องชำระค่าจอดรถเพิ่ม');
      }

      // Check for unpaid payments
      const hasUnpaidPayments = latestEntry.payments.some(p => p.paid_at === null);
      if (hasUnpaidPayments) {
        throw new BadRequestException('ไม่สามารถออกได้: มีรายการที่ยังไม่ได้ชำระ');
      }

      // Create entry-exit record
      const entryExitRecord = this.entryExitRecordRepository.create({
        car_id: car.car_id,
        entry_time: latestEntry.entry_time,
        exit_time: new Date(),
        entry_car_image_path: latestEntry.entry_car_image_path
      });

      // Save entry-exit record first to get ID
      await queryRunner.manager.save(entryExitRecord);

      // Update all payments to link with entry-exit record
      const payments = await this.paymentRepository.find({
        where: { entry_record_id: latestEntry.entry_records_id }
      });

      for (const payment of payments) {
        payment.entry_record_id = null;
        payment.entry_exit_record_id = entryExitRecord.entry_exit_records_id;
        await queryRunner.manager.save(payment);
      }

      // Now we can safely remove the entry record
      await queryRunner.manager.remove(latestEntry);

      await queryRunner.commitTransaction();

      // Load payments for response
      const savedEntryExit = await this.entryExitRecordRepository.findOne({
        where: { entry_exit_records_id: entryExitRecord.entry_exit_records_id },
        relations: ['payments']
      });

      return {
        success: true,
        licensePlate,
        entryExitRecordId: entryExitRecord.entry_exit_records_id,
        entryTime: savedEntryExit.entry_time,
        exitTime: savedEntryExit.exit_time,
        payments: savedEntryExit.payments.map(p => ({
          paymentId: p.payment_id,
          amount: p.amount,
          paidAt: p.paid_at
        }))
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getPaymentHistory(licensePlate: string) {
    // ค้นหารถ
    const car = await this.carRepository.findOne({
      where: { license_plate: licensePlate }
    });

    if (!car) {
      throw new NotFoundException(`ไม่พบรถทะเบียน ${licensePlate}`);
    }

    // ดึงข้อมูลการเข้าจอดที่ยังไม่ได้ออก พร้อม payments
    const activeEntries = await this.entryRecordRepository.find({
      where: { car_id: car.car_id },
      relations: ['payments'],
      order: { entry_time: 'DESC' }
    });

    // ดึงข้อมูลการเข้า-ออกที่สมบูรณ์แล้ว พร้อม payments
    const completedEntries = await this.entryExitRecordRepository.find({
      where: { car_id: car.car_id },
      relations: ['payments'],
      order: { exit_time: 'DESC' }
    });

    // แปลงข้อมูลสำหรับ response
    const processActiveEntries = activeEntries.map(entry => ({
      type: 'active',
      entryTime: entry.entry_time,
      exitTime: null,
      payments: entry.payments
        .sort((a, b) => (b.paid_at?.getTime() || 0) - (a.paid_at?.getTime() || 0))
        .map(payment => ({
          paymentId: payment.payment_id,
          amount: payment.amount,
          discount: payment.discount,
          paidAt: payment.paid_at
        }))
    }));

    const processCompletedEntries = completedEntries.map(entry => ({
      type: 'completed',
      entryTime: entry.entry_time,
      exitTime: entry.exit_time,
      payments: entry.payments
        .sort((a, b) => (b.paid_at?.getTime() || 0) - (a.paid_at?.getTime() || 0))
        .map(payment => ({
          paymentId: payment.payment_id,
          amount: payment.amount,
          discount: payment.discount,
          paidAt: payment.paid_at
        }))
    }));

    // คำนวณสรุปข้อมูล
    const allPayments = [...activeEntries, ...completedEntries]
      .flatMap(entry => entry.payments);

    const totalAmount = allPayments
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return {
      licensePlate,
      activeRecords: processActiveEntries,
      completedRecords: processCompletedEntries,
      summary: {
        totalEntries: activeEntries.length + completedEntries.length,
        totalPayments: allPayments.length,
        totalAmount: totalAmount
      }
    };
  }

  async checkPaymentAmount(licensePlate: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      const { latestEntry } = await this.getLatestEntryAndCar(licensePlate);
      const currentTime = new Date();
      let startTime = latestEntry.entry_time;
      let needNewPayment = true;
  
      // Find the latest paid payment
      const lastPaidPayment = await this.paymentRepository.findOne({
        where: { 
          entry_record_id: latestEntry.entry_records_id,
          paid_at: Not(IsNull())
        },
        order: { paid_at: 'DESC' }
      });
  
      // Find any unpaid payment record
      const unPaidPayment = await this.paymentRepository.findOne({
        where: { 
          entry_record_id: latestEntry.entry_records_id,
          paid_at: IsNull()
        }
      });
  
      // Check if the last payment is still valid
      if (lastPaidPayment) {
        const paymentValidUntil = new Date(lastPaidPayment.paid_at);
        paymentValidUntil.setMinutes(paymentValidUntil.getMinutes() + this.PAYMENT_VALID_MINUTES);
  
        if (currentTime <= paymentValidUntil) {
          startTime = lastPaidPayment.paid_at;
          needNewPayment = false;
        }
      }
  
      // Calculate parking duration
      const hoursDiff = Math.ceil(
        (currentTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
      );
      const amount = hoursDiff * this.HOURLY_RATE;
  
      // Create a new initial payment record only if:
      // 1. A new payment is needed
      // 2. There are no existing unpaid payment records
      if (needNewPayment && !unPaidPayment) {
        const newInitialPayment = this.paymentRepository.create({
          entry_record_id: latestEntry.entry_records_id,
          amount: 0,
          // Only use discount if lastPaidPayment exists
          discount: lastPaidPayment?.discount || 0, 
          paid_at: null
        });
        await queryRunner.manager.save(newInitialPayment);
      }
  
      await queryRunner.commitTransaction();
  
      return {
        licensePlate,
        entryTime: latestEntry.entry_time,
        lastPayment: lastPaidPayment ? {
          paymentId: lastPaidPayment.payment_id,
          amount: lastPaidPayment.amount,
          paidAt: lastPaidPayment.paid_at,
          validUntil: new Date(new Date(lastPaidPayment.paid_at).getTime() + this.PAYMENT_VALID_MINUTES * 60000)
        } : null,
        currentTime,
        needNewPayment,
        newPaymentDetails: needNewPayment ? {
          startTime,
          parkedHours: hoursDiff,
          amount: amount < 0 ? 0 : amount,
          discount: 0  // Reset discount for new calculation
        } : null
      };
  
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}