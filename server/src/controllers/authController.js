const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const getValidationErrors = (req) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return null;
  }

  return result.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }));
};

const register = async (req, res) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const { email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const user = await User.create({ email, password });
    const token = signToken(user._id.toString());

    res.cookie("token", token, getCookieOptions());
    return res.status(201).json({
      user: { id: user._id, email: user.email, createdAt: user.createdAt },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register user", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user._id.toString());
    res.cookie("token", token, getCookieOptions());

    return res.status(200).json({
      user: { id: user._id, email: user.email, createdAt: user.createdAt },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to log in", error: error.message });
  }
};

const logout = async (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json({ message: "Logged out successfully" });
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: { id: user._id, email: user.email, createdAt: user.createdAt },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user", error: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
