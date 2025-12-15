const { Op } = require("sequelize");
const { User } = require("@models");

exports.getAllUsers = async ({ page = 1, limit = 10, search = null } = {}) => {
  const offset = (page - 1) * limit;

  let where = {};

  // Search berdasarkan username
  if (search) {
    where.username = {
      [Op.iLike]: `%${search}%`, // PostgreSQL
      // jika MySQL ganti ke Op.like
    };
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: {
      exclude: ["password"], // jangan kirim password
    },
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });

  return {
    data: rows,
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};
