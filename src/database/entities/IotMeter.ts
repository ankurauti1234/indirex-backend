// src/database/entities/IotMeter.ts
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

export enum IotMeterStatus {
  REGISTERED = "registered",
  UNREGISTERED = "unregistered",
}

@Entity({ name: "iot_meters" })
@Index(["groupName"])
@Index(["status"])
export class IotMeter {
  @PrimaryColumn()
  meterId!: string;

  @Column()
  groupName!: string;

  @Column({ type: "enum", enum: IotMeterStatus, default: IotMeterStatus.UNREGISTERED })
  status!: IotMeterStatus;

  @Column({ type: "timestamp", nullable: true })
  lastSeen?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}