import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DefaultEntity } from '../common/default.entity';
import { Order } from '../order/order.entity';

export enum TicketStatus {
  VALID = 'VALID',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

@Entity('tickets')
export class Ticket extends DefaultEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  orderId!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  ticketCode!: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.VALID,
  })
  status!: TicketStatus;

  @ManyToOne(() => Order, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'orderId' })
  order?: Order;
}
