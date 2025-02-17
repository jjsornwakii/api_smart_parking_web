import { IsInt, Min, Max } from "class-validator";
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// option-configuration.entity.ts
@Entity('option_configuration')
export class OptionConfigurationEntity {
  @PrimaryGeneratedColumn()
  parking_option_id: number;

  @Column({ type: 'text', nullable: true })
  note_description: string;

  @Column({ type: 'int' })
  @IsInt()
  @Min(0)
  @Max(59)
  minute_rounding_threshold: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  exit_buffer_time: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  overflow_hour_rate: number;
}