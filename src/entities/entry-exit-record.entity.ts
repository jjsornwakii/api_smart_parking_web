// src/entities/entry-exit-record.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Car } from './car.entity';
import { Payment } from './payment.entity';

@Entity('EntryExitRecords')
export class EntryExitRecord {
  @PrimaryGeneratedColumn()
  entry_exit_records_id: number;

  @Column()
  car_id: number;

  @Column({ type: 'timestamp' })
  entry_time: Date;

  @Column({ type: 'timestamp' })
  exit_time: Date;

  @Column({ type: 'text', nullable: true })
  entry_car_image_path: string;

  @ManyToOne(() => Car, car => car.entryExitRecords)
  @JoinColumn({ name: 'car_id' })
  car: Car;

  @OneToMany(() => Payment, payment => payment.entryExitRecord)
  payments: Payment[];
}