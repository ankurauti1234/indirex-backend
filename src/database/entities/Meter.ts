// src/database/entities/Meter.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from "typeorm";
import { Household } from "./Household";
import { MeterOtp } from "./MeterOtp";
import { MeterAssignment } from "./MeterAssignment";

@Entity({ name: "meters" })
export class Meter {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "meter_id", type: "varchar", length: 50, unique: true })
  meterId!: string;

  @Column({ name: "meter_type", type: "varchar", length: 50, nullable: true })
  meterType?: string | null;

  @Column({ name: "asset_serial_number", type: "varchar", length: 100, nullable: true })
  assetSerialNumber?: string | null;

  @Column({ name: "power_hat_status", type: "varchar", length: 50, nullable: true })
  powerHATStatus?: string | null;

  @Column({ name: "is_assigned", type: "boolean", default: false })
  isAssigned!: boolean;

  @ManyToOne(() => Household, (household) => household.meters, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "assigned_household_id" })
  @Index()
  assignedHousehold?: Household | null;

  @OneToMany(() => MeterOtp, (otp) => otp.meter)
  otps!: MeterOtp[];

  @OneToMany(() => MeterAssignment, (assignment) => assignment.meter)
  assignments!: MeterAssignment[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  assignedHouseholdId: any;
}