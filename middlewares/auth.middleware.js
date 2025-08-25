const createError = require("http-errors");
const jwt = require("jsonwebtoken");

module.exports.protectRoute = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw createError(401, "Token tidak ditemukan");
        }

        const token = authHeader.split(" ")[1];

        // Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Simpan info user di request
        req.user = decoded;

        next(); // lanjut ke route berikutnya
    } catch (err) {
        return next(createError(401, "Invalid or expired token"));
    }
};

module.exports.authorizeRole = (roles = []) => {
    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {
            return next(createError(403, "Forbidden: Access denied"));
        }

        next();
    };
};
