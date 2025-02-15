import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Admins')
export class Admin {

  @PrimaryGeneratedColumn()
  admin_id: number;

  @Column()
  admin_username: string;

  @Column()
  admin_password: string;
  
  @Column()
  admin_fname: string;

  @Column()
  admin_lname: string;
}
