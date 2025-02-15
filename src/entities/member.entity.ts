// src/entities/member.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Car } from './car.entity';

@Entity('Members')
export class Member {
  @PrimaryGeneratedColumn()
  member_id: number;

  @Column()
  f_name: string;

  @Column()
  l_name: string;

  @Column()
  phone: string;

  @OneToMany(() => Car, car => car.member)
  cars: Car[];
}
