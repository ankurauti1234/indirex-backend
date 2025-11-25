"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.deleteUser = exports.updateUser = exports.getMe = exports.refreshToken = exports.createUser = exports.changePassword = exports.login = void 0;
const auth_service_1 = require("../../services/auth/auth.service");
const response_1 = require("../../utils/response");
const service = new auth_service_1.AuthService();
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email, password);
        const data = await service.login(email, password, res);
        console.log(data);
        (0, response_1.sendSuccess)(res, data, "Logged in");
        console.log("Logged in");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 401);
        console.log("err login");
    }
};
exports.login = login;
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!req.user)
            throw new Error("Unauthorized");
        await service.changePassword(req.user.id, oldPassword, newPassword);
        (0, response_1.sendSuccess)(res, null, "Password updated");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 400);
    }
};
exports.changePassword = changePassword;
const createUser = async (req, res) => {
    try {
        const { email, name, role } = req.body;
        const data = await service.createUserByAdmin({ email, name, role });
        (0, response_1.sendSuccess)(res, data, "User created – email sent", 201);
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 400);
    }
};
exports.createUser = createUser;
const refreshToken = async (req, res) => {
    try {
        let token = req.signedCookies?.refresh_token;
        if (!token && req.body.refreshToken)
            token = req.body.refreshToken;
        if (!token)
            throw new Error("Refresh token required");
        const data = await service.refreshToken(token, res);
        (0, response_1.sendSuccess)(res, data, "Token refreshed");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 401);
    }
};
exports.refreshToken = refreshToken;
const getMe = async (req, res) => {
    try {
        if (!req.user)
            throw new Error("Unauthorized");
        const user = await service.getUserById(req.user.id);
        (0, response_1.sendSuccess)(res, { user }, "User profile");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 404);
    }
};
exports.getMe = getMe;
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id; // UUID string
        const { name, role } = req.body;
        const updated = await service.updateUser(userId, { name, role });
        (0, response_1.sendSuccess)(res, updated, "User updated");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 400);
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id; // UUID string
        await service.deleteUser(userId);
        (0, response_1.sendSuccess)(res, null, "User deleted", 204);
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 400);
    }
};
exports.deleteUser = deleteUser;
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, role, isActive, sortBy = "createdAt", sortOrder = "DESC", } = req.query;
        const data = await service.getAllUsers({
            page: Number(page),
            limit: Number(limit),
            search: search,
            role: role,
            isActive: isActive !== undefined ? Boolean(isActive) : undefined,
            sortBy: sortBy,
            sortOrder: sortOrder,
        });
        (0, response_1.sendSuccess)(res, data, "Users retrieved successfully");
    }
    catch (e) {
        (0, response_1.sendError)(res, e.message, 400);
    }
};
exports.getAllUsers = getAllUsers;
