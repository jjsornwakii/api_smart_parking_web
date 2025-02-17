import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';
import { Repository } from 'typeorm';
import { EntryRecord } from '../entities/entry-record.entity';
import { EntryExitRecord } from '../entities/entry-exit-record.entity';
import { Payment } from '../entities/payment.entity';
import { DashboardDto } from './dto/dashboard.dto';

// interface DashboardDto {
//   startDate?: Date;
//   endDate?: Date;
// }

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(EntryRecord)
    private entryRecordRepository: Repository<EntryRecord>,
    @InjectRepository(EntryExitRecord)
    private entryExitRecordRepository: Repository<EntryExitRecord>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>
  ) {}

  async getDashboardData(dto: DashboardDto) {
    // Normalize dates in UTC
    const startDate = dto.startDate
    ? new Date(Date.UTC(
          dto.startDate.getFullYear(),
          dto.startDate.getMonth(),
          dto.startDate.getDate(),
          0, 0, 0, 0
      ))
    : new Date(Date.UTC(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate(),
          0, 0, 0, 0
      ));

    const endDate = dto.endDate
    ? new Date(Date.UTC(
          dto.endDate.getFullYear(),
          dto.endDate.getMonth(),
          dto.endDate.getDate(),
          dto.endDate.getHours(),
          dto.endDate.getMinutes(),
          dto.endDate.getSeconds(),
          dto.endDate.getMilliseconds()
      ))
    : new Date(Date.UTC(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate(),
          23, 59, 59, 999
      ));

    // Calculate previous period
    const periodDuration = endDate.getTime() - startDate.getTime();
    const prevPeriodStart = new Date(startDate.getTime() - periodDuration);

    // Calculate the end of the day before startDate
    const prevPeriodEnd = new Date(Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate() - 1,
      23, 59, 59, 999
    ));


       // In getDashboardData
console.log('endDate after initialization:', endDate); 

    // Fetch data
    const [
      currentRevenue, 
      prevRevenue,
      currentEntries,
      prevEntries,
      currentExits,
      prevExits,
      graphData
    ] = await Promise.all([
      this.calculateTotalRevenue(startDate, endDate),
      this.calculateTotalRevenue(prevPeriodStart, prevPeriodEnd),
      this.countEntries(startDate, endDate),
      this.countEntries(prevPeriodStart, prevPeriodEnd),
      this.countExits(startDate, endDate),
      this.countExits(prevPeriodStart, prevPeriodEnd),
      this.prepareGraphData(startDate, endDate)
    ]);

    

    return {
      revenue: {
        current: currentRevenue,
        previous: prevRevenue,
        percentageChange: this.calculatePercentageChange(prevRevenue, currentRevenue)
      },
      entries: {
        current: currentEntries,
        previous: prevEntries,
        percentageChange: this.calculatePercentageChange(prevEntries, currentEntries)
      },
      exits: {
        current: currentExits,
        previous: prevExits,
        percentageChange: this.calculatePercentageChange(prevExits, currentExits)
      },
      graphData,
      dateRange: {
        start: startDate,
        end: endDate
      }
    };
  }

  private async calculateTotalRevenue(start: Date, end: Date): Promise<number> {
    // Sum payments from both active entries and completed entries
    const [activeEntryPayments, completedEntryPayments] = await Promise.all([
      this.paymentRepository.find({
        where: {
          entry_record_id: Not(IsNull()),
          paid_at: Between(start, end)
        }
      }),
      this.paymentRepository.find({
        where: {
          entry_exit_record_id: Not(IsNull()),
          paid_at: Between(start, end)
        }
      })
    ]);

    const totalRevenue = [
      ...activeEntryPayments, 
      ...completedEntryPayments
    ].reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return Number(totalRevenue.toFixed(2));
  }

  private async countEntries(start: Date, end: Date): Promise<number> {
    return this.entryRecordRepository.count({
      where: { entry_time: Between(start, end) }
    });
  }

  private async countExits(start: Date, end: Date): Promise<number> {
    return this.entryExitRecordRepository.count({
      where: { exit_time: Between(start, end) }
    });
  }

  private calculatePercentageChange(prev: number, current: number): number {
    if (prev === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / prev) * 100);
  }

 
  private async prepareGraphData(start: Date, end: Date) {

    console.log('endDate before prepareGraphData:', end); 


    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  
    if (durationHours < 24) {
      // Hourly data for a single day
      return {
        revenueByHour: await this.getRevenueByHour(start, end),
        entriesByHour: await this.getEntriesByHour(start, end),
        exitsByHour: await this.getExitsByHour(start, end)
      };
    } else if (durationHours <= 24 * 7) {
      // Daily data for a week
      return {
        revenueByDay: await this.getRevenueByDay(start, end),
        entriesByDay: await this.getEntriesByDay(start, end),
        exitsByDay: await this.getExitsByDay(start, end)
      };
    }  else if (durationHours <= 24 * 365) {
      // Monthly data for up to a year
      return {
        revenueByMonth: await this.getRevenueByMonth(start, end),
        entriesByMonth: await this.getEntriesByMonth(start, end),
        exitsByMonth: await this.getExitsByMonth(start, end)
      };
    } else {
      // Yearly data for more than a year
      return {
        revenueByYear: await this.getRevenueByYear(start, end),
        entriesByYear: await this.getEntriesByYear(start, end),
        exitsByYear: await this.getExitsByYear(start, end)
      };
    }
  }

  // Hourly methods
  // Modify the hourly methods to be specific to a single day
private async getRevenueByHour(start: Date, end: Date) {
    try {
      const activeEntryPayments = await this.paymentRepository
        .createQueryBuilder('payment')
        .select('EXTRACT(HOUR FROM payment.paid_at AT TIME ZONE \'UTC\')', 'hour')
        .addSelect('SUM(payment.amount)', 'revenue')
        .where('payment.entry_record_id IS NOT NULL')
        .andWhere('payment.paid_at BETWEEN :start AND :end', { start, end })
        .groupBy('hour')
        .orderBy('hour')
        .getRawMany();
  
      const completedEntryPayments = await this.paymentRepository
        .createQueryBuilder('payment')
        .select('EXTRACT(HOUR FROM payment.paid_at AT TIME ZONE \'UTC\')', 'hour')
        .addSelect('SUM(payment.amount)', 'revenue')
        .where('payment.entry_exit_record_id IS NOT NULL')
        .andWhere('payment.paid_at BETWEEN :start AND :end', { start, end })
        .groupBy('hour')
        .orderBy('hour')
        .getRawMany();
  
      // Combine and aggregate payments
      const hourlyRevenueMap = new Map<number, number>();
      
      const processPayments = (payments: any[]) => {
        payments.forEach(item => {
          const hour = parseInt(item.hour);
          const revenue = parseFloat(item.revenue) || 0;
          
          const existingRevenue = hourlyRevenueMap.get(hour) || 0;
          hourlyRevenueMap.set(hour, existingRevenue + revenue);
        });
      };
  
      processPayments(activeEntryPayments);
      processPayments(completedEntryPayments);
  
      // Create full 24-hour array
      return Array.from({length: 24}, (_, hour) => ({
        hour,
        revenue: hourlyRevenueMap.get(hour) || 0
      }));
    } catch (error) {
      console.error('Error in getRevenueByHour:', error);
      return Array.from({length: 24}, (_, hour) => ({
        hour,
        revenue: 0
      }));
    }
  }
  
  private async getEntriesByHour(start: Date, end: Date) {
    try {
      const entries = await this.entryRecordRepository
        .createQueryBuilder('entry')
        .select('EXTRACT(HOUR FROM entry_time AT TIME ZONE \'UTC\')', 'hour')
        .addSelect('COUNT(*)', 'entries')
        .where('entry_time BETWEEN :start AND :end', { start, end })
        .groupBy('hour')
        .orderBy('hour')
        .getRawMany();
  
      // Create full 24-hour array
      const hourlyEntriesMap = new Map(
        entries.map(item => [parseInt(item.hour), parseInt(item.entries)])
      );
  
      return Array.from({length: 24}, (_, hour) => ({
        hour,
        entries: hourlyEntriesMap.get(hour) || 0
      }));
    } catch (error) {
      console.error('Error in getEntriesByHour:', error);
      return Array.from({length: 24}, (_, hour) => ({
        hour,
        entries: 0
      }));
    }
  }
  
  private async getExitsByHour(start: Date, end: Date) {
    try {
      const exits = await this.entryExitRecordRepository
        .createQueryBuilder('exit')
        .select('EXTRACT(HOUR FROM exit_time AT TIME ZONE \'UTC\')', 'hour')
        .addSelect('COUNT(*)', 'exits')
        .where('exit_time BETWEEN :start AND :end', { start, end })
        .groupBy('hour')
        .orderBy('hour')
        .getRawMany();
  
      // Create full 24-hour array
      const hourlyExitsMap = new Map(
        exits.map(item => [parseInt(item.hour), parseInt(item.exits)])
      );
  
      return Array.from({length: 24}, (_, hour) => ({
        hour,
        exits: hourlyExitsMap.get(hour) || 0
      }));
    } catch (error) {
      console.error('Error in getExitsByHour:', error);
      return Array.from({length: 24}, (_, hour) => ({
        hour,
        exits: 0
      }));
    }
  }

  // Similar methods for day, month, year aggregations would follow
  // Day-level aggregations
  private async getRevenueByDay(start: Date, end: Date) {
    console.log('start date in getRevenueByDay:', start);
console.log('end date in getRevenueByDay:', end);
    try {
      const payments = await this.paymentRepository
        .createQueryBuilder('payment')
        .select('DATE(payment.paid_at AT TIME ZONE \'UTC\')', 'day')
        .addSelect('SUM(payment.amount)', 'revenue')
        .where('payment.paid_at BETWEEN :start AND :end', { 
          start, 
          end 
        })
        .groupBy('day')
        .orderBy('day')
        .getRawMany();
  
      // Generate date range (now only for the exact day)
      const dailyRevenue = this.generateDateRange(start, end).map(date => ({
        day: date.toISOString().split('T')[0],
        revenue: payments.find(p => 
          new Date(p.day).toISOString().split('T')[0] === date.toISOString().split('T')[0]
        )?.revenue || 0
      }));
  
      return dailyRevenue;
    } catch (error) {
      console.error('Error in getRevenueByDay:', error);
      return this.generateDateRange(start, end).map(date => ({
        day: date.toISOString().split('T')[0],
        revenue: 0
      }));
    }
  }
  
  // Similar modifications for getEntriesByDay and getExitsByDay
  private async getEntriesByDay(start: Date, end: Date) {
    console.log('start date in getEntriesByDay:', start);
console.log('end date in getEntriesByDay:', end);
    try {
      const entries = await this.entryRecordRepository
        .createQueryBuilder('entry')
        .select('DATE(entry_time AT TIME ZONE \'UTC\')', 'day')
        .addSelect('COUNT(*)', 'entries')
        .where('entry_time BETWEEN :start AND :end', { 
          start, 
          end 
        })
        .groupBy('day')
        .orderBy('day')
        .getRawMany();
  
      // Generate date range (now only for the exact day)
      const dailyEntries = this.generateDateRange(start, end).map(date => ({
        day: date.toISOString().split('T')[0],
        entries: entries.find(e => 
          new Date(e.day).toISOString().split('T')[0] === date.toISOString().split('T')[0]
        )?.entries || 0
      }));
  
      return dailyEntries;
    } catch (error) {
      console.error('Error in getEntriesByDay:', error);
      return this.generateDateRange(start, end).map(date => ({
        day: date.toISOString().split('T')[0],
        entries: 0
      }));
    }
  }
  
  private async getExitsByDay(start: Date, end: Date) {
    console.log('start date in getExitsByDay:', start);
console.log('end date in getExitsByDay:', end);
    try {
      const exits = await this.entryExitRecordRepository
        .createQueryBuilder('exit')
        .select('DATE(exit_time AT TIME ZONE \'UTC\')', 'day')
        .addSelect('COUNT(*)', 'exits')
        .where('exit_time BETWEEN :start AND :end', { 
          start, 
          end 
        })
        .groupBy('day')
        .orderBy('day')
        .getRawMany();
  
      // Generate date range (now only for the exact day)
      const dailyExits = this.generateDateRange(start, end).map(date => ({
        day: date.toISOString().split('T')[0],
        exits: exits.find(e => 
          new Date(e.day).toISOString().split('T')[0] === date.toISOString().split('T')[0]
        )?.exits || 0
      }));
  
      return dailyExits;
    } catch (error) {
      console.error('Error in getExitsByDay:', error);
      return this.generateDateRange(start, end).map(date => ({
        day: date.toISOString().split('T')[0],
        exits: 0
      }));
    }
  }
  
  // Month-level aggregations
  private async getRevenueByMonth(start: Date, end: Date) {
    try {
      const activeEntryPayments = await this.paymentRepository
        .createQueryBuilder('payment')
        .select('to_char(payment.paid_at AT TIME ZONE \'UTC\', \'YYYY-MM\')', 'month')
        .addSelect('SUM(payment.amount)', 'revenue')
        .where('payment.entry_record_id IS NOT NULL')
        .andWhere('payment.paid_at BETWEEN :start AND :end', { start, end })
        .groupBy('month')
        .orderBy('month')
        .getRawMany();
  
      const completedEntryPayments = await this.paymentRepository
        .createQueryBuilder('payment')
        .select('to_char(payment.paid_at AT TIME ZONE \'UTC\', \'YYYY-MM\')', 'month')
        .addSelect('SUM(payment.amount)', 'revenue')
        .where('payment.entry_exit_record_id IS NOT NULL')
        .andWhere('payment.paid_at BETWEEN :start AND :end', { start, end })
        .groupBy('month')
        .orderBy('month')
        .getRawMany();
  
      // Combine and aggregate payments
      const monthlyRevenueMap = new Map<string, number>();
      
      const processPayments = (payments: any[]) => {
        payments.forEach(item => {
          const month = item.month;
          const revenue = parseFloat(item.revenue) || 0;
          
          const existingRevenue = monthlyRevenueMap.get(month) || 0;
          monthlyRevenueMap.set(month, existingRevenue + revenue);
        });
      };
  
      processPayments(activeEntryPayments);
      processPayments(completedEntryPayments);
  
      // Generate full month range
      const monthlyRevenue = this.generateMonthRange(start, end).map(month => ({
        month: month.toISOString().slice(0, 7),
        revenue: monthlyRevenueMap.get(month.toISOString().slice(0, 7)) || 0
      }));
  
      return monthlyRevenue;
    } catch (error) {
      console.error('Error in getRevenueByMonth:', error);
      return this.generateMonthRange(start, end).map(month => ({
        month: month.toISOString().slice(0, 7),
        revenue: 0
      }));
    }
  }
  
  private async getEntriesByMonth(start: Date, end: Date) {
    try {
      const entries = await this.entryRecordRepository
        .createQueryBuilder('entry')
        .select('to_char(entry_time AT TIME ZONE \'UTC\', \'YYYY-MM\')', 'month')
        .addSelect('COUNT(*)', 'entries')
        .where('entry_time BETWEEN :start AND :end', { start, end })
        .groupBy('month')
        .orderBy('month')
        .getRawMany();
  
      // Generate full month range
      const monthlyEntries = this.generateMonthRange(start, end).map(month => {
        const monthStr = month.toISOString().slice(0, 7);
        
        const matchingEntry = entries.find(entry => entry.month === monthStr);
  
        return {
          month: monthStr,
          entries: matchingEntry ? parseInt(matchingEntry.entries) : 0
        };
      });
  
      return monthlyEntries;
    } catch (error) {
      console.error('Error in getEntriesByMonth:', error);
      return this.generateMonthRange(start, end).map(month => ({
        month: month.toISOString().slice(0, 7),
        entries: 0
      }));
    }
  }
  
  private async getExitsByMonth(start: Date, end: Date) {
    try {
      const exits = await this.entryExitRecordRepository
        .createQueryBuilder('exit')
        .select('to_char(exit_time AT TIME ZONE \'UTC\', \'YYYY-MM\')', 'month')
        .addSelect('COUNT(*)', 'exits')
        .where('exit_time BETWEEN :start AND :end', { start, end })
        .groupBy('month')
        .orderBy('month')
        .getRawMany();
  
      // Generate full month range
      const monthlyExits = this.generateMonthRange(start, end).map(month => {
        const monthStr = month.toISOString().slice(0, 7);
        
        const matchingExit = exits.find(exit => exit.month === monthStr);
  
        return {
          month: monthStr,
          exits: matchingExit ? parseInt(matchingExit.exits) : 0
        };
      });
  
      return monthlyExits;
    } catch (error) {
      console.error('Error in getExitsByMonth:', error);
      return this.generateMonthRange(start, end).map(month => ({
        month: month.toISOString().slice(0, 7),
        exits: 0
      }));
    }
  }
  
  // Year-level aggregations
  private async getRevenueByYear(start: Date, end: Date) {
    const activeEntryPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('EXTRACT(YEAR FROM payment.paid_at)', 'year')
      .addSelect('SUM(payment.amount)', 'revenue')
      .where('payment.entry_record_id IS NOT NULL')
      .andWhere('payment.paid_at BETWEEN :start AND :end', { start, end })
      .groupBy('year')
      .orderBy('year')
      .getRawMany();
  
    const completedEntryPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('EXTRACT(YEAR FROM payment.paid_at)', 'year')
      .addSelect('SUM(payment.amount)', 'revenue')
      .where('payment.entry_exit_record_id IS NOT NULL')
      .andWhere('payment.paid_at BETWEEN :start AND :end', { start, end })
      .groupBy('year')
      .orderBy('year')
      .getRawMany();
  
    // Combine payments
    const yearlyRevenueMap = new Map<number, number>();
    
    [...activeEntryPayments, ...completedEntryPayments].forEach(item => {
      const year = parseInt(item.year);
      const revenue = parseFloat(item.revenue) || 0;
      
      const existingRevenue = yearlyRevenueMap.get(year) || 0;
      yearlyRevenueMap.set(year, existingRevenue + revenue);
    });
  
    // Convert map to array
    return Array.from(yearlyRevenueMap, ([year, revenue]) => ({
      year,
      revenue
    }));
  }
  
  private async getEntriesByYear(start: Date, end: Date) {
    const entries = await this.entryRecordRepository
      .createQueryBuilder('entry')
      .select('EXTRACT(YEAR FROM entry_time)', 'year')
      .addSelect('COUNT(*)', 'entries')
      .where('entry_time BETWEEN :start AND :end', { start, end })
      .groupBy('year')
      .orderBy('year')
      .getRawMany();
  
    return entries.map(entry => ({
      year: parseInt(entry.year),
      entries: parseInt(entry.entries)
    }));
  }
  
  private async getExitsByYear(start: Date, end: Date) {
    const exits = await this.entryExitRecordRepository
      .createQueryBuilder('exit')
      .select('EXTRACT(YEAR FROM exit_time)', 'year')
      .addSelect('COUNT(*)', 'exits')
      .where('exit_time BETWEEN :start AND :end', { start, end })
      .groupBy('year')
      .orderBy('year')
      .getRawMany();
  
    return exits.map(exit => ({
      year: parseInt(exit.year),
      exits: parseInt(exit.exits)
    }));
  }
  
  // Helper method to generate date range
  private generateDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate()
    ));
    const endDate = new Date(Date.UTC(
        end.getUTCFullYear(),
        end.getUTCMonth(),
        end.getUTCDate()
    ));

    while (currentDate <= endDate) {
        dates.push(new Date(currentDate)); // Important: Create a new Date object!
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return dates;
}

  // Modify generateMonthRange to handle date range more precisely
private generateMonthRange(start: Date, end: Date): Date[] {
    const months: Date[] = [];
    const currentMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    
    while (currentMonth <= endMonth) {
      months.push(new Date(currentMonth));
      currentMonth.setUTCMonth(currentMonth.getUTCMonth() + 1);
    }
    
    return months;
  }
}