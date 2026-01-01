const router = require("express").Router();
const { protectRoute, authorizeRole } = require("@middlewares/auth.middleware");
const monthlyProfitController = require("@controllers/v1/monthlyProfit/monthlyProfitController");

router.use(protectRoute);
router.use(authorizeRole(["admin", "owner"]));

router.get("/", monthlyProfitController.listMonthlyProfits);
router.get("/:month", monthlyProfitController.getMonthlyProfit);
router.post("/calculate", monthlyProfitController.calculateMonthlyProfit);

module.exports = router;
