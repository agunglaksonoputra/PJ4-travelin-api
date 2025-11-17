const { Op } = require("sequelize");
const createError = require("http-errors");
const { User, UserToken } = require('@models');
const {randomHex} = require("@utils/cryptoUtil");
const {hashPassword, comparePassword} = require("@utils/hashPassword");
const {signToken} = require("@utils/jwtUtil");

exports.generateToken = async ({ type }) => {
    if (!["signup", "reset_password"].includes(type)) {
        throw createError(400, "Invalid token type");
    }

    // generate token random (8 karakter hex)
    const token = randomHex(4);

    // masa berlaku 5 menit (bisa disesuaikan)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // simpan token baru
    await UserToken.create({
        token,
        type,
        expiresAt,
    });

    return {
        token,
        type,
        expiresAt,
    };
};

exports.getAllTokens = async ({ onlyValid = false } = {}) => {
    // Hapus semua token expired dulu
    await UserToken.destroy({
        where: {
            expiresAt: { [Op.lt]: new Date() }
        }
    });

    // Ambil token sesuai filter
    let where = {};
    if (onlyValid) {
        where.expiresAt = { [Op.gt]: new Date() };
    }

    const tokens = await UserToken.findAll({
        where,
        order: [["expiresAt", "ASC"]],
    });

    return tokens;
};

exports.signup = async ({ username, password, token }) => {
    if (!username || !password || !token) {
        throw createError(400, "Username, password, dan token wajib diisi");
    }

    // Validasi username hanya huruf/angka
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        throw createError(400, "Username hanya boleh berisi huruf dan angka");
    }

    // Validasi panjang password minimal 6 karakter
    if (password.length < 6) {
        throw createError(400, "Password minimal 6 karakter");
    }

    const existingToken = await UserToken.findOne({
        where: {
            token,
            type: "signup",
        },
    });

    if (!existingToken) {
        throw createError(401, "Token tidak valid");
    }

    if (new Date() > existingToken.expiresAt) {
        throw createError(401, "Token sudah kadaluarsa");
    }

    // cek username sudah ada atau belum
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
        throw createError(409, "Username sudah digunakan");
    }

    // hash password
    const hashedPassword = await hashPassword(password);

    await existingToken.destroy();

    const user = await User.create({
        username,
        password: hashedPassword,
    });

    return user.username;
}

exports.login = async ({ username, password }) => {
    if (!username || !password) {
        throw createError(400, "Username dan password wajib diisi");
    }

    const user = await User.findOne({ where: { username } });

    if (!user) {
        throw createError(401, "Username atau password salah");
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        throw createError(401, "Username atau password salah");
    }

    const payload = {
        id: user.id,
        username: user.username,
    role: user.role,
    };

    // const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    const token = signToken(payload);

    return {
        token,
        user: payload,
    };
}

exports.resetPassword = async ({ username, newPassword, token }) => {
    if (!username || !newPassword || !token) {
        throw createError(400, "Username, password baru, dan token wajib diisi");
    }

    // Validasi panjang password
    if (newPassword.length < 6) {
        throw createError(400, "Password minimal 6 karakter");
    }

    // Cek token
    const existingToken = await UserToken.findOne({
        where: {
            token,
            type: "reset_password",
        },
    });

    if (!existingToken) {
        throw createError(401, "Token tidak valid");
    }

    if (new Date() > existingToken.expiresAt) {
        throw createError(401, "Token sudah kadaluarsa");
    }

    // Cek user
    const user = await User.findOne({ where: { username } });
    if (!user) {
        throw createError(404, "User tidak ditemukan");
    }

    // Hash password baru
    const hashedPassword = await hashPassword(newPassword);

    // Update password user
    user.password = hashedPassword;
    await user.save();

    // Hapus token biar tidak bisa dipakai ulang
    await existingToken.destroy();

    return {
        username: user.username,
    };
};
