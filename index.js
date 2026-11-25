import express from "express";
import "dotenv/config";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import onlineUsers from "./onlineUsers.js";

import signUp from "./AUTH_HANDLER/signUp.js";
import signIn from "./AUTH_HANDLER/signIn.js";
import room from "./ROOM_HANDLER/createRoom.js";
import roomfetch from "./ROOM_HANDLER/fetchRoomData.js";
import joinRoom from "./ROOM_HANDLER/joinRoom.js";
import myroomfetch from "./ROOM_HANDLER/myRoom.js";
import send_otp from "./otpSystem/sendOtp.js";
import verify_otp from "./otpSystem/verifyOtp.js";
import forget from "./AUTH_HANDLER/forgetPassword.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);

const localNetworkOrigin = /^http:\/\/(?:(?:localhost|127(?:\.\d{1,3}){3})|(?:10(?:\.\d{1,3}){3})|(?:192\.168(?:\.\d{1,3}){2})|(?:172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})):5173$/;
const configuredFrontendOrigins = String(process.env.FRONTEND_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowedFrontendOrigins = new Set([
    "http://localservices.publicvm.com",
    "http://localservices.publicvm.com:5173",
    "https://localservices.publicvm.com",
    "https://www.localservices.publicvm.com",
    ...configuredFrontendOrigins
]);
const allowLocalOrigins = (origin, callback) => {
    if (!origin || localNetworkOrigin.test(origin) || allowedFrontendOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed"));
};

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
    cors: {
        origin: allowLocalOrigins,
        credentials: true
    }
});

app.use(cors({
    origin: allowLocalOrigins,
    credentials: true
}));

app.use(express.json());
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

// Existing routes
app.use("/api/auth/signUp", signUp);
app.use("/api/auth/signIn", signIn);
app.use("/api/room/createRoom", room);
app.use("/api/room/fetch", roomfetch);
app.use("/api/room/joinroom",joinRoom);
app.use("/api/room",joinRoom);
app.use("/api/room/myroomfetch",myroomfetch);
app.use("/api/forget",forget);
app.use("/api/send_otp",send_otp);
app.use("/api/verify_otp",verify_otp);

// Socket.IO connection
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
      socket.on("register", (email) => {
        onlineUsers.set(email.toLowerCase().trim(), socket.id);
        console.log("Online users:", onlineUsers);
    });


    socket.on("disconnect", () => {
         for (const [email, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(email);
                break;
            }
        }
        console.log("Disconnected:", socket.id);
    });
});

// MongoDB connection
try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB is connected Successfully");

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`Backend is listening on 0.0.0.0:${PORT}`);
    });
} catch (err) {
    console.log("Failed to connect to MongoDB:", err);
}
