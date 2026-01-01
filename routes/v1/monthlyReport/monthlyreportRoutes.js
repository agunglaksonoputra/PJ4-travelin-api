const router = require("express").Router();
const { protectRoute, authorizeRole } = require("@middlewares/auth.middleware");
const profitCacheController = require("@controllers/v1/profitCache/profitCacheController");

router.use(protectRoute);
router.use(authorizeRole(["admin", "owner", "staff"]));

router.get("/", profitCacheController.profitSummary);
router.get("/cashin", profitCacheController.cashInSummary);
router.get("/cashflow", profitCacheController.cashFlowSummary);
router.get("/cashflow/:year/:month", profitCacheController.monthlyCashFlowDetail);
router.post("/:transactionId", profitCacheController.update);
router.delete("/:transactionId", profitCacheController.remove);

module.exports = router;
