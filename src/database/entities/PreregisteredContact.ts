// src/database/entities/PreregisteredContact.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { Household } from "./Household";

@Entity({ name: "preregistered_contacts" })
export class PreregisteredContact {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Household, (household) => household.contacts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "household_id" })
  @Index()
  household!: Household;

  @Column({ name: "contact_email", type: "varchar", length: 255 })
  contactEmail!: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
