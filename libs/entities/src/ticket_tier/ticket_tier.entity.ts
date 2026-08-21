import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DefaultEntity } from '../common/default.entity';
import { Event } from '../event/event.entity';

@Entity('ticket_tiers')
export class TicketTier extends DefaultEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventId!: string;

  @Column()
  name!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price!: number;

  @Column()
  totalQuantity!: number;

  @Column()
  availableQuantity!: number;

  @Column({
    default: 1,
  })
  version?: number;

  @ManyToOne(() => Event, (event) => event.ticketTiers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'eventId',
  })
  event?: Event;
}
