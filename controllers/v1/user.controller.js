const userService = require("@services/v1/user.service");

// GET /users?page=1&limit=10&search=admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;

    const result = await userService.getAllUsers({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      search,
    });

    res.json({
      success: true,
      message: "Berhasil mengambil data user",
      ...result,
    });
  } catch (err) {
    next(err);
  }
};
