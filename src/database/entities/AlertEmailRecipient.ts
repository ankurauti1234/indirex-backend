// src/database/entities/AlertEmailRecipient.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
  } from "typeorm";
  
  @Entity({ name: "alert_email_recipients" })
  export class AlertEmailRecipient {
    @PrimaryGeneratedColumn()
    id!: number;
  
    @Column({ type: "varchar", length: 255, unique: true })
    email!: string;
  
    @Column({ type: "varchar", length: 100, nullable: true })
    name!: string | null;
  
    @CreateDateColumn()
    createdAt!: Date;
  }
  