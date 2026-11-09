import express from "express";
import RequestRoom from "../DB/requestRoomDb.js";
import User from "../DB/userDB.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/fetchRoomData", authMiddleware, async (req, res) => {
  try {
    const rooms = await RequestRoom.find()
      .populate("createdBy", "name email phoneNo")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Room data fetched successfully",
      totalRooms: rooms.length,
      rooms
    });

  } catch (error) {
    console.error("Fetch room error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

export default router;