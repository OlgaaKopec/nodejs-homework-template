const express = require("express");
const { signup, login, logout, current, updateAvatar, verifyEmail, resendVerificationEmail } = require("../../controllers/users");
const authMiddleware = require("../../authMiddleware");
const upload = require("../../middlewares/upload");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", authMiddleware, logout);
router.get("/current", authMiddleware, current);
router.patch("/avatars", authMiddleware, upload.single('avatar'), updateAvatar);
router.get("/verify/:verificationToken", verifyEmail);
router.post("/verify", resendVerificationEmail);

module.exports = router;