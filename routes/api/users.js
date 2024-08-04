const express = require("express");
const { signup, login, logout, current, updateAvatar } = require("../../controllers/users");
const authMiddleware = require("../../authMiddleware");
const upload = require("../../middlewares/upload");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", authMiddleware, logout);
router.get("/current", authMiddleware, current);
router.patch("/avatars", authMiddleware, upload.single('avatar'), updateAvatar);

module.exports = router;
