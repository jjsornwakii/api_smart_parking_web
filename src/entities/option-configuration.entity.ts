import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// option-configuration.entity.ts
@Entity('option_configuration')
export class OptionConfigurationEntity {
  @PrimaryGeneratedColumn()
  parking_option_id: number;

  @Column({ type: 'text', nullable: true })
  note_description: string;

  @Column({ type: 'int' })
  minute_rounding_threshold: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  exit_buffer_time: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  overflow_hour_rate: number;
}