import express from "express";
import mongoose from "mongoose";
import RequestRoom from "../DB/requestRoomDb.js";
import UserCampus from "../DB/userCampusDb.js";

const router = express.Router();

router.put("/joinAndHelp", async (req, res) => {
    try {
        const { email, roomId } = req.body;

        if (!email || !roomId) {
            return res.status(400).json({
                message: "Email and roomId are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                message: "Invalid roomId"
            });
        }

        // Find the helper using their email
        const helper = await UserCampus.findOne({ email });

        if (!helper) {
            return res.status(404).json({
                message: "Helper not found"
            });
        }

        // Find the room
        const room = await RequestRoom.findById(roomId);

        if (!room) {
            return res.status(404).json({
                message: "Request room not found"
            });
        }

        // Prevent users from helping their own requests
        if (room.createdBy.toString() === helper._id.toString()) {
            return res.status(400).json({
                message: "You cannot help your own request"
            });
        }

        // Only allow joining open requests
        if (room.status !== "Open") {
            return res.status(400).json({
                message: "This request is no longer available"
            });
        }
        if (room.helpBy !== null) {
    return res.status(409).json({
        message: "This request is already being handled by another helper."
    });
}

        // Update room status and helper
        room.status = "Joined";
        room.helpBy = helper._id;

        await room.save();

        return res.status(200).json({
            message: "You have successfully joined this request",
            room
        });

    } catch (error) {
        console.error("joinAndHelp error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

export default router;