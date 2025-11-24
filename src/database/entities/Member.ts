// src/database/entities/Member.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Household } from "./Household";

@Entity({ name: "members" })
@Index(["household", "memberCode"], { unique: true })
export class Member {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Household, (household) => household.members, { onDelete: "CASCADE" })
  @JoinColumn({ name: "household_id" })
  household!: Household;

  @Column({ name: "member_code", type: "varchar", length: 10 })
  memberCode!: string; // e.g., M1, M2, ...

  @Column({ type: "date" })
  dob!: Date;

  @Column({ type: "varchar", length: 10, nullable: true })
  gender?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
