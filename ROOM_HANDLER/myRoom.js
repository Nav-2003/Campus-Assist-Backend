import express from "express";
import RequestRoom from "../DB/requestRoomDb.js";
import UserCampus from "../DB/userCampusDb.js";

const router = express.Router();

router.get("/myRoom", async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await UserCampus.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const rooms = await RequestRoom.find({
            createdBy: user._id
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Rooms fetched successfully",
            rooms
        });

    } catch (error) {
        console.error("myRoom error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

export default router;