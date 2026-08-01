import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn, Index,
  } from "typeorm";
  import { Meter } from "./Meter";
  import { Household } from "./Household";
  import { User } from "./User";
  
  @Entity({ name: "unassign_logs" })
  @Index(["meter", "household"])
  export class UnassignLog {
    @PrimaryGeneratedColumn("uuid")
    id!: string;
  
    @ManyToOne(() => Meter, { nullable: false })
    @JoinColumn({ name: "meter_id" })
    meter!: Meter;
  
    @ManyToOne(() => Household, { nullable: false })
    @JoinColumn({ name: "household_id" })
    household!: Household;
  
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: "unassigned_by_user_id" })
    unassignedBy?: User | null;
  
    @Column({ name: "unassigned_by_user_id", nullable: true })
    unassignedByUserId?: string | null;
  
    @CreateDateColumn({ name: "unassigned_at" })
    unassignedAt!: Date;
  }