import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  Index,
  ManyToOne,
} from 'typeorm';
import { User } from '../user';
import { DefaultEntity } from '../common/default.entity'; // Nếu bạn muốn kế thừa

@Entity('auth')
export class Auth extends DefaultEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  token!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
