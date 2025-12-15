const express = require("express");
const router = express.Router();

const userController = require("@controllers/v1/user.controller");
const { protectRoute, authorizeRole } = require("@middlewares/auth.middleware");

router.use(protectRoute);
router.use(authorizeRole(["admin"]));

router.get("/", userController.getAllUsers);

// router.get("/:id", userController.getUserById);
// router.put("/:id/role", userController.updateUserRole);
// router.delete("/:id", userController.deleteUser);

module.exports = router;
