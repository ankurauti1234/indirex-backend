// src/services/auth/auth.service.ts
import { AppDataSource } from "../../database/connection";
import { User, UserRole } from "../../database/entities/User";
import { RefreshToken } from "../../database/entities/RefreshToken";
import { hashPassword, comparePassword } from "../../utils/encryption";
import { env } from "../../config/env";
import {
  generateAccessToken,
  generateRefreshToken,
  AccessPayload,
  RefreshPayload,
  verifyToken,
} from "../../config/jwt";
import { sendAccountCreationEmail,sendNewPassword } from "../../utils/email";
import { randomBytes } from "crypto";
import { MoreThan } from "typeorm";
import { log } from "console";

interface GetAllUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
}

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private refreshRepo = AppDataSource.getRepository(RefreshToken);

  // 1. ADMIN: Create user + send temp password
  async createUserByAdmin(dto: {
    email: string;
    name: string;
    role?: UserRole;
  }) {
    const exists = await this.userRepo.findOneBy({ email: dto.email });
    if (exists) throw new Error("Email already in use");

    const tempPassword = randomBytes(8).toString("hex");
    const hash = await hashPassword(tempPassword);

    const user = this.userRepo.create({
      email: dto.email,
      password: tempPassword,
      name: dto.name,
      role: dto.role ?? UserRole.VIEWER,
      isActive: false,
    });

    await this.userRepo.save(user);
    await sendAccountCreationEmail(dto.email, dto.name, tempPassword);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  // 2. LOGIN
  async login(email: string, password: string, res: any) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !(await comparePassword(password, user.password))) {
      throw new Error("Invalid credentials");
    }

    const accessPayload: AccessPayload = { id: user.id, role: user.role };
    const accessToken = generateAccessToken(accessPayload);

    const refreshPayload: RefreshPayload = { id: user.id };
    const refreshToken = generateRefreshToken(refreshPayload);

    // Save refresh token
    // cast to any to satisfy entity partial typing (entity may have different declared types)
    const tokenRecord = this.refreshRepo.create({
      token: refreshToken,
      userId: user.id, // string (UUID)
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false,
    } as any);
    await this.refreshRepo.save(tokenRecord);

    const isProd = env.nodeEnv === "production";
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: isProd,
      signed: true,
      maxAge: 60 * 60 * 1000,
      sameSite: "lax",
    });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      signed: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        needsPasswordChange: !user.isActive,
      },
    };
  }

  // 3. CHANGE PASSWORD
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ) {
    const user = await this.userRepo.findOneByOrFail({ id: userId });
    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) throw new Error("Current password is incorrect");

    user.password = await hashPassword(newPassword);
    user.isActive = true;
    await this.userRepo.save(user);
  }

  // 4. REFRESH TOKEN
  async refreshToken(refreshToken: string, res: any) {
    const payload = verifyToken<RefreshPayload>(
      refreshToken,
      env.jwt.refreshSecret
    );

    const tokenRecord = await this.refreshRepo.findOne({
      where: {
        token: refreshToken,
        userId: payload.id, // convert to number
        revoked: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ["user"],
    });

    if (!tokenRecord) throw new Error("Invalid or expired refresh token");

    const newAccessToken = generateAccessToken({
      id: tokenRecord.user.id,
      role: tokenRecord.user.role,
    });

    const newRefreshToken = generateRefreshToken({ id: tokenRecord.user.id });
    await this.refreshRepo.update(tokenRecord.id, {
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const isProd = env.nodeEnv === "production";
    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: isProd,
      signed: true,
      maxAge: 60 * 60 * 1000,
      sameSite: "lax",
    });
    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      signed: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    return {
      user: {
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        name: tokenRecord.user.name,
        role: tokenRecord.user.role,
      },
    };
  }

  // 5. GET USER BY ID
  async getUserById(id: string) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new Error("User not found");
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  // 6. UPDATE USER
  async updateUser(userId: string, dto: { name?: string; role?: UserRole }) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new Error("User not found");

    if (dto.name) user.name = dto.name;
    if (dto.role) user.role = dto.role;

    await this.userRepo.save(user);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  // 7. DELETE USER
  async deleteUser(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new Error("User not found");

    await this.revokeRefreshTokens(userId);
    console.log("1");

    await this.userRepo.remove(user);
    console.log("2");

    return {
      message: "User deleted successfully",
    };
  }

  // 8. REVOKE ALL TOKENS
  async revokeRefreshTokens(userId: string) {
    await this.refreshRepo.update({ userId: userId }, { revoked: true });
  }

  //  9 forgot password
  async forgotPassword(dto: { email: string }) {
    const user = await this.userRepo.findOneBy({ email: dto.email });
    if (!user) throw new Error("Email not found");

    // Generate a temporary password
    const tempPassword = randomBytes(8).toString("hex");
    const hash = await hashPassword(tempPassword);

    await this.userRepo.update({ email: dto.email }, { password: hash });

    // Send new password via email (make sure sendNewPassword accepts the email & password)
    await sendNewPassword(user.email, tempPassword);

    return "New password sent successfully";
  }

  async getAllUsers(params: GetAllUsersParams) {
    const { page, limit, search, role, isActive, sortBy, sortOrder } = params;

    const skip = (page - 1) * limit;

    const query = this.userRepo.createQueryBuilder("user");

    // Search: name OR email
    if (search?.trim()) {
      query.andWhere("(user.name ILIKE :search OR user.email ILIKE :search)", {
        search: `%${search.trim()}%`,
      });
    }

    // Filters
    if (role) {
      query.andWhere("user.role = :role", { role });
    }
    if (isActive !== undefined) {
      query.andWhere("user.isActive = :isActive", { isActive });
    }

    // Sorting
    const validSortFields = ["name", "email", "role", "createdAt", "updatedAt"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    query.orderBy(`user.${sortField}`, sortOrder);

    // Execute with pagination
    const [users, total] = await query
      .select([
        "user.id",
        "user.email",
        "user.name",
        "user.role",
        "user.isActive",
        "user.createdAt",
        "user.updatedAt",
      ])
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }
}