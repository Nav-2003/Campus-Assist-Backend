import express from "express";
import mongoose from "mongoose";
import RequestRoom from "../DB/requestRoomDb.js";
import UserCampus from "../DB/userDB.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

async function awardCompletion(room) {
  if (!room.helpBy) return;
  const helper = await UserCampus.findById(room.helpBy);
  if (!helper) return;
  helper.stats = { coins: 0, completedJobs: 0, helped: 0, requested: 0, tipsEarned: 0, points: 40, ...helper.stats?.toObject?.(), ...helper.stats };
  await helper.save();
  await UserCampus.updateOne(
    { _id: room.helpBy, completedRoomIds: { $ne: room._id } },
    {
      $addToSet: { completedRoomIds: room._id },
      $inc: {
        "stats.coins": 50,
        "stats.completedJobs": 1,
        "stats.helped": 1,
        "stats.points": 20,
        "stats.tipsEarned": Number(room.tip || 0)
      }
    }
  );
}

router.put("/joinAndHelp", async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(roomId)) return res.status(400).json({ message: "Invalid roomId" });
    const helper = await UserCampus.findById(req.user.userId);
    if (!helper) return res.status(404).json({ message: "Helper not found" });
    const room = await RequestRoom.findOneAndUpdate(
      { _id: roomId, status: "Open", helpBy: null, createdBy: { $ne: helper._id } },
      { $set: { status: "Joined", helpBy: helper._id } },
      { new: true }
    );
    if (room) {
      await room.populate("createdBy", "name email phoneNo");
      await room.populate("helpBy", "name email phoneNo stats");
      return res.json({ message: "You have successfully joined this request", room });
    }
    const current = await RequestRoom.findById(roomId);
    if (!current) return res.status(404).json({ message: "Request room not found" });
    return res.status(409).json({ message: current.createdBy.equals(helper._id) ? "You cannot help your own request" : "This request is no longer available" });
  } catch (error) {
    console.error("joinAndHelp error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:roomId/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Coming", "Parchasing", "Completed", "Cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid room status" });
    const room = await RequestRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: "Request room not found" });
    const uid = String(req.user.userId);
    const isOwner = String(room.createdBy) === uid;
    const isHelper = String(room.helpBy) === uid;
    if (status === "Completed" && isHelper && room.status === "Completed") {
      await awardCompletion(room);
      await room.populate("createdBy", "name email phoneNo");
      await room.populate("helpBy", "name email phoneNo stats");
      return res.json({ message: "Request completed and helper rewards confirmed", room, reward: { coins: 50 } });
    }
    if (status === "Cancelled" && isOwner) {
      if (room.status === "Parchasing" || room.status === "Completed") return res.status(409).json({ message: "The request cannot be cancelled after purchasing has started." });
      room.status = "Open";
      room.helpBy = null;
    } else if (status === "Cancelled" && isHelper) {
      if (["Open", "Completed", "Cancelled"].includes(room.status)) return res.status(409).json({ message: "You can cancel only an active request you are helping." });
      room.status = "Open";
      room.helpBy = null;
    } else if (isHelper && status === "Coming" && room.status === "Joined") room.status = status;
    else if (isHelper && status === "Parchasing" && ["Joined", "Coming"].includes(room.status)) room.status = status;
    else if (isHelper && status === "Completed" && room.status === "Parchasing") room.status = status;
    else return res.status(403).json({ message: "You cannot make that status change." });
    if (status === "Cancelled" || status === "Completed") room.tracking = [];
    await room.save();
    if (status === "Completed") await awardCompletion(room);
    await room.populate("createdBy", "name email phoneNo");
    await room.populate("helpBy", "name email phoneNo stats");
    return res.json({ message: "Room status updated", room, ...(status === "Completed" ? { reward: { coins: 50 } } : {}) });
  } catch (error) {
    console.error("Update room status error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:roomId/review", async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    const feedback = String(req.body.feedback || "").trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Choose a rating from 1 to 5 stars." });
    }
    if (feedback.length > 600) return res.status(400).json({ message: "Feedback must be 600 characters or fewer." });

    const room = await RequestRoom.findOneAndUpdate(
      { _id: req.params.roomId, createdBy: req.user.userId, status: "Completed", helpBy: { $ne: null }, "review.rating": { $exists: false } },
      { $set: { review: { rating, feedback, createdAt: new Date() } } },
      { new: true }
    );
    if (!room) {
      const current = await RequestRoom.findById(req.params.roomId).select("createdBy status review.rating");
      if (!current) return res.status(404).json({ message: "Request not found." });
      if (String(current.createdBy) !== String(req.user.userId)) return res.status(403).json({ message: "Only the requester can review this task." });
      if (current.status !== "Completed") return res.status(409).json({ message: "You can review after the task is completed." });
      return res.status(409).json({ message: "Feedback has already been submitted for this task." });
    }

    await UserCampus.updateOne({ _id: room.helpBy }, { $inc: { "stats.ratingSum": rating, "stats.reviewsCount": 1 } });
    await room.populate("createdBy", "name email phoneNo");
    await room.populate("helpBy", "name email phoneNo stats");
    return res.status(201).json({ message: "Thanks for sharing your feedback.", room });
  } catch (error) {
    console.error("Submit review error:", error);
    return res.status(500).json({ message: "Could not submit feedback." });
  }
});

router.patch("/:roomId", async (req, res) => {
  try {
    const room = await RequestRoom.findOne({ _id: req.params.roomId, createdBy: req.user.userId, status: "Open", helpBy: null });
    if (!room) return res.status(404).json({ message: "Only your unclaimed open rooms can be edited." });
    for (const field of ["title", "description", "address", "category", "tip", "urgency", "categories"]) if (req.body[field] !== undefined) room[field] = req.body[field];
    await room.save();
    return res.json({ message: "Room updated", room });
  } catch (error) { return res.status(400).json({ message: error.message || "Could not update room" }); }
});

router.delete("/:roomId", async (req, res) => {
  try {
    const room = await RequestRoom.findOne({ _id: req.params.roomId, createdBy: req.user.userId, status: "Open", helpBy: null });
    if (!room) return res.status(404).json({ message: "Only your unclaimed open rooms can be deleted." });
    await room.deleteOne();
    return res.json({ message: "Room deleted" });
  } catch (error) { return res.status(500).json({ message: "Internal server error" }); }
});

router.post("/:roomId/messages", async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();
    if (!text || text.length > 500) return res.status(400).json({ message: "Message must be 1 to 500 characters." });
    const room = await RequestRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: "Request room not found" });
    const uid = String(req.user.userId);
    if (![String(room.createdBy), String(room.helpBy)].includes(uid) || !room.helpBy) return res.status(403).json({ message: "Only the requester and assigned helper can chat." });
    if (["Completed", "Cancelled"].includes(room.status)) return res.status(409).json({ message: "This room chat is closed." });
    const sender = await UserCampus.findById(uid);
    room.messages.push({ sender: sender._id, name: sender.name, text });
    await room.save();
    await room.populate("createdBy", "name email phoneNo");
    await room.populate("helpBy", "name email phoneNo stats");
    return res.status(201).json({ message: "Message sent", room });
  } catch (error) { return res.status(500).json({ message: "Internal server error" }); }
});

router.get("/:roomId/tracking", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.roomId)) return res.status(400).json({ message: "Invalid roomId" });
    const room = await RequestRoom.findById(req.params.roomId).populate("tracking.user", "name");
    if (!room) return res.status(404).json({ message: "Request room not found" });
    const uid = String(req.user.userId);
    if (!room.helpBy || ![String(room.createdBy), String(room.helpBy)].includes(uid)) {
      return res.status(403).json({ message: "Only the requester and assigned helper can view this ticket's location." });
    }
    if (!["Joined", "Coming", "Parchasing"].includes(room.status)) {
      return res.json({ tracking: [] });
    }
    const cutoff = Date.now() - 90_000;
    const tracking = (room.tracking || [])
      .filter((entry) => entry.updatedAt && new Date(entry.updatedAt).getTime() >= cutoff)
      .map((entry) => ({
        userId: String(entry.user?._id || entry.user),
        name: entry.user?.name || "Student",
        latitude: entry.latitude,
        longitude: entry.longitude,
        accuracy: entry.accuracy,
        updatedAt: entry.updatedAt
      }));
    return res.json({ tracking });
  } catch (error) {
    console.error("Fetch tracking error:", error);
    return res.status(500).json({ message: "Could not load ticket tracking." });
  }
});

router.put("/:roomId/tracking", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.roomId)) return res.status(400).json({ message: "Invalid roomId" });
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);
    const accuracy = Number(req.body.accuracy);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: "A valid latitude and longitude are required." });
    }
    const room = await RequestRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: "Request room not found" });
    const uid = String(req.user.userId);
    if (!room.helpBy || ![String(room.createdBy), String(room.helpBy)].includes(uid)) {
      return res.status(403).json({ message: "Only the requester and assigned helper can share location." });
    }
    if (!["Joined", "Coming", "Parchasing"].includes(room.status)) {
      return res.status(409).json({ message: "Live tracking is available while this request is active." });
    }
    const userId = new mongoose.Types.ObjectId(uid);
    room.tracking ||= [];
    const existing = room.tracking.find((entry) => String(entry.user) === uid);
    if (existing) {
      existing.latitude = latitude;
      existing.longitude = longitude;
      existing.accuracy = Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : undefined;
      existing.updatedAt = new Date();
    } else {
      room.tracking.push({ user: userId, latitude, longitude, accuracy: Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : undefined, updatedAt: new Date() });
    }
    await room.save();
    return res.json({ message: "Location shared for this request." });
  } catch (error) {
    console.error("Update tracking error:", error);
    return res.status(500).json({ message: "Could not update ticket tracking." });
  }
});

router.delete("/:roomId/tracking", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.roomId)) return res.status(400).json({ message: "Invalid roomId" });
    const room = await RequestRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: "Request room not found" });
    const uid = String(req.user.userId);
    if (![String(room.createdBy), String(room.helpBy)].includes(uid)) return res.status(403).json({ message: "Only a participant can stop sharing location." });
    room.tracking = (room.tracking || []).filter((entry) => String(entry.user) !== uid);
    await room.save();
    return res.json({ message: "Location sharing stopped." });
  } catch (error) {
    console.error("Stop tracking error:", error);
    return res.status(500).json({ message: "Could not stop ticket tracking." });
  }
});

export default router;
