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
import { TicketTier } from '../ticket_tier/ticket_tier.entity';

@Entity('order_items')
export class OrderItem extends DefaultEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  orderId!: string;

  @Index()
  @Column({ type: 'uuid' })
  ticketTierId!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  unitPrice!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  subtotal!: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order?: Order;

  @ManyToOne(() => TicketTier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ticketTierId' })
  ticketTier?: TicketTier;
}
