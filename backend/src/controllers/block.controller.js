import Block from "../models/block.model.js";
import Report from "../models/report.model.js";
import Friendship from "../models/friendship.model.js";
import User from "../models/user.model.js";

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

        const blocked = blocks.map((b) => ({
            _id: b.blocked._id,
            username: b.blocked.username,
            displayName: b.blocked.displayName || b.blocked.username,
            profilePic: b.blocked.profilePic,
            blockedAt: b.createdAt,
        }));

        res.status(200).json(blocked);
    } catch (error) {
        console.error("Error in getBlockedUsers:", error.message);
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
