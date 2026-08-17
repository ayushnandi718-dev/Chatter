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

        const friendDocs = await Friendship.find({
            status: "accepted",
            $or: [{ requester: loggedInUserId }, { recipient: loggedInUserId }],
        });

        const friendIds = new Set(
            friendDocs.map((f) =>
                f.requester.toString() === loggedInUserId.toString()
                    ? f.recipient.toString()
                    : f.requester.toString()
            )
        );

        if (friendIds.size === 0) {
            return res.status(200).json([]);
        }

        const allMessages = await Message.find({
            $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
        }).sort({ createdAt: -1 });

        const seen = new Set();
        const conversations = [];

        for (const msg of allMessages) {
            const partnerId =
                msg.senderId.toString() === loggedInUserId.toString()
                    ? msg.receiverId.toString()
                    : msg.senderId.toString();

            if (!friendIds.has(partnerId) || seen.has(partnerId)) continue;

            seen.add(partnerId);

            const partner = await User.findById(partnerId).select("username displayName profilePic");
            if (!partner) continue;

            conversations.push({
                _id: partnerId,
                lastMessage: {
                    _id: msg._id,
                    senderId: msg.senderId,
                    receiverId: msg.receiverId,
                    text: msg.text,
                    encryptedText: msg.encryptedText,
                    iv: msg.iv,
                    sequenceNumber: msg.sequenceNumber,
                    protocolVersion: msg.protocolVersion,
                    clientMessageId: msg.clientMessageId,
                    image: msg.image,
                    video: msg.video,
                    readAt: msg.readAt,
                    createdAt: msg.createdAt,
                },
                partner,
            });
        }

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
        const { text, encryptedText, iv, sequenceNumber, protocolVersion, clientMessageId } = req.body;
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

        const hasEncrypted = encryptedText && iv;
        const hasLegacy = text;
        const hasMedia = imageUrl || videoUrl;

        if (!hasEncrypted && !hasLegacy && !hasMedia) {
            return res.status(400).json({ message: "Message must contain text or a media file" });
        }

        const messageData = {
            senderId,
            receiverId,
            image: imageUrl,
            video: videoUrl,
        };

        if (hasEncrypted) {
            messageData.encryptedText = encryptedText;
            messageData.iv = iv;
            messageData.text = "";
            messageData.sequenceNumber = parseInt(sequenceNumber) || 0;
            messageData.protocolVersion = parseInt(protocolVersion) || 1;
            messageData.clientMessageId = clientMessageId || "";
        } else {
            messageData.text = text || "";
        }

        const newMessage = await Message.create(messageData);

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
