import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import "dotenv/config";

import { connectDB } from "./lib/db.js";
import { clerkMiddleware } from "@clerk/express";
import job from "./lib/cron.js";
import { app, server } from "./lib/socket.js";

import clerkWebhook from "./webhooks/clerk.webhook.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import friendRoutes from "./routes/friend.route.js";
import blockRoutes from "./routes/block.route.js";
import preferencesRoutes from "./routes/preferences.route.js";

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const isDev = process.env.NODE_ENV !== "production";

const origins = [FRONTEND_URL];
if (isDev) {
    origins.push("http://localhost:5173", "http://localhost:3000", "http://localhost:3001");
}

const publicDir = path.join(process.cwd(), "public");

app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }), clerkWebhook);

app.use(express.json());
app.use(
    cors({
        origin: origins,
        credentials: true,
    })
);
app.use(clerkMiddleware());

app.get("/health", (req, res) => {
    res.status(200).json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/preferences", preferencesRoutes);

if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));

    app.get("/{*any}", (req, res, next) => {
        res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
    });
}

server.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on PORT: ${PORT}`);

    if (process.env.NODE_ENV === "production") job.start();
});
