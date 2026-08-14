// const express = require('express');
import express from "express";
import cors from "cors";
import dotenv from "dotenv/config";
import { connectDB } from "./lib/db.js";
import User from "./models/user.model.js";
import { clerkMiddleware } from "@clerk/express";

const app = express();
const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;

app.use(express.json());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(clerkMiddleware());


app.get("/health", (req, res) => {
    // const {message,image,video} = req.body;
    res.status(200).json({ ok: "Server is healthy" });
});

app.listen(PORT, () => {
    connectDB();
    console.log("Server is running on PORT:", PORT)
});
