import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";

import { Meter } from "./Meter";
import { Household } from "./Household";
import { User } from "./User";

@Entity("decommission_attempts")
export class DecommissionAttempt {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Meter, { onDelete: "CASCADE" })
  @JoinColumn({ name: "meter_id" })
  meter!: Meter;

  @ManyToOne(() => Household, { onDelete: "CASCADE" })
  @JoinColumn({ name: "household_id" })
  household!: Household;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "attempted_by_user_id" })
  attemptedByUser!: User | null;

  @Column({ type: "varchar", length: 20 })
  status!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  reason!: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({
    name: "attempted_at",
    type: "timestamptz",
  })
  attemptedAt!: Date;

  @Column({
    name: "unassign_available_until",
    type: "timestamptz",
    nullable: true,
  })
  unassignAvailableUntil!: Date | null;
}