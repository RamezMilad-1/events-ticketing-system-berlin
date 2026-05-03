const express = require('express');
const router = express.Router();
const userController = require('../Controller/userController');

// --- Public auth ---
router.post('/login', userController.login);
router.post('/register', userController.register);

// Logout (both spellings to match Task 2 / Task 3 wording)
router.post('/logout', userController.logout);
router.post('/logOut', userController.logout);

// --- Forgot password (3-step OTP flow + single-call form) ---
router.post('/forgetPassword/request', userController.requestPasswordReset);
router.post('/forgetPassword/verify', userController.verifyPasswordResetOtp);

// Spec form: PUT /api/v1/forgetPassword (accepts {email,otp,newPassword} or {resetToken,newPassword})
router.put('/forgetPassword', userController.resetPassword);
router.put('/forgotPassword', userController.resetPassword); // alias for the common typo

module.exports = router;
