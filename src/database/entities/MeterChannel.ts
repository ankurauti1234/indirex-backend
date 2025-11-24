// src/database/entities/MeterChannel.ts
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from "typeorm";

@Entity({ name: "meter_channels" })
@Index("idx_meter_channels_device_timestamp", ["device_id", "timestamp"]) // Recommended for querying
export class MeterChannel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text", nullable: false })
  device_id!: string;

  @Column({ type: "bigint", nullable: false })
  timestamp!: number;

  @Column({ type: "text", nullable: false })
  status!: string;

  @Column({ type: "text", nullable: true })
  label?: string | null;

  @Column({ type: "double precision", nullable: true })
  confidence?: number | null;

  // Optional: automatically track when record was inserted
  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;
}