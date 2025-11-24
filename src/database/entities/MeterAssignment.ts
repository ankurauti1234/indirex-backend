// src/database/entities/MeterAssignment.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import { Meter } from "./Meter";
import { Household } from "./Household";

@Entity({ name: "meter_assignments" })
@Unique(["meter", "household"])
export class MeterAssignment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Meter, (meter) => meter.assignments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "meter_id" })
  @Index()
  meter!: Meter;

  @ManyToOne(() => Household, (household) => household.assignments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "household_id" })
  @Index()
  household!: Household;

  @Column({ name: "assigned_by", type: "varchar", length: 50, nullable: true })
  assignedBy?: string;

  @CreateDateColumn({ name: "assigned_at" })
  assignedAt!: Date;
}
