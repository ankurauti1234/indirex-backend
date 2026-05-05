// src/database/entities/HouseholdMeterHistory.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Column,
    Index,
  } from "typeorm";
  import { Meter } from "./Meter";
  import { Household } from "./Household";
  
  @Entity({ name: "household_meter_history" })
  @Index(["meter"])
  @Index(["household"])
  export class HouseholdMeterHistory {
    @PrimaryGeneratedColumn("uuid")
    id!: string;
  
    @ManyToOne(() => Meter, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "meter_id" })
    meter!: Meter;
  
    @ManyToOne(() => Household, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "household_id" })
    household!: Household;
  
    @Column({ name: "assigned_at", type: "timestamptz" })
    assignedAt!: Date;
  
    @Column({ name: "decommissioned_at", type: "timestamptz", nullable: true })
    decommissionedAt?: Date | null;
  }