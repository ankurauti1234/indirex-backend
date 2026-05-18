// src/database/entities/InactivityAlert.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
  } from "typeorm";
  
  @Entity({ name: "inactivity_alerts" })
  export class InactivityAlert {
    @PrimaryGeneratedColumn()
    id!: number;
  
    @Column({ type: "varchar", length: 50, unique: true })
    @Index()
    device_id!: string;
  
    @Column({ type: "varchar", length: 20, nullable: true })
    hhid!: string | null;
  
    @Column({ type: "timestamp", nullable: true })
    lastEventAt!: Date | null;
  
    @Column({ type: "timestamp" })
    detectedAt!: Date;
  
    @Column({ type: "boolean", default: true })
    @Index()
    isActive!: boolean;
  
    @CreateDateColumn()
    createdAt!: Date;
  
    @UpdateDateColumn()
    updatedAt!: Date;
  }
  