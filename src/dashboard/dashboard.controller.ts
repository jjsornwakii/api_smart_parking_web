import { Controller, Post, Body, UsePipes, ValidationPipe } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { DashboardDto } from "./dto/dashboard.dto";

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post()
  @UsePipes(new ValidationPipe({ 
    transform: true,
    transformOptions: { 
      enableImplicitConversion: true 
    }
  }))
  async getDashboardData(@Body() dto: DashboardDto) {
    return this.dashboardService.getDashboardData(dto);
  }
}