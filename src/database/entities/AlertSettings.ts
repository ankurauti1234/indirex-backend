// src/database/entities/AlertSettings.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    UpdateDateColumn,
  } from "typeorm";
  
  @Entity({ name: "alert_settings" })
  export class AlertSettings {
    @PrimaryGeneratedColumn()
    id!: number;
  
    /** Inactivity threshold in hours (default 48 = 2 days) */
    @Column({ type: "int", default: 48 })
    inactivityThresholdHours!: number;
  
    /** Email report frequency in hours (default 48 = every 2 days) */
    @Column({ type: "int", default: 48 })
    emailFrequencyHours!: number;
  
    /** Timestamp of the last email sent */
    @Column({ type: "timestamp", nullable: true })
    lastEmailSentAt!: Date | null;
  
    /** Timestamp of the last inactivity check */
    @Column({ type: "timestamp", nullable: true })
    lastCheckAt!: Date | null;
  
    @UpdateDateColumn()
    updatedAt!: Date;
  }
  