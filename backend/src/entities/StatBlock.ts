import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface AttackData {
  id?: string;
  name: string;
  toHitModifier: number;
  damage: string;
  additionalEffect?: string;
}

export interface SpellData {
  id?: string;
  name: string;
  description: string;
}

@Entity('statblocks')
export class StatBlock {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  type?: string;

  @Column({ type: 'varchar', length: 50 })
  cr!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  hp?: string;

  @Column({ type: 'varchar', length: 50 })
  ac!: string;

  @Column({ type: 'integer', nullable: true })
  spellSaveDC?: number;

  @Column({ type: 'integer', nullable: true })
  spellAttackModifier?: number;

  @Column({ type: 'integer' })
  str!: number;

  @Column({ type: 'integer' })
  dex!: number;

  @Column({ type: 'integer' })
  con!: number;

  @Column({ type: 'integer' })
  int!: number;

  @Column({ type: 'integer' })
  wis!: number;

  @Column({ type: 'integer' })
  cha!: number;

  @Column({ type: 'json' })
  attacks!: AttackData[];

  @Column({ type: 'json' })
  spells!: SpellData[];

  @Column({ type: 'json', default: '[]' })
  spellSlots!: number[];

  @Column({ type: 'json', default: '[]' })
  skills!: string[];

  @Column({ type: 'json', default: '[]' })
  resistances!: string[];

  @Column({ type: 'json' })
  tags!: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
