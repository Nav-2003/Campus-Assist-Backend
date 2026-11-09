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

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
});

app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}));

app.use(express.json());

// Existing routes
app.use("/api/auth/signUp", signUp);
app.use("/api/auth/signIn", signIn);
app.use("/api/room/createRoom", room);
app.use("/api/room/fetch", roomfetch);
app.use("/api/room/joinroom",joinRoom);
app.use("/api/room/myroomfetch",myroomfetch);

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
        }``
        console.log("Disconnected:", socket.id);
    });
});

// MongoDB connection
try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB is connected Successfully");

    server.listen(3000, () => {
        console.log("Backend is on port 3000");
    });
} catch (err) {
    console.log("Failed to connect to MongoDB:", err);
}
