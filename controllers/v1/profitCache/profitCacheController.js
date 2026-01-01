const { updateProfitCache, deleteProfitCache, getProfitSummary, getCashInSummary, getCashFlowSummary, getMonthlyCashFlowDetail } = require("@services/v1/monthlyReport/monthlyReportServices");

const getStatusCode = (error) => error.status || error.statusCode || 500;

exports.update = async (req, res, next) => {
  try {
    const { transactionId } = req.params;

    const result = await updateProfitCache(transactionId, {});

    res.status(200).json({
      success: true,
      message: "ProfitCache updated",
      data: result,
    });
  } catch (err) {
    const status = getStatusCode(err);
    res.status(status).json({ success: false, error: err.message || "Terjadi kesalahan" });
  }
};

exports.summary = async (req, res, next) => {
  try {
    const summary = await getProfitSummary();

    res.status(200).json({
      success: true,
      message: "Profit summary retrieved",
      data: summary,
    });
  } catch (err) {
    const status = getStatusCode(err);
    res.status(status).json({ success: false, error: err.message || "Terjadi kesalahan" });
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { transactionId } = req.params;

    const result = await deleteProfitCache(transactionId, {});

    res.status(200).json({
      success: true,
      message: "ProfitCache removed",
      data: result,
    });
  } catch (err) {
    const status = getStatusCode(err);
    res.status(status).json({ success: false, error: err.message || "Terjadi kesalahan" });
  }
};

exports.profitSummary = async (req, res, next) => {
  try {
    const summary = await getProfitSummary();

    return res.status(200).json({
      success: true,
      message: "Profit summary retrieved",
      data: summary,
    });
  } catch (err) {
    const status = getStatusCode(err);
    res.status(status).json({ success: false, error: err.message || "Terjadi kesalahan" });
  }
};

exports.cashInSummary = async (req, res, next) => {
  try {
    const summary = await getCashInSummary();

    return res.status(200).json({
      success: true,
      message: "Cash-in summary retrieved",
      data: summary,
    });
  } catch (err) {
    const status = getStatusCode(err);
    res.status(status).json({ success: false, error: err.message || "Terjadi kesalahan" });
  }
};

exports.cashFlowSummary = async (req, res, next) => {
  try {
    const { year, page, limit } = req.query;

    const result = await getCashFlowSummary({
      year,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
    });

    return res.status(200).json({
      success: true,
      message: "Cash flow summary retrieved",
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    const status = getStatusCode(err);
    res.status(status).json({
      success: false,
      error: err.message || "Terjadi kesalahan",
    });
  }
};

exports.monthlyCashFlowDetail = async (req, res) => {
  try {
    const { year, month } = req.params;
    const { page, limit } = req.query;

    const result = await getMonthlyCashFlowDetail(year, month, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });

    return res.status(200).json({
      success: true,
      message: "Monthly cashflow detail retrieved",
      month: `${year}-${month}`,
      ...result,
    });
  } catch (err) {
    res.status(getStatusCode(err)).json({
      success: false,
      error: err.message || "Terjadi kesalahan",
    });
  }
};
