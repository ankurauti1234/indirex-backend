// src/database/entities/GeneratedHHBridgeReport.ts
import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: "generated_hh_bridge_report" })
@Index("idx_report_date", ["report_date"])
export class GeneratedHHBridgeReport {
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