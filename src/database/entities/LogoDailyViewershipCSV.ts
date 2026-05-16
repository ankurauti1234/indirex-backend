// src/database/entities/LogoDailyViewershipCSV.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity({ name: "LogoDailyViewershipCSV" })
export class LogoDailyViewershipCSV {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 20, unique: true })
  date_label!: string; // format: "DD-MM-YYYY" e.g. "13-05-2026"

  @Column({ type: "text" })
  s3_url!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}