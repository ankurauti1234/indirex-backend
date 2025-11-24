// src/database/entities/RemoteAccessLog.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";

@Entity({ name: "remote_access_logs" })
export class RemoteAccessLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user!: User;

  @Column()
  meterId!: string;

  @Column()
  port!: number;

  @Column({ nullable: true })
  clientIp?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ type: "timestamp", nullable: true })
  disconnectedAt?: Date;

  @CreateDateColumn()
  connectedAt!: Date;
}