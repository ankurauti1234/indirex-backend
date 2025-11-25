"use strict";
// src/utils/errors.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.ConflictError = exports.NotFoundError = exports.UnauthorizedError = exports.BadRequestError = void 0;
/**
 * Base custom error class
 */
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
/**
 * 400 Bad Request
 */
class BadRequestError extends AppError {
    constructor(message = "Bad Request") {
        super(message, 400);
    }
}
exports.BadRequestError = BadRequestError;
/**
 * 401 Unauthorized
 */
class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * 404 Not Found
 */
class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * 409 Conflict
 */
class ConflictError extends AppError {
    constructor(message = "Conflict") {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
/**
 * 500 Internal Server Error
 */
class InternalServerError extends AppError {
    constructor(message = "Internal Server Error") {
        super(message, 500);
    }
}
exports.InternalServerError = InternalServerError;
