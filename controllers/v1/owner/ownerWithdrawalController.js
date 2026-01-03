const ownerWithdrawalService = require("@services/v1/owners/ownerWithdrawalServices");

const getStatusCode = (error) => error.status || error.statusCode || 500;

/**
 * GET /owner-withdrawals
 * Query:
 * - owner_id
 * - method
 * - page
 * - limit
 */
exports.listOwnerWithdrawals = async (req, res) => {
  try {
    const { owner_id, method, page = 1, limit = 10 } = req.query;

    const filters = {};
    if (owner_id) filters.owner_id = owner_id;
    if (method) filters.method = method;

    const result = await ownerWithdrawalService.listOwnerWithdrawals({
      filters,
      page: Number(page),
      limit: Number(limit),
    });

    res.status(200).json({
      success: true,
      data: result.data,
      paginated: result.paginated,
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

/**
 * GET /owner-withdrawals/:id
 */
exports.getOwnerWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;

    const withdrawal = await ownerWithdrawalService.getOwnerWithdrawalById(id);

    res.status(200).json({
      success: true,
      data: withdrawal,
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
 * POST /owner-withdrawals
 */
exports.createOwnerWithdrawal = async (req, res) => {
  try {
    const actorUserId = req.user?.id || null;

    const withdrawal = await ownerWithdrawalService.createOwnerWithdrawal({
      data: req.body,
      actorUserId,
    });

    res.status(201).json({
      success: true,
      message: "Owner withdrawal created",
      data: withdrawal,
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
 * PUT /owner-withdrawals/:id
 */
exports.refundOwnerWithdrawal = async (req, res) => {
  try {
    const withdrawalId = Number(req.params.id);
    if (Number.isNaN(withdrawalId)) {
      throw createError(400, "Invalid withdrawal id");
    }

    const actorUserId = req.user?.id || null;

    const withdrawal = await ownerWithdrawalService.refundOwnerWithdrawal({
      withdrawalId,
      actorUserId,
    });

    res.status(200).json({
      success: true,
      message: `Withdrawal ${withdrawal.id} refunded`,
      data: withdrawal,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message,
    });
  }
};

/**
 * DELETE /owner-withdrawals/:id
 */
exports.deleteOwnerWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const actorUserId = req.user?.id || null;

    await ownerWithdrawalService.deleteOwnerWithdrawal({
      withdrawalId: id,
      actorUserId,
    });

    res.status(200).json({
      success: true,
      message: "Owner withdrawal deleted",
    });
  } catch (err) {
    const status = getStatusCode(err);
    res.status(status).json({
      success: false,
      error: err.message || "Terjadi kesalahan",
    });
  }
};
