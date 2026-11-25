import express from "express";
import User from "../DB/userDB.js";
import bcrypt from "bcryptjs";
import Otp from "../DB/otpSchema.js";


const router = express.Router();

router.put("/forgetPassword", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const verifiedEmail = await Otp.findOne({
      email,
      verifiedAt: { $ne: null },
      expiresAt: { $gt: new Date() },
    });
    if (!verifiedEmail) {
      return res.status(403).json({ message: "Verify your email with OTP before updating your password" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
     const hashedPassword = await bcrypt.hash(password, 12);
    user.passwordHash = hashedPassword;
    await user.save();
    await Otp.deleteOne({ _id: verifiedEmail._id });

    return res.status(200).json({
      message: "Password updated successfully",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;
