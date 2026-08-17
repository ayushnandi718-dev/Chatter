import User from "../models/user.model.js";
import Friendship from "../models/friendship.model.js";
import Block from "../models/block.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export async function sendRequest(req, res) {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        if (userId === currentUserId.toString()) {
            return res.status(400).json({ message: "You cannot send a friend request to yourself" });
        }

        const isBlocked = await Block.findOne({
            $or: [
                { blocker: currentUserId, blocked: userId },
                { blocker: userId, blocked: currentUserId },
            ],
        });
        if (isBlocked) {
            return res.status(403).json({ message: "Cannot send friend request" });
        }

        const targetUser = await User.findById(userId).select("username displayName profilePic");
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const existing = await Friendship.findOne({
            $or: [
                { requester: currentUserId, recipient: userId },
                { requester: userId, recipient: currentUserId },
            ],
        });

        if (existing) {
            if (existing.status === "accepted") {
                return res.status(409).json({ message: "You are already friends" });
            }
            if (existing.status === "pending") {
                return res.status(409).json({ message: "A friend request already exists" });
            }
            if (existing.status === "rejected") {
                existing.status = "pending";
                existing.requester = currentUserId;
                existing.recipient = userId;
                await existing.save();

                const sender = await User.findById(currentUserId).select("username displayName profilePic");

                const receiverSocketId = getReceiverSocketId(userId.toString());
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("friendRequest", {
                        from: { _id: sender._id, username: sender.username, displayName: sender.displayName, profilePic: sender.profilePic },
                        requestId: existing._id,
                    });
                }

                return res.status(201).json(existing);
            }
        }

        const friendship = await Friendship.create({
            requester: currentUserId,
            recipient: userId,
            status: "pending",
        });

        const sender = await User.findById(currentUserId).select("username displayName profilePic");

        const receiverSocketId = getReceiverSocketId(userId.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("friendRequest", {
                from: { _id: sender._id, username: sender.username, displayName: sender.displayName, profilePic: sender.profilePic },
                requestId: friendship._id,
            });
        }

        res.status(201).json(friendship);
    } catch (error) {
        console.error("Error in sendRequest:", error.message);
        if (error.code === 11000) {
            return res.status(409).json({ message: "A friend request already exists" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function acceptRequest(req, res) {
    try {
        const { requestId } = req.params;
        const currentUserId = req.user._id;

        const friendship = await Friendship.findById(requestId);
        if (!friendship) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        if (friendship.recipient.toString() !== currentUserId.toString()) {
            return res.status(403).json({ message: "You can only accept requests sent to you" });
        }

        if (friendship.status !== "pending") {
            return res.status(400).json({ message: "This request has already been processed" });
        }

        friendship.status = "accepted";
        await friendship.save();

        const acceptor = await User.findById(currentUserId).select("username displayName profilePic");

        const requesterSocketId = getReceiverSocketId(friendship.requester.toString());
        if (requesterSocketId) {
            io.to(requesterSocketId).emit("friendAccepted", {
                by: { _id: acceptor._id, username: acceptor.username, displayName: acceptor.displayName, profilePic: acceptor.profilePic },
            });
        }

        res.status(200).json(friendship);
    } catch (error) {
        console.error("Error in acceptRequest:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function rejectRequest(req, res) {
    try {
        const { requestId } = req.params;
        const currentUserId = req.user._id;

        const friendship = await Friendship.findById(requestId);
        if (!friendship) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        if (friendship.recipient.toString() !== currentUserId.toString()) {
            return res.status(403).json({ message: "You can only reject requests sent to you" });
        }

        if (friendship.status !== "pending") {
            return res.status(400).json({ message: "This request has already been processed" });
        }

        friendship.status = "rejected";
        await friendship.save();

        res.status(200).json(friendship);
    } catch (error) {
        console.error("Error in rejectRequest:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function cancelRequest(req, res) {
    try {
        const { requestId } = req.params;
        const currentUserId = req.user._id;

        const friendship = await Friendship.findById(requestId);
        if (!friendship) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        if (friendship.requester.toString() !== currentUserId.toString()) {
            return res.status(403).json({ message: "You can only cancel your own requests" });
        }

        if (friendship.status !== "pending") {
            return res.status(400).json({ message: "This request has already been processed" });
        }

        await Friendship.findByIdAndDelete(requestId);

        res.status(200).json({ message: "Request cancelled" });
    } catch (error) {
        console.error("Error in cancelRequest:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function removeFriend(req, res) {
    try {
        const { friendId } = req.params;
        const currentUserId = req.user._id;

        const friendship = await Friendship.findOneAndDelete({
            status: "accepted",
            $or: [
                { requester: currentUserId, recipient: friendId },
                { requester: friendId, recipient: currentUserId },
            ],
        });

        if (!friendship) {
            return res.status(404).json({ message: "Friendship not found" });
        }

        const removedUserId =
            friendship.requester.toString() === currentUserId.toString()
                ? friendship.recipient.toString()
                : friendship.requester.toString();

        const removedSocketId = getReceiverSocketId(removedUserId);
        if (removedSocketId) {
            io.to(removedSocketId).emit("friendRemoved", { by: currentUserId });
        }

        res.status(200).json({ message: "Friend removed" });
    } catch (error) {
        console.error("Error in removeFriend:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getFriends(req, res) {
    try {
        const currentUserId = req.user._id;

        const friendships = await Friendship.find({
            status: "accepted",
            $or: [{ requester: currentUserId }, { recipient: currentUserId }],
        }).populate("requester recipient", "username displayName profilePic about");

        const friends = friendships.map((f) => {
            const friend =
                f.requester._id.toString() === currentUserId.toString() ? f.recipient : f.requester;
            return {
                _id: friend._id,
                username: friend.username,
                displayName: friend.displayName || friend.username,
                profilePic: friend.profilePic,
                about: friend.about || "",
            };
        });

        res.status(200).json(friends);
    } catch (error) {
        console.error("Error in getFriends:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getRequests(req, res) {
    try {
        const currentUserId = req.user._id;

        const incoming = await Friendship.find({
            recipient: currentUserId,
            status: "pending",
        }).populate("requester", "username displayName profilePic");

        const outgoing = await Friendship.find({
            requester: currentUserId,
            status: "pending",
        }).populate("recipient", "username displayName profilePic");

        const formattedIncoming = incoming.map((f) => ({
            _id: f._id,
            user: {
                _id: f.requester._id,
                username: f.requester.username,
                displayName: f.requester.displayName || f.requester.username,
                profilePic: f.requester.profilePic,
            },
            createdAt: f.createdAt,
        }));

        const formattedOutgoing = outgoing.map((f) => ({
            _id: f._id,
            user: {
                _id: f.recipient._id,
                username: f.recipient.username,
                displayName: f.recipient.displayName || f.recipient.username,
                profilePic: f.recipient.profilePic,
            },
            createdAt: f.createdAt,
        }));

        res.status(200).json({
            incoming: formattedIncoming,
            outgoing: formattedOutgoing,
        });
    } catch (error) {
        console.error("Error in getRequests:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}
