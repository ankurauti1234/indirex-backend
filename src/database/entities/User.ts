// src/database/entities/User.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import bcrypt from "bcryptjs";

export enum UserRole {
  ADMIN = "admin",
  DEVELOPER = "developer",
  VIEWER = "viewer",
}

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")   // UUID
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.VIEWER })
  role!: UserRole;

  @Column({ default: false })       // restored
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}