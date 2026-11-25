import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../DB/userDB.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

function createTokens(userId) {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be configured");
  }
  return {
    accessToken: jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" }),
    refreshToken: jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" }),
  };
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phoneNo: user.phoneNo,
    stats: user.stats,
  };
}

router.post("/userSignIn", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const { password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const tokens = createTokens(String(user._id));
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await user.save();
    return res.json({ message: "Login successful", ...tokens, user: publicUser(user) });
  } catch (error) {
    console.error("Sign in error:", error);
    return res.status(500).json({ message: "Could not sign in. Check the server JWT configuration." });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken || !process.env.JWT_REFRESH_SECRET || !process.env.JWT_ACCESS_SECRET) {
      return res.status(401).json({ message: "Refresh token required" });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user?.refreshTokenHash || !(await bcrypt.compare(refreshToken, user.refreshTokenHash))) {
      return res.status(401).json({ message: "Refresh token is invalid or expired. Please sign in again." });
    }
    const tokens = createTokens(String(user._id));
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await user.save();
    return res.json({ ...tokens, user: publicUser(user) });
  } catch (error) {
    return res.status(401).json({ message: "Refresh token is invalid or expired. Please sign in again." });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("name email phoneNo stats");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Could not load profile" });
  }
});

export default router;
