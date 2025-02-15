import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';  // นำเข้า ConfigModule และ ConfigService
import { Admin } from '../entities/admin.entity';  // นำเข้า Admin Entity
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot(),  // นำเข้า ConfigModule ใน AuthModule
    JwtModule.registerAsync({
      imports: [ConfigModule],  // นำเข้า ConfigModule ให้ JwtModule
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),  // ใช้ ConfigService
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION_TIME'),  // ใช้ ConfigService
        },
      }),
      inject: [ConfigService],  // Inject ConfigService ใน useFactory
    }),
    TypeOrmModule.forFeature([Admin]),  // Import Admin entity ให้สามารถใช้งานได้ใน AuthService
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
