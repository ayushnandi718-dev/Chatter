import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { uploadChatMedia } from "../lib/imagekit.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export async function getUsersForSidebar(req, res) {
    try {
        const loggedInUserId = req.user._id;

        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-clerkId");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error in getUsersForSidebar:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getConversationsForSidebar(req, res) {
    try {
        const loggedInUserId = req.user._id;

        const conversations = await Message.aggregate([
            // 1. Keep only messages sent or received by the logged in user
            {
                $match: {
                    $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
                },
            },
            // 2. Sort latest messages first
            {
                $sort: { createdAt: -1 },
            },
            // 3. Group by partner
            {
                $group: {
                    _id: {
                        $cond: [{ $eq: ["$senderId", loggedInUserId] }, "$receiverId", "$senderId"],
                    },
                    lastMessage: { $first: "$$ROOT" },
                },
            },
            // 4. Lookup partner profile details
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "partner",
                },
            },
            {
                $unwind: "$partner",
            },
            {
                $project: {
                    "partner.clerkId": 0,
                },
            },
        ]);

        res.status(200).json(conversations);
    } catch (error) {
        console.error("Error in getConversationsForSidebar:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getMessages(req, res) {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getMessages:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function sendMessage(req, res) {
    try {
        const { text } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl = null;
        let videoUrl = null;

        if (req.file) {
            const uploadedUrl = await uploadChatMedia(req.file);
            if (req.file.mimetype.startsWith("image/")) {
                imageUrl = uploadedUrl;
            } else if (req.file.mimetype.startsWith("video/")) {
                videoUrl = uploadedUrl;
            }
        }

        if (!text && !imageUrl && !videoUrl) {
            return res.status(400).json({ message: "Message must contain text or a media file" });
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text: text || "",
            image: imageUrl,
            video: videoUrl,
        });

        // Broadcast to receiver in real-time via Socket.io if online
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error in sendMessage:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}