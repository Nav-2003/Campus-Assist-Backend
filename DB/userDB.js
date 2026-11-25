import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNo:{
      type:String,
      required:true
    },
    passwordHash: {
        type: String,
        required: true
    },
    refreshTokenHash: {
        type: String,
        default: null
    },
    stats: {
        coins: { type: Number, default: 0 },
        completedJobs: { type: Number, default: 0 },
        helped: { type: Number, default: 0 },
        requested: { type: Number, default: 0 },
        tipsEarned: { type: Number, default: 0 },
        ratingSum: { type: Number, default: 0 },
        reviewsCount: { type: Number, default: 0 },
        points: { type: Number, default: 40 }
    },
    completedRoomIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "RequestRoom" }]
});

const User= mongoose.model("UserCampus", userSchema);
export default User
