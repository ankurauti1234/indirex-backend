// src/database/entities/MeterOtp.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { Meter } from "./Meter";

@Entity({ name: "meter_otps" })
export class MeterOtp {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Meter, (meter) => meter.otps, { onDelete: "CASCADE" })
  @JoinColumn({ name: "meter_id" })
  @Index()
  meter!: Meter;

  @Column({ name: "otp_code", type: "varchar", length: 10 })
  otpCode!: string;

  @Column({ name: "expires_at", type: "timestamp" })
  expiresAt!: Date;

  @Column({ name: "consumed", type: "boolean", default: false })
  consumed!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
