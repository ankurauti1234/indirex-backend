// src/database/entities/Household.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { Member } from "./Member";
import { Meter } from "./Meter";
import { PreregisteredContact } from "./PreregisteredContact";
import { MeterAssignment } from "./MeterAssignment";

@Entity({ name: "households" })
export class Household {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 10, unique: true })
  hhid!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  // Relations
  @OneToMany(() => Member, (member) => member.household)
  members!: Member[];

  @OneToMany(() => Meter, (meter) => meter.assignedHousehold)
  meters!: Meter[];

  @OneToMany(() => MeterAssignment, (assignment) => assignment.household)
  assignments!: MeterAssignment[];

  @OneToMany(() => PreregisteredContact, (contact) => contact.household)
  contacts!: PreregisteredContact[];
}
