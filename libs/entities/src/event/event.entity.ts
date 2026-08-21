import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { DefaultEntity } from '../common/default.entity';
import { TicketTier } from '../ticket_tier/ticket_tier.entity';

@Entity('events')
export class Event extends DefaultEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamp' })
  startTime!: Date;

  @Column({ type: 'timestamp' })
  endTime!: Date;

  @Column({
    type: 'varchar',
    default: 'DRAFT',
  })
  status!: string;

  @OneToMany(() => TicketTier, (ticketTier) => ticketTier.event)
  ticketTiers!: TicketTier[];
}
