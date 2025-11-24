// src/database/entities/OtaJob.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";

export enum OtaJobStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  CANCELED = "canceled",
}

@Entity({ name: "ota_jobs" })
export class OtaJob {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  version!: string;

  @Column()
  fileName!: string;

  @Column()
  s3KeyUpdate!: string;

  @Column()
  s3UrlUpdate!: string;

  @Column()
  s3KeyJobDoc!: string;

  @Column()
  s3UrlJobDoc!: string;

  @Column()
  downloadPath!: string;

  @Column("text", { array: true })  // <-- PostgreSQL TEXT[]
  targets!: string[];

  @Column()
  jobId!: string;

  @Column({ nullable: true })
  jobArn?: string;

  @Column({ type: "enum", enum: OtaJobStatus, default: OtaJobStatus.PENDING })
  status!: OtaJobStatus;

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;
}