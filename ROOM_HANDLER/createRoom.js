import express from "express";
import RequestRoom from "../DB/requestRoomDb.js";
import authMiddleware from "../middleware/authMiddleware.js";
import UserCampus from "../DB/userDB.js";

const router = express.Router();

router.post("/createRoom", authMiddleware, async (req, res) => {
    try {
        const {
            title,
            description,
            address,
            category,
            categories,
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
            categories: Array.isArray(categories) && categories.length ? categories : [category],
            tip: tip ?? 0,
            urgency: urgency || "Soon",
            createdBy: req.user.userId
        });
        const creator = await UserCampus.findById(req.user.userId);
        if (creator) {
            creator.stats = { coins: 0, completedJobs: 0, helped: 0, requested: 0, tipsEarned: 0, points: 40, ...creator.stats?.toObject?.(), ...creator.stats };
            creator.stats.requested += 1;
            creator.stats.points += 5;
            await creator.save();
        }

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
