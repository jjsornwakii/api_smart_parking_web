// src/admin/admin.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../entities/admin.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  async createAdmin(
    admin_fname: string,
    admin_lname: string,
    admin_username: string,
    admin_password: string,
  ): Promise<Admin> {
    // เข้ารหัสรหัสผ่านก่อนบันทึก
    const hashedPassword = await bcrypt.hash(admin_password, 10);

    const admin = this.adminRepository.create({
      admin_fname,
      admin_lname,
      admin_username,
      admin_password: hashedPassword, // เก็บรหัสผ่านที่เข้ารหัสแล้ว
    });
    
    return await this.adminRepository.save(admin);
  }

  async deleteAdmin(admin_id: number): Promise<void> {
    await this.adminRepository.delete(admin_id);
  }
}