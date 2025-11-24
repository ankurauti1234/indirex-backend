// src/database/entities/DecommissionLog.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Meter } from "./Meter";
import { Household } from "./Household";
import { User } from "./User";

@Entity({ name: "decommission_logs" })
@Index(["meter", "household"])
export class DecommissionLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Meter, { nullable: false })
  @JoinColumn({ name: "meter_id" })
  meter!: Meter;

  @ManyToOne(() => Household, { nullable: false })
  @JoinColumn({ name: "household_id" })
  household!: Household;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "decommissioned_by_user_id" })
  decommissionedBy?: User | null;

  @Column({ name: "decommissioned_by_user_id", nullable: true })
  decommissionedByUserId?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  reason?: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: "decommissioned_at" })
  decommissionedAt!: Date;
}