const authService = require("@services/v1/auth.service");

exports.generateToken = async (req, res, next) => {
    try {
        const { type } = req.body;

        const result = await authService.generateToken({ type });

        res.status(201).json({
            success: true,
            message: "Token berhasil dibuat",
            data: result,
        });
    } catch (err) {
        res.status(err.status).json({ success: false, error: err.message });
    }
};

exports.getAllTokens = async (req, res) => {
    try {
        const result = await authService.getAllTokens();
        res.status(200).json({
            success: true,
            data: result,
        })
    } catch (err) {
        res.status(err.status).json({ message: err.message });
    }
}

exports.signup = async (req, res, next) => {
    try {
        const { username, password, token } = req.body;

        const newUser = await authService.signup({ username, password, token });

        res.status(201).json({
            success: true,
            message: "Signup berhasil",
            data: newUser,
        });
    } catch (err) {
        res.status(err.status).json({ success: false, error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const result = await authService.login({ username, password });

        res.status(200).json({
            success: true,
            message: "Login berhasil",
            data: result,
        });
    } catch (err) {
        res.status(err.status).json({ success: false, error: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { username, newPassword, token } = req.body;

        const result = await authService.resetPassword({ username, newPassword, token });

        res.json({
            success: true,
            message: "Password berhasil direset. Silakan login dengan password baru",
            data: result
        });
    } catch (err) {
        res.status(err.status).json({ success: false, error: err.message });
    }
}
