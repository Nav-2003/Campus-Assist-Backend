import express from "express";
import crypto from "crypto";
import Otp from "../DB/otpSchema.js";
import transporter from "../config/mail.js";

const router = express.Router();

router.post("/sendOtp", async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }
        if (!/^[^\s@]+@nitjsr\.ac\.in$/i.test(email)) {
            return res.status(400).json({ message: "Use your official @nitjsr.ac.in email" });
        }

        const otp = crypto
            .randomInt(100000, 1000000)
            .toString();

        const expiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );

        await Otp.findOneAndUpdate(
            { email },
            {
                otp,
                expiresAt,
                verifiedAt: null
            },
            {
                upsert: true,
                new: true
            }
        );

        await transporter.sendMail({
            from: process.env.pass,
            to: email,
            subject: "Your OTP Verification Code",

            text: `Your OTP is ${otp}. This OTP is valid for 5 minutes.`,

            html: `
                <h2>Email Verification</h2>

                <p>Your OTP is:</p>

                <h1>${otp}</h1>

                <p>This OTP is valid for <b>5 minutes</b>.</p>

                <p>If you did not request this OTP, please ignore this email.</p>
            `
        });

        return res.status(200).json({
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.error("OTP error:", error);

        return res.status(500).json({
            message: "Failed to send OTP"
        });
    }
});

export default router;
