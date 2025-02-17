import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../entities/member.entity';
import { Car } from '../entities/car.entity';
import { LinkCarDto } from './dto/link-car.dto';
import { CreateMemberDto } from './dto/create-member.dto';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
  ) {}

  // Register a new member
  async registerMember(memberData: CreateMemberDto) {
    // Check if member with this phone number already exists
    const existingMember = await this.memberRepository.findOne({
      where: { phone: memberData.phone }
    });
  
    if (existingMember) {
      return {
        status: false,
        message: 'Phone number is already in use',
        member_id: existingMember.member_id
      };
    }
  
    // Create new member
    const newMember = this.memberRepository.create({
      f_name: memberData.f_name,
      l_name: memberData.l_name,
      phone: memberData.phone
    });
  
    // Save the new member
    const savedMember = await this.memberRepository.save(newMember);
  
    return {
      status: true,
      message: 'Member registered successfully',
      member_id: savedMember.member_id
    };
  }

  // Check phone number and get associated cars
  async checkPhoneNumber(phone: string) {

    if (!phone) {
        throw new BadRequestException('phone number is required');
      }
    // Find member by phone
    const member = await this.memberRepository.findOne({
      where: { phone }
    });

    if (member) {
      // Find all cars for this member
      const existingCars = await this.carRepository.find({
        where: { member_id: member.member_id }
      });

      // Transform car details with expiry information
      const carDetails = existingCars.map(car => {
        const today = new Date();
        const isExpired = car.vip_expiry_date ? car.vip_expiry_date < today : false;
        const daysRemaining = car.vip_expiry_date 
          ? Math.ceil((car.vip_expiry_date.getTime() - today.getTime()) / (1000 * 3600 * 24)) 
          : null;

        return {
          car_id: car.car_id,
          license_plate: car.license_plate,
          vip_expiry_date: car.vip_expiry_date,
          days_remaining: daysRemaining,
          is_expired: isExpired
        };
      });

      // Sort cars: non-expired with least remaining days first, then expired cars
      const sortedCars = carDetails.sort((a, b) => {
        if (a.is_expired && !b.is_expired) return 1;
        if (!a.is_expired && b.is_expired) return -1;
        
        // For non-expired cars, sort by days remaining
        if (!a.is_expired && !b.is_expired) {
          return (a.days_remaining || Infinity) - (b.days_remaining || Infinity);
        }
        
        return 0;
      });

      return {
        exists: true,
        member_id: member.member_id,
        cars: sortedCars
      };
    }

    return { 
      exists: false 
    };
  }

  async linkCarToMember(data: 
    LinkCarDto
) {
    // Validate required fields
    if (!data.phone) {
      throw new BadRequestException('phone number is required');
    }
  
    if (!data.licenseplate) {
      throw new BadRequestException('licenseplate is required');
    }

    if (!data.vip_days) {
        throw new BadRequestException('vip_days is required');
      }
  
    // Find member by phone
    const member = await this.memberRepository.findOne({
      where: { phone: data.phone }
    });
  
    // If member not found, throw an error
    if (!member) {
      throw new NotFoundException('Member with this phone number not found');
    }
  
    // Check if car is already registered to any member
    const existingCar = await this.carRepository.findOne({
      where: { license_plate: data.licenseplate }
    });
  
    if (existingCar) {
      throw new ConflictException('Car is already registered to a member');
    }
  
    // Calculate VIP expiry date based on current date and number of days
    const today = new Date();
    const vipExpiryDate = data.vip_days 
      ? new Date(today.getTime() + (data.vip_days * 24 * 60 * 60 * 1000)) 
      : null;
  
    // Create and save new car
    const newCar = this.carRepository.create({
      license_plate: data.licenseplate,
      vip_expiry_date: vipExpiryDate,
      member_id: member.member_id
    });
  
    await this.carRepository.save(newCar);
  
    // Check existing cars for this member
    const existingCars = await this.carRepository.find({
      where: { member_id: member.member_id }
    });
  
    // Transform car details with expiry information
    const carDetails = existingCars.map(car => {
      const isExpired = car.vip_expiry_date ? car.vip_expiry_date < today : false;
      const daysRemaining = car.vip_expiry_date 
        ? Math.ceil((car.vip_expiry_date.getTime() - today.getTime()) / (1000 * 3600 * 24)) 
        : null;
  
      return {
        car_id: car.car_id,
        license_plate: car.license_plate,
        vip_expiry_date: car.vip_expiry_date,
        days_remaining: daysRemaining,
        is_expired: isExpired
      };
    });
  
    // Sort cars: non-expired with least remaining days first, then expired cars
    const sortedCars = carDetails.sort((a, b) => {
      if (a.is_expired && !b.is_expired) return 1;
      if (!a.is_expired && b.is_expired) return -1;
      
      // For non-expired cars, sort by days remaining
      if (!a.is_expired && !b.is_expired) {
        return (a.days_remaining || Infinity) - (b.days_remaining || Infinity);
      }
      
      return 0;
    });
  
    return {
      message: 'Car linked successfully',
      cars: sortedCars
    };
  }
}