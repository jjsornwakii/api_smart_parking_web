// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Member } from './entities/member.entity';
import { Car } from './entities/car.entity';
import { EntryRecord } from './entities/entry-record.entity';
import { EntryExitRecord } from './entities/entry-exit-record.entity';
import { Payment } from './entities/payment.entity';
import { ParkingModule } from './parking/parking.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admins/admin.module';
import { Admin } from './entities/admin.entity';
import { ConfigurationModule } from './configuration/configuration.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/entities/*.entity{.ts,.js}'], // โหลดทุกไฟล์ที่ลงท้ายด้วย .entity.ts หรือ .entity.js
        autoLoadEntities: true,
        synchronize: true, // Set to true only in development
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    AdminModule,
    ParkingModule,
    ConfigurationModule,

  ],
})
export class AppModule {}