import express from "express";
import RequestRoom from "../DB/requestRoomDb.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/fetchRoomData", authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user.userId);
    // The lobby contains all unclaimed open rooms. Private in-progress and
    // completed rooms are returned only to their requester or assigned helper.
    const rooms = await RequestRoom.find({
      $or: [
        { status: "Open", helpBy: null },
        { createdBy: userId },
        { helpBy: userId }
      ]
    })
      .populate("createdBy", "name email phoneNo")
      .populate("helpBy", "name email phoneNo stats")
      .sort({ createdAt: -1 });

    const roomData = rooms.map((room) => {
      const value = room.toObject();
      const isRequester = String(value.createdBy._id) === userId;
      const isAssignedHelper = value.helpBy && String(value.helpBy._id) === userId;
      // Phone numbers and chat history are available only to participants in
      // a claimed room.
      if (!value.helpBy || (!isRequester && !isAssignedHelper)) delete value.createdBy.phoneNo;
      if (!isRequester && !isAssignedHelper) {
        value.messages = [];
        if (value.helpBy) delete value.helpBy.phoneNo;
      }
      return value;
    });

    const idOf = (value) => String(value?._id || value || "");
    const roomViews = {
      live: roomData.filter((room) => room.status === "Open"),
      mine: roomData.filter((room) => room.status === "Open" && idOf(room.createdBy) === userId),
      helping: roomData.filter((room) => idOf(room.helpBy) === userId && room.status !== "Completed"),
      helpedBy: roomData.filter((room) => idOf(room.createdBy) === userId && Boolean(room.helpBy) && room.status !== "Completed")
    };

    return res.status(200).json({
      message: "Room data fetched successfully",
      totalRooms: roomData.length,
      rooms: roomData,
      roomViews
    });
  } catch (error) {
    console.error("Fetch room error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
