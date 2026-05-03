const express = require("express");
const router = express.Router();

const userController = require("../Controller/userController");

// * login
router.post("/login", userController.login);
// * register
router.post("/register", userController.register);
// * logout
router.post("/logout", userController.logout);

module.exports = router;