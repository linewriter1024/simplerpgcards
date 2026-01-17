import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("minis")
export class Mini {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "blob" })
  imageData!: Buffer;

  @Column({ type: "varchar", length: 100, nullable: true })
  imageMime?: string | null;

  @Column({ type: "blob", nullable: true })
  backImageData?: Buffer | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  backImageMime?: string | null;

  @Column({ type: "simple-array", nullable: true })
  tags?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
