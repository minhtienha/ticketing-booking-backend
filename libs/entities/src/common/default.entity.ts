import {
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
} from 'typeorm';

export abstract class DefaultEntity {
  @Column({ type: 'boolean', default: true })
  isPublic?: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt?: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt?: Date;

  @Column({ type: 'boolean', default: false })
  __isDeleted?: boolean;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  createdBy?: string;

  @Column({ type: 'varchar', nullable: true })
  updatedBy?: string;

  @Column({ type: 'varchar', nullable: true })
  deletedBy?: string;
}
