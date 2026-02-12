const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const { register, login, logout, getMe } = require("../controllers/authController");

const router = express.Router();

const emailValidation = body("email")
  .isEmail()
  .withMessage("A valid email is required")
  .normalizeEmail();

const registerPasswordValidation = body("password")
  .isLength({ min: 6 })
  .withMessage("Password must be at least 6 characters long");

const loginPasswordValidation = body("password")
  .notEmpty()
  .withMessage("Password is required");

router.post("/register", [emailValidation, registerPasswordValidation], register);
router.post("/login", [emailValidation, loginPasswordValidation], login);
router.post("/logout", logout);
router.get("/me", auth, getMe);

module.exports = router;
