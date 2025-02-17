import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
    process.env.TZ = 'UTC'; // Set timezone to UTC

  // ใช้ NestExpressApplication แทน
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // เปิดให้เข้าถึงไฟล์ในโฟลเดอร์ uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
