const jwt = require("jsonwebtoken");
const createError = require("http-errors");

const JWT_SECRET = process.env.JWT_SECRET;

exports.signToken = (payload, expiresIn = "1h") => {
    try {
        return jwt.sign(payload, JWT_SECRET, { expiresIn });
    } catch (err) {
        throw createError(500, "Gagal membuat token");
    }
};

exports.verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            throw createError(401, "Token sudah kadaluarsa");
        }
        if (err.name === "JsonWebTokenError") {
            throw createError(401, "Token tidak valid");
        }
        throw createError(500, "Gagal memverifikasi token");
    }
};

exports.decodeToken = (token) => {
    return jwt.decode(token, { complete: true });
};