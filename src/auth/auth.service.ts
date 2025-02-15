// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../entities/admin.entity';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private adminsRepository: Repository<Admin>,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(username: string, password: string): Promise<any> {
    if (!username || !password) {
      return null;
    }

    const admin = await this.adminsRepository.findOne({ 
      where: { admin_username: username }
    });

    if (!admin || !admin.admin_password) {
      return null;
    }

    try {
      const isPasswordValid = await bcrypt.compare(password, admin.admin_password);
      if (!isPasswordValid) {
        return null;
      }

      const { admin_password, ...result } = admin;
      return result;
    } catch (error) {
      return null;
    }
  }

  async login(loginDto: LoginDto) {
    if (!loginDto?.username || !loginDto?.password) {
      throw new UnauthorizedException('Username and password are required');
    }

    const admin = await this.validateAdmin(loginDto.username, loginDto.password);
    
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      username: admin.admin_username, 
      sub: admin.admin_id 
    };

    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin.admin_id,
        username: admin.admin_username,
        firstName: admin.admin_fname,
        lastName: admin.admin_lname
      }
    };
  }
}