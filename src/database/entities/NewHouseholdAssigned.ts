import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from "typeorm";
import { Household } from "./Household";

@Entity({ name: "new_household_assigned" })
export class NewHouseholdAssigned {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Household, { nullable: false })
  @JoinColumn({ name: "household_id" })
  household!: Household;

  @Column({ name: "hhid", type: "varchar", length: 10 })
  hhid!: string;

  @Column({ name: "region", type: "varchar", nullable: true })
  region?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}