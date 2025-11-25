"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
// src/services/auth/auth.service.ts
const connection_1 = require("../../database/connection");
const User_1 = require("../../database/entities/User");
const RefreshToken_1 = require("../../database/entities/RefreshToken");
const encryption_1 = require("../../utils/encryption");
const env_1 = require("../../config/env");
const jwt_1 = require("../../config/jwt");
const email_1 = require("../../utils/email");
const crypto_1 = require("crypto");
const typeorm_1 = require("typeorm");
class AuthService {
    userRepo = connection_1.AppDataSource.getRepository(User_1.User);
    refreshRepo = connection_1.AppDataSource.getRepository(RefreshToken_1.RefreshToken);
    // 1. ADMIN: Create user + send temp password
    async createUserByAdmin(dto) {
        const exists = await this.userRepo.findOneBy({ email: dto.email });
        if (exists)
            throw new Error("Email already in use");
        const tempPassword = (0, crypto_1.randomBytes)(8).toString("hex");
        const hash = await (0, encryption_1.hashPassword)(tempPassword);
        const user = this.userRepo.create({
            email: dto.email,
            password: hash,
            name: dto.name,
            role: dto.role ?? User_1.UserRole.VIEWER,
            isActive: false,
        });
        await this.userRepo.save(user);
        await (0, email_1.sendAccountCreationEmail)(dto.email, dto.name, tempPassword);
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
    }
    // 2. LOGIN
    async login(email, password, res) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user || !(await (0, encryption_1.comparePassword)(password, user.password))) {
            throw new Error("Invalid credentials");
        }
        const accessPayload = { id: user.id, role: user.role };
        const accessToken = (0, jwt_1.generateAccessToken)(accessPayload);
        const refreshPayload = { id: user.id };
        const refreshToken = (0, jwt_1.generateRefreshToken)(refreshPayload);
        // Save refresh token
        // cast to any to satisfy entity partial typing (entity may have different declared types)
        const tokenRecord = this.refreshRepo.create({
            token: refreshToken,
            userId: user.id, // string (UUID)
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            revoked: false,
        });
        await this.refreshRepo.save(tokenRecord);
        const isProd = env_1.env.nodeEnv === "production";
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
    async changePassword(userId, oldPassword, newPassword) {
        const user = await this.userRepo.findOneByOrFail({ id: userId });
        const isMatch = await (0, encryption_1.comparePassword)(oldPassword, user.password);
        if (!isMatch)
            throw new Error("Current password is incorrect");
        user.password = await (0, encryption_1.hashPassword)(newPassword);
        user.isActive = true;
        await this.userRepo.save(user);
    }
    // 4. REFRESH TOKEN
    async refreshToken(refreshToken, res) {
        const payload = (0, jwt_1.verifyToken)(refreshToken, env_1.env.jwtRefreshSecret);
        const tokenRecord = await this.refreshRepo.findOne({
            where: {
                token: refreshToken,
                userId: Number(payload.id), // convert to number
                revoked: false,
                expiresAt: (0, typeorm_1.MoreThan)(new Date()),
            },
            relations: ["user"],
        });
        if (!tokenRecord)
            throw new Error("Invalid or expired refresh token");
        const newAccessToken = (0, jwt_1.generateAccessToken)({
            id: tokenRecord.user.id,
            role: tokenRecord.user.role,
        });
        const newRefreshToken = (0, jwt_1.generateRefreshToken)({ id: tokenRecord.user.id });
        await this.refreshRepo.update(tokenRecord.id, {
            token: newRefreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        const isProd = env_1.env.nodeEnv === "production";
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
    async getUserById(id) {
        const user = await this.userRepo.findOneBy({ id });
        if (!user)
            throw new Error("User not found");
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
    }
    // 6. UPDATE USER
    async updateUser(userId, dto) {
        const user = await this.userRepo.findOneBy({ id: userId });
        if (!user)
            throw new Error("User not found");
        if (dto.name)
            user.name = dto.name;
        if (dto.role)
            user.role = dto.role;
        await this.userRepo.save(user);
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
    }
    // 7. DELETE USER
    async deleteUser(userId) {
        const user = await this.userRepo.findOneBy({ id: userId });
        if (!user)
            throw new Error("User not found");
        await this.revokeRefreshTokens(userId);
        await this.userRepo.remove(user);
    }
    // 8. REVOKE ALL TOKENS
    async revokeRefreshTokens(userId) {
        await this.refreshRepo.update({ userId: Number(userId) }, { revoked: true });
    }
    async getAllUsers(params) {
        const { page, limit, search, role, isActive, sortBy, sortOrder, } = params;
        const skip = (page - 1) * limit;
        const query = this.userRepo.createQueryBuilder("user");
        // Search: name OR email
        if (search?.trim()) {
            query.andWhere("(user.name ILIKE :search OR user.email ILIKE :search)", { search: `%${search.trim()}%` });
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
exports.AuthService = AuthService;
