const ownerBalanceService = require("@services/v1/owners/ownerBalanceService");

const getStatusCode = (error) => error.status || error.statusCode || 500;

exports.getOwnerBalance = async (req, res) => {
  try {
    const { ownerId } = req.params;

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "owner_id wajib diisi",
      });
    }

    const balance = await ownerBalanceService.getAvailableBalance(ownerId);

    return res.status(200).json({
      success: true,
      data: {
        owner_id: Number(ownerId),
        total_share: balance.total_share,
        total_withdrawn: balance.total_withdrawn,
        available_balance: balance.available_balance,
      },
    });
  } catch (error) {
    console.error("Get Owner Balance Error:", error);

    return res.status(getStatusCode(error)).json({
      success: false,
      message: error.message || "Gagal mengambil saldo owner",
    });
  }
};

exports.getAllOwnerBalances = async (req, res) => {
  try {
    const result = await ownerBalanceService.getAllAvailableBalanceWithOwner();

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get All Owner Balance Error:", error);

    return res.status(getStatusCode(error)).json({
      success: false,
      message: error.message || "Gagal mengambil saldo semua owner",
    });
  }
};
