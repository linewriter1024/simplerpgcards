import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export interface MiniPlacement {
  id: string; // unique placement id
  miniId: string;
  x: number; // position in inches from left
  y: number; // position in inches from top
  width: number; // width in inches (default 0.75)
  height: number; // height in inches (default 0.75)
  text?: string; // optional text label
  textPosition?: "top" | "bottom" | "center"; // where to place the text
  textSize?: number; // font size in points (default 8)
  rotation?: number; // rotation in degrees
  backMode?: "none" | "back-image"; // how to handle the back side
}

export interface SheetSettings {
  pageWidth: number; // in inches (8.5 for US Letter)
  pageHeight: number; // in inches (11 for US Letter)
  marginTop: number; // in inches
  marginBottom: number; // in inches
  marginLeft: number; // in inches
  marginRight: number; // in inches
  gridSnap: number; // grid snap size in inches (0 for no snap)
  showGrid: boolean;
}

@Entity("mini_sheets")
export class MiniSheet {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 10, default: "" })
  code!: string;

  @Column({ type: "simple-json" })
  placements!: MiniPlacement[];

  @Column({ type: "simple-json" })
  settings!: SheetSettings;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
