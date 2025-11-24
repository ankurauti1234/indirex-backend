import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity({ name: "events" })
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  device_id!: string;

  @Column({ type: "bigint" })
  @Index()
  timestamp!: number; // Unix timestamp (10 digits)

  @Column()
  type!: number; // int

  @Column({ type: "jsonb" })
  details!: Record<string, any>; // JSONB object, varies by type

  @CreateDateColumn()
  createdAt!: Date;
}