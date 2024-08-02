const express = require("express");
const { signup, login, logout, current } = require("../../controllers/users");
const authMiddleware = require("../../authMiddleware");

console.log('signup:', typeof signup);
console.log('login:', typeof login);
console.log('logout:', typeof logout);
console.log('current:', typeof current);
console.log('authMiddleware:', typeof authMiddleware);

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", authMiddleware, logout);
router.get("/current", authMiddleware, current);

module.exports = router;