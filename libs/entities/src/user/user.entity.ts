import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Auth } from '@ticketing/entities';
import { DefaultEntity } from '../common/default.entity';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('users')
export class User extends DefaultEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  email!: string;

  @Column({ select: false })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role?: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;
}
