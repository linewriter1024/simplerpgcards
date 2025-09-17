import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { StatBlock } from './StatBlock';

@Entity('statblock_images')
export class StatBlockImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => StatBlock, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'statblockId' })
  statblock!: StatBlock;

  @Column({ type: 'varchar' })
  statblockId!: string;

  @Column({ type: 'blob' })
  data!: Buffer;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mime?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  filename?: string | null;

  // User display preferences for image slicing
  @Column({ type: 'integer', default: 0 })
  offset!: number;

  @Column({ type: 'real', default: 1.0 })
  scale!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
