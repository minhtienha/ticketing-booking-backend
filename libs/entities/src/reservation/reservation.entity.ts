import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { DefaultEntity } from '../common/default.entity';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

@Entity('reservations')
export class Reservation extends DefaultEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Index()
  @Column({ type: 'uuid' })
  eventId!: string;

  @Index()
  @Column({ type: 'uuid' })
  ticketTierId!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status!: ReservationStatus;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;
}
