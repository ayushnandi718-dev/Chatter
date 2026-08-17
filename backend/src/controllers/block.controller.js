import Block from "../models/block.model.js";
import ReconnectRequest from "../models/reconnectRequest.model.js";
import Report from "../models/report.model.js";
import Friendship from "../models/friendship.model.js";
import User from "../models/user.model.js";
import { emitToUser } from "../lib/socket.js";

export async function blockUser(req, res) {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        if (userId === currentUserId.toString()) {
            return res.status(400).json({ message: "You cannot block yourself" });
        }

        const target = await User.findById(userId);
        if (!target) {
            return res.status(404).json({ message: "User not found" });
        }

        const existing = await Block.findOne({ blocker: currentUserId, blocked: userId });
        if (existing) {
            return res.status(409).json({ message: "User already blocked" });
        }

        await Block.create({ blocker: currentUserId, blocked: userId });

        await Friendship.findOneAndDelete({
            $or: [
                { requester: currentUserId, recipient: userId },
                { requester: userId, recipient: currentUserId },
            ],
        });

        await ReconnectRequest.findOneAndDelete({
            $or: [
                { requester: currentUserId, recipient: userId },
                { requester: userId, recipient: currentUserId },
            ],
        });

        res.status(200).json({ message: "User blocked" });
    } catch (error) {
        console.error("Error in blockUser:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function unblockUser(req, res) {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        await Block.findOneAndDelete({ blocker: currentUserId, blocked: userId });

        await ReconnectRequest.findOneAndDelete({
            $or: [
                { requester: currentUserId, recipient: userId },
                { requester: userId, recipient: currentUserId },
            ],
        });

        res.status(200).json({ message: "User unblocked" });
    } catch (error) {
        console.error("Error in unblockUser:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getBlockedUsers(req, res) {
    try {
        const currentUserId = req.user._id;

        const blocks = await Block.find({ blocker: currentUserId }).populate(
            "blocked",
            "username displayName profilePic"
        );

        const blockedUserIds = blocks.map((b) => b.blocked._id.toString());

        const reconnectRequests = await ReconnectRequest.find({
            requester: currentUserId,
            recipient: { $in: blockedUserIds },
            status: "pending",
        });

        const pendingMap = {};
        for (const rr of reconnectRequests) {
            pendingMap[rr.recipient.toString()] = rr._id;
        }

        const blocked = blocks.map((b) => ({
            _id: b.blocked._id,
            username: b.blocked.username,
            displayName: b.blocked.displayName || b.blocked.username,
            profilePic: b.blocked.profilePic,
            blockedAt: b.createdAt,
            reconnectRequestId: pendingMap[b.blocked._id.toString()] || null,
            reconnectStatus: pendingMap[b.blocked._id.toString()] ? "pending" : null,
        }));

        res.status(200).json({ blockedUsers: blocked, blockedUserIds });
    } catch (error) {
        console.error("Error in getBlockedUsers:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function sendReconnectRequest(req, res) {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        if (userId === currentUserId.toString()) {
            return res.status(400).json({ message: "Cannot reconnect with yourself" });
        }

        const block = await Block.findOne({ blocker: currentUserId, blocked: userId });
        if (!block) {
            return res.status(400).json({ message: "You have not blocked this user" });
        }

        const theirBlock = await Block.findOne({ blocker: userId, blocked: currentUserId });
        if (theirBlock) {
            return res.status(403).json({ message: "This user has also blocked you" });
        }

        const existing = await ReconnectRequest.findOne({
            requester: currentUserId,
            recipient: userId,
        });
        if (existing) {
            if (existing.status === "pending") {
                return res.status(409).json({ message: "A reconnect request is already pending" });
            }
            existing.status = "pending";
            await existing.save();

            emitToUser(userId, "reconnectRequest", {
                from: { _id: currentUserId },
                requestId: existing._id,
            });

            return res.status(200).json({ requestId: existing._id, status: "pending" });
        }

        const request = await ReconnectRequest.create({
            requester: currentUserId,
            recipient: userId,
            status: "pending",
        });

        emitToUser(userId, "reconnectRequest", {
            from: { _id: currentUserId },
            requestId: request._id,
        });

        res.status(201).json({ requestId: request._id, status: "pending" });
    } catch (error) {
        console.error("Error in sendReconnectRequest:", error.message);
        if (error.code === 11000) {
            return res.status(409).json({ message: "A reconnect request already exists" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function acceptReconnectRequest(req, res) {
    try {
        const { requestId } = req.params;
        const currentUserId = req.user._id;

        const request = await ReconnectRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: "Reconnect request not found" });
        }

        if (request.recipient.toString() !== currentUserId.toString()) {
            return res.status(403).json({ message: "You can only accept requests sent to you" });
        }

        if (request.status !== "pending") {
            return res.status(400).json({ message: "This request has already been processed" });
        }

        request.status = "accepted";
        await request.save();

        await Block.findOneAndDelete({
            blocker: request.requester,
            blocked: currentUserId,
        });

        await Block.findOneAndDelete({
            blocker: currentUserId,
            blocked: request.requester,
        });

        let friendship = await Friendship.findOne({
            $or: [
                { requester: request.requester, recipient: currentUserId },
                { requester: currentUserId, recipient: request.requester },
            ],
        });

        if (friendship) {
            friendship.status = "accepted";
            await friendship.save();
        } else {
            friendship = await Friendship.create({
                requester: request.requester,
                recipient: currentUserId,
                status: "accepted",
            });
        }

        const acceptor = await User.findById(currentUserId).select("username displayName profilePic");

        emitToUser(request.requester.toString(), "reconnectAccepted", {
            by: {
                _id: acceptor._id,
                username: acceptor.username,
                displayName: acceptor.displayName,
                profilePic: acceptor.profilePic,
            },
            friendshipId: friendship._id,
        });

        res.status(200).json({ message: "Reconnect request accepted", friendshipId: friendship._id });
    } catch (error) {
        console.error("Error in acceptReconnectRequest:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function declineReconnectRequest(req, res) {
    try {
        const { requestId } = req.params;
        const currentUserId = req.user._id;

        const request = await ReconnectRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: "Reconnect request not found" });
        }

        if (request.recipient.toString() !== currentUserId.toString()) {
            return res.status(403).json({ message: "You can only decline requests sent to you" });
        }

        if (request.status !== "pending") {
            return res.status(400).json({ message: "This request has already been processed" });
        }

        request.status = "declined";
        await request.save();

        emitToUser(request.requester.toString(), "reconnectDeclined", {
            by: currentUserId,
        });

        res.status(200).json({ message: "Reconnect request declined" });
    } catch (error) {
        console.error("Error in declineReconnectRequest:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function reportUser(req, res) {
    try {
        const { userId } = req.params;
        const { reason, description } = req.body;
        const currentUserId = req.user._id;

        if (userId === currentUserId.toString()) {
            return res.status(400).json({ message: "You cannot report yourself" });
        }

        if (!reason) {
            return res.status(400).json({ message: "A reason is required" });
        }

        const target = await User.findById(userId);
        if (!target) {
            return res.status(404).json({ message: "User not found" });
        }

        const existingReport = await Report.findOne({
            reporter: currentUserId,
            reportedUser: userId,
            status: "pending",
        });

        if (existingReport) {
            return res.status(409).json({ message: "You have already reported this user" });
        }

        await Report.create({
            reporter: currentUserId,
            reportedUser: userId,
            reason,
            description: description || "",
        });

        res.status(201).json({ message: "Report submitted" });
    } catch (error) {
        console.error("Error in reportUser:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function isBlockedBy(userId, targetId) {
    const block = await Block.findOne({
        $or: [
            { blocker: userId, blocked: targetId },
            { blocker: targetId, blocked: userId },
        ],
    });
    return Boolean(block);
}
