import express from "express";
import bcrypt from "bcryptjs";
import User from "../DB/userDB.js";
import Otp from "../DB/otpSchema.js";

const router = express.Router();

router.post("/userSignUp", async (req, res) => {
    try {
        const { name, phoneNo, password } = req.body;
        const email = String(req.body.email || "").trim().toLowerCase();

        if (!name || !email || !phoneNo || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (!/^[^\s@]+@nitjsr\.ac\.in$/i.test(email)) {
            return res.status(400).json({ message: "Use your official @nitjsr.ac.in email" });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        const existingUser = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const verifiedEmail = await Otp.findOne({ email, verifiedAt: { $ne: null }, expiresAt: { $gt: new Date() } });
        if (!verifiedEmail) {
            return res.status(403).json({ message: "Verify your email with OTP before creating an account" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phoneNo: String(phoneNo),
            passwordHash: hashedPassword
        });
        await Otp.deleteOne({ _id: verifiedEmail._id });

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phoneNo: newUser.phoneNo
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        console.error("Signup error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

export default router;
