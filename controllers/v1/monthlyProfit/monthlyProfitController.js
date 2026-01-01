const monthlyProfitService = require("@services/v1/monthlyProfit/monthlyProfitServices");

const getStatusCode = (error) => error.status || error.statusCode || 500;

const parseBool = (v) => {
  if (v === undefined) return undefined;
  if (typeof v === "boolean") return v;
  return v === "true" || v === "1";
};

/**
 * GET /monthly-profits
 * query:
 *  - month (optional)
 */
exports.listMonthlyProfits = async (req, res) => {
  try {
    const { month } = req.query;

    const filters = {};
    if (month) filters.month = month;

    const rows = await monthlyProfitService.listMonthlyProfits({ filters });

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (err) {
    const status = getStatusCode(err);
    res.status(status).json({
      success: false,
      error: err.message || "Terjadi kesalahan",
    });
  }
};

/**
 * GET /monthly-profits/:month
 */
exports.getMonthlyProfit = async (req, res) => {
  try {
    const { month } = req.params;

    const row = await monthlyProfitService.getMonthlyProfitByMonth(month);

    res.status(200).json({
      success: true,
      data: row,
    });
  } catch (err) {
    const status = getStatusCode(err);
    res.status(status).json({
      success: false,
      error: err.message || "Terjadi kesalahan",
    });
  }
};

/**
 * POST /monthly-profits/calculate
 * body:
 *  - month (YYYY-MM)
 *  - note (optional)
 */
exports.calculateMonthlyProfit = async (req, res) => {
  try {
    const actorUserId = req.user?.id || null;
    const { month, note } = req.body;

    const row = await monthlyProfitService.calculateMonthlyProfit({
      month,
      note,
      actorUserId,
    });

    res.status(201).json({
      success: true,
      message: "Monthly profit calculated",
      data: row,
    });
  } catch (err) {
    const status = getStatusCode(err);
    res.status(status).json({
      success: false,
      error: err.message || "Terjadi kesalahan",
    });
  }
};

/**
 * DELETE /monthly-profits/:month
 * (optional – jika ingin allow reset bulan)
 */
exports.deleteMonthlyProfit = async (req, res) => {
  try {
    const { month } = req.params;
    const actorUserId = req.user?.id || null;

    await monthlyProfitService.deleteMonthlyProfit({
      month,
      actorUserId,
    });

    res.status(200).json({
      success: true,
      message: "Monthly profit deleted",
    });
  } catch (err) {
    const status = getStatusCode(err);
    res.status(status).json({
      success: false,
      error: err.message || "Terjadi kesalahan",
    });
  }
};
