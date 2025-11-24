// src/database/entities/EventMapping.ts
import { Entity, PrimaryGeneratedColumn, Column, Unique, Index } from "typeorm";

@Entity({ name: "event_mapping" })
@Unique(["type"]) // One mapping per type
export class EventMapping {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  @Index()
  type!: number; // Event type (e.g., 14, 15)

  @Column()
  name!: string; // Human-readable name

  @Column({ nullable: true })
  description?: string;

  @Column({ default: false })
  is_alert!: boolean; // Critical: marks if it's an alert

  @Column({ default: "default" })
  severity!: "low" | "medium" | "high" | "critical";

  @Column({ default: true })
  enabled!: boolean;
}