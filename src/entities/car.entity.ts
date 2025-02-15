// src/entities/car.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Member } from './member.entity';
import { EntryRecord } from './entry-record.entity';
import { EntryExitRecord } from './entry-exit-record.entity';

@Entity('Cars')
export class Car {
  @PrimaryGeneratedColumn()
  car_id: number;

  @Column()
  license_plate: string;

  @Column({ type: 'timestamp', nullable: true })
  vip_expiry_date: Date;

  @Column({ nullable: true })
  member_id: number;

  @ManyToOne(() => Member, member => member.cars)
  member: Member;

  @OneToMany(() => EntryRecord, entryRecord => entryRecord.car)
  entryRecords: EntryRecord[];

  @OneToMany(() => EntryExitRecord, entryExitRecord => entryExitRecord.car)
  entryExitRecords: EntryExitRecord[];
}
