// src/entities/payment.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EntryRecord } from './entry-record.entity';
import { EntryExitRecord } from './entry-exit-record.entity';

@Entity('Payments')
export class Payment {
  @PrimaryGeneratedColumn()
  payment_id: number;

  @Column({ nullable: true })
  entry_record_id: number;

  @Column({ nullable: true })
  entry_exit_record_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  discount: number;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date;

  @ManyToOne(() => EntryRecord, entryRecord => entryRecord.payments)
  @JoinColumn({ name: 'entry_record_id' })
  entryRecord: EntryRecord;

  @ManyToOne(() => EntryExitRecord, entryExitRecord => entryExitRecord.payments)
  @JoinColumn({ name: 'entry_exit_record_id' })
  entryExitRecord: EntryExitRecord;
}