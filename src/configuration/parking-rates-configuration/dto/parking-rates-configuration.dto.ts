// parking-rates-configuration.dto.ts
export class CreateParkingRateDto {
    hours: number;
    rate_at_hour: number;
  }
  
  export class UpdateParkingRateDto {
    rate_at_hour: number;
  }