import express from "express";
import RequestRoom from "../DB/requestRoomDb.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/createRoom", authMiddleware, async (req, res) => {
    try {
        const {
            title,
            description,
            address,
            category,
            tip,
            urgency
        } = req.body;

        // Check required fields
        if (
            !title ||
            !description ||
            !address ||
            !category
        ) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }

        // Create request room
        const room = await RequestRoom.create({
            title,
            description,
            address,
            category,
            tip: tip ?? 0,
            urgency: urgency || "Soon",
            createdBy: req.user.userId
        });

        return res.status(201).json({
            message: "Request room created successfully",
            room
        });

    } catch (error) {
        console.error("Create room error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

export default router;
