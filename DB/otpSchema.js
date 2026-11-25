import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },

    otp: {
        type: String,
        required: true
    },

    expiresAt: {
        type: Date,
        required: true,
        index: true,
        expires: 0
    },
    verifiedAt: {
        type: Date,
        default: null
    }
});

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
