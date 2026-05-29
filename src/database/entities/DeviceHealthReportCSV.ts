import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity({ name: "DeviceHealthReportCSV" })
export class DeviceHealthReportCSV {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "date_label", type: "varchar", length: 20 })
  date_label!: string; // "DD-MM-YYYY"

  @Column({ name: "s3_url", type: "text" })
  s3_url!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}