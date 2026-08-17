import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Friendship from "../models/friendship.model.js";
import Block from "../models/block.model.js";
import { uploadChatMedia } from "../lib/imagekit.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

async function areFriends(userId1, userId2) {
    const friendship = await Friendship.findOne({
        status: "accepted",
        $or: [
            { requester: userId1, recipient: userId2 },
            { requester: userId2, recipient: userId1 },
        ],
    });
    return Boolean(friendship);
}

async function isBlocked(userId1, userId2) {
    const block = await Block.findOne({
        $or: [
            { blocker: userId1, blocked: userId2 },
            { blocker: userId2, blocked: userId1 },
        ],
    });
    return Boolean(block);
}

export async function getConversationsForSidebar(req, res) {
    try {
        const loggedInUserId = req.user._id;

        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [{ $eq: ["$senderId", loggedInUserId] }, "$receiverId", "$senderId"],
                    },
                    lastMessage: { $first: "$$ROOT" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "partner",
                },
            },
            { $unwind: "$partner" },
            {
                $project: {
                    "partner.clerkId": 0,
                    "partner.email": 0,
                    "partner.fullName": 0,
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

        const friends = await areFriends(myId, userToChatId);
        if (!friends) {
            return res.status(403).json({ message: "You must be friends to view messages" });
        }

        const blocked = await isBlocked(myId, userToChatId);
        if (blocked) {
            return res.status(403).json({ message: "Cannot view messages with this user" });
        }

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

        const friends = await areFriends(senderId, receiverId);
        if (!friends) {
            return res.status(403).json({ message: "You must be friends to send messages" });
        }

        const blocked = await isBlocked(senderId, receiverId);
        if (blocked) {
            return res.status(403).json({ message: "Cannot send messages to this user" });
        }

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

export async function markAsRead(req, res) {
    try {
        const { id: userId } = req.params;
        const myId = req.user._id;

        await Message.updateMany(
            { senderId: userId, receiverId: myId, readAt: null },
            { readAt: new Date() }
        );

        const senderSocketId = getReceiverSocketId(userId);
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesRead", { by: myId });
        }

        res.status(200).json({ ok: true });
    } catch (error) {
        console.error("Error in markAsRead:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}
