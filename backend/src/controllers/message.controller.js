import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Friendship from "../models/friendship.model.js";
import Block from "../models/block.model.js";
import ConversationPreferences from "../models/conversationPreferences.model.js";
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

        const friendIds = friendDocs.map((f) =>
            f.requester.toString() === loggedInUserId.toString()
                ? f.recipient.toString()
                : f.requester.toString()
        );

        if (friendIds.length === 0) {
            return res.status(200).json([]);
        }

        const allMessages = await Message.find({
            $or: [
                { senderId: loggedInUserId, receiverId: { $in: friendIds } },
                { receiverId: loggedInUserId, senderId: { $in: friendIds } },
            ],
        }).sort({ createdAt: -1 });

        const partners = await User.find({
            _id: { $in: friendIds },
        }).select("username displayName profilePic");

        const partnerMap = {};
        for (const p of partners) {
            partnerMap[p._id.toString()] = p;
        }

        const convPrefsDocs = await ConversationPreferences.find({ userId: loggedInUserId });
        const convPrefsMap = {};
        for (const cp of convPrefsDocs) {
            convPrefsMap[cp.partnerId.toString()] = cp;
        }

        const seen = new Set();
        const conversations = [];

        for (const msg of allMessages) {
            const partnerId =
                msg.senderId.toString() === loggedInUserId.toString()
                    ? msg.receiverId.toString()
                    : msg.senderId.toString();

            if (!friendIds.includes(partnerId) || seen.has(partnerId)) continue;

            seen.add(partnerId);

            const partner = partnerMap[partnerId];
            if (!partner) continue;

            const convPrefs = convPrefsMap[partnerId] || null;

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
                    file: msg.file,
                    audio: msg.audio,
                    fileName: msg.fileName,
                    fileType: msg.fileType,
                    isDeletedForEveryone: msg.isDeletedForEveryone,
                    readAt: msg.readAt,
                    createdAt: msg.createdAt,
                },
                partner,
                conversationPreferences: convPrefs
                    ? {
                          muted: convPrefs.muted,
                          mutedUntil: convPrefs.mutedUntil,
                          pinned: convPrefs.pinned,
                          archived: convPrefs.archived,
                      }
                    : { muted: false, mutedUntil: null, pinned: false, archived: false },
            });
        }

        conversations.sort((a, b) => {
            if (a.conversationPreferences.pinned && !b.conversationPreferences.pinned) return -1;
            if (!a.conversationPreferences.pinned && b.conversationPreferences.pinned) return 1;
            return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });

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

        const messageIds = messages.filter((m) => m.replyTo).map((m) => m.replyTo);
        const replyMessages = messageIds.length > 0
            ? await Message.find({ _id: { $in: messageIds } }).select(
                "_id senderId receiverId text encryptedText iv clientMessageId createdAt isDeletedForEveryone"
              )
            : [];
        const replyMap = {};
        for (const rm of replyMessages) {
            replyMap[rm._id.toString()] = rm;
        }

        const enriched = messages.map((msg) => {
            const obj = msg.toObject();
            if (obj.replyTo && replyMap[obj.replyTo.toString()]) {
                obj.replyToMessage = replyMap[obj.replyTo.toString()];
            }
            return obj;
        });

        res.status(200).json(enriched);
    } catch (error) {
        console.error("Error in getMessages:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function sendMessage(req, res) {
    try {
        const { text, encryptedText, iv, sequenceNumber, protocolVersion, clientMessageId, replyTo } = req.body;
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
        let fileUrl = null;
        let audioUrl = null;
        let fileName = "";
        let fileType = "";
        let fileSize = 0;

        if (req.file) {
            try {
                const uploadedUrl = await uploadChatMedia(req.file);
                const mime = req.file.mimetype;
                fileName = req.file.originalname;
                fileType = mime;
                fileSize = req.file.size;

                if (mime.startsWith("image/")) {
                    imageUrl = uploadedUrl;
                } else if (mime.startsWith("video/")) {
                    videoUrl = uploadedUrl;
                } else if (mime.startsWith("audio/")) {
                    audioUrl = uploadedUrl;
                } else {
                    fileUrl = uploadedUrl;
                }
            } catch (uploadErr) {
                console.error("Media upload failed:", uploadErr.message);
                return res.status(500).json({ message: "Media upload failed: " + (uploadErr.message || "unknown error") });
            }
        }

        const hasEncrypted = encryptedText && iv;
        const hasLegacy = text;
        const hasMedia = imageUrl || videoUrl || audioUrl || fileUrl;

        if (!hasEncrypted && !hasLegacy && !hasMedia) {
            return res.status(400).json({ message: "Message must contain text or a file" });
        }

        const messageData = {
            senderId,
            receiverId,
            image: imageUrl,
            video: videoUrl,
            file: fileUrl,
            audio: audioUrl,
            fileName,
            fileType,
            fileSize,
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

        if (replyTo) {
            const repliedMsg = await Message.findById(replyTo).select("_id senderId receiverId");
            if (repliedMsg) {
                messageData.replyTo = replyTo;
            }
        }

        const newMessage = await Message.create(messageData);

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            const msgObj = newMessage.toObject();
            if (messageData.replyTo && msgObj.replyTo) {
                const repliedFull = await Message.findById(msgObj.replyTo).select(
                    "_id senderId receiverId text encryptedText iv clientMessageId createdAt isDeletedForEveryone"
                );
                if (repliedFull) msgObj.replyToMessage = repliedFull;
            }
            io.to(receiverSocketId).emit("newMessage", msgObj);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error in sendMessage:", error.message);
        console.error("Full error:", error);
        res.status(500).json({ message: "Internal server error: " + (error.message || "") });
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

export async function deleteMessage(req, res) {
    try {
        const { id: messageId } = req.params;
        const { deleteForEveryone } = req.body;
        const myId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (deleteForEveryone) {
            if (message.senderId.toString() !== myId.toString()) {
                return res.status(403).json({ message: "You can only delete your own messages" });
            }

            message.isDeletedForEveryone = true;
            message.deletedAt = new Date();
            message.text = "";
            message.encryptedText = "";
            message.iv = "";
            await message.save();

            const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("messageDeleted", {
                    messageId: message._id,
                    deletedBy: myId,
                });
            }

            return res.status(200).json({ ok: true, messageId: message._id });
        }

        await Message.findByIdAndDelete(messageId);
        res.status(200).json({ ok: true, messageId });
    } catch (error) {
        console.error("Error in deleteMessage:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function editMessage(req, res) {
    try {
        const { id: messageId } = req.params;
        const { text, encryptedText, iv, protocolVersion } = req.body;
        const myId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (message.senderId.toString() !== myId.toString()) {
            return res.status(403).json({ message: "You can only edit your own messages" });
        }

        if (encryptedText && iv) {
            message.encryptedText = encryptedText;
            message.iv = iv;
            message.text = "";
            message.protocolVersion = parseInt(protocolVersion) || message.protocolVersion;
        } else if (text) {
            message.text = text;
        }

        message.editedAt = new Date();
        await message.save();

        const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageEdited", {
                messageId: message._id,
                text: message.text,
                editedAt: message.editedAt,
            });
        }

        res.status(200).json(message);
    } catch (error) {
        console.error("Error in editMessage:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function addReaction(req, res) {
    try {
        const { id: messageId } = req.params;
        const { emoji } = req.body;
        const myId = req.user._id;

        if (!emoji || typeof emoji !== "string") {
            return res.status(400).json({ message: "Emoji is required" });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const existingIdx = message.reactions.findIndex(
            (r) => r.userId.toString() === myId.toString() && r.emoji === emoji
        );

        if (existingIdx >= 0) {
            message.reactions.splice(existingIdx, 1);
        } else {
            const sameEmojiIdx = message.reactions.findIndex(
                (r) => r.userId.toString() === myId.toString()
            );
            if (sameEmojiIdx >= 0) {
                message.reactions.splice(sameEmojiIdx, 1);
            }
            message.reactions.push({ userId: myId, emoji });
        }

        await message.save();

        const receiverId = message.senderId.toString() === myId.toString()
            ? message.receiverId.toString()
            : message.senderId.toString();
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageReaction", {
                messageId: message._id,
                reactions: message.reactions,
            });
        }

        res.status(200).json({ reactions: message.reactions });
    } catch (error) {
        console.error("Error in addReaction:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function pinMessage(req, res) {
    try {
        const { id: messageId } = req.params;
        const myId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const partnerId =
            message.senderId.toString() === myId.toString()
                ? message.receiverId.toString()
                : message.senderId.toString();

        const friends = await areFriends(myId, partnerId);
        if (!friends) {
            return res.status(403).json({ message: "You must be friends to pin messages" });
        }

        message.isPinned = !message.isPinned;
        message.pinnedAt = message.isPinned ? new Date() : null;
        await message.save();

        const receiverSocketId = getReceiverSocketId(partnerId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messagePinned", {
                messageId: message._id,
                isPinned: message.isPinned,
                pinnedAt: message.pinnedAt,
            });
        }

        res.status(200).json({
            isPinned: message.isPinned,
            pinnedAt: message.pinnedAt,
        });
    } catch (error) {
        console.error("Error in pinMessage:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getPinnedMessages(req, res) {
    try {
        const { userId: partnerId } = req.params;
        const myId = req.user._id;

        const friends = await areFriends(myId, partnerId);
        if (!friends) {
            return res.status(403).json({ message: "You must be friends to view pinned messages" });
        }

        const messages = await Message.find({
            isPinned: true,
            $or: [
                { senderId: myId, receiverId: partnerId },
                { senderId: partnerId, receiverId: myId },
            ],
        }).sort({ pinnedAt: -1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getPinnedMessages:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}
