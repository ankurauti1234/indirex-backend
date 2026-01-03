// src/database/entities/GeneratedHHMemberwiseUnbridgedReport.ts
import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: "generated_hh_memberwise_unbridged_report" })
@Index("idx_report_date", ["report_date"])
export class GeneratedHHMemberwiseUnbridgedReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  generation_time!: Date;

  @Column({ type: "date" })
  report_date!: Date;

  @Column({ type: "text" })
  report_url!: string;

  @Column({ type: "int", default: 0 })
  session_count!: number;
}