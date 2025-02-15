// src/entities/entry-record.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Car } from './car.entity';
import { Payment } from './payment.entity';

@Entity('EntryRecords')
export class EntryRecord {
  @PrimaryGeneratedColumn()
  entry_records_id: number;

  @Column()
  car_id: number;

  @Column({ type: 'timestamp' })
  entry_time: Date;

  @Column({ type: 'text', nullable: true })
  entry_car_image_path: string;

  @ManyToOne(() => Car, car => car.entryRecords)
  @JoinColumn({ name: 'car_id' })
  car: Car;

  @OneToMany(() => Payment, payment => payment.entryRecord)
  payments: Payment[];
}
