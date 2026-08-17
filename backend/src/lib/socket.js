import express from "express";
import http from "http";
import { Server } from "socket.io";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
const isDev = process.env.NODE_ENV !== "production";

const origins = [allowedOrigin];
if (isDev) {
    origins.push("http://localhost:5173", "http://localhost:3000", "http://localhost:3001");
}

const io = new Server(server, {
    cors: {
        origin: origins,
        credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 10000,
});

const userSocketMap = {};

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

export function emitToUser(userId, event, data) {
    const socketId = userSocketMap[userId];
    if (socketId) {
        io.to(socketId).emit(event, data);
    }
}

io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;
    if (!userId || typeof userId !== "string" || !/^[0-9a-f]{24}$/i.test(userId)) {
        socket.disconnect();
        return;
    }

    const validUser = await User.findById(userId).select("_id").lean();
    if (!validUser) {
        socket.disconnect();
        return;
    }

    userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("typing", ({ to }) => {
        if (!to || typeof to !== "string") return;
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("typing", { from: userId });
        }
    });

    socket.on("stopTyping", ({ to }) => {
        if (!to || typeof to !== "string") return;
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("stopTyping", { from: userId });
        }
    });

    socket.on("reconnectRequest", ({ to }) => {
        if (!to || typeof to !== "string") return;
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("reconnectRequest", { from: userId });
        }
    });

    socket.on("messageDelivered", ({ to, messageId }) => {
        if (!to || typeof to !== "string" || !messageId) return;
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageDelivered", { messageId, by: userId });
        }
    });

    socket.on("disconnect", () => {
        if (userId && userSocketMap[userId] === socket.id) {
            delete userSocketMap[userId];
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { app, io, server };
