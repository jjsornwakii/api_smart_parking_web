import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class DashboardDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value instanceof Date) return value;
    const date = new Date(value);
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0, 0
    ));
  })
  startDate?: Date;

  @IsOptional()
  @Transform(({ value }) => {
    if (value instanceof Date) return value;
    const date = new Date(value);
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ));
  })
  endDate?: Date;
}