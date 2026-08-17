import User from "../models/user.model.js";
import Friendship from "../models/friendship.model.js";
import Block from "../models/block.model.js";
import ReconnectRequest from "../models/reconnectRequest.model.js";

export async function searchUsers(req, res) {
    try {
        const { q } = req.query;
        const currentUserId = req.user._id;

        if (!q || q.trim().length < 1) {
            return res.status(200).json([]);
        }

        const sanitized = q.trim().slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(sanitized, "i");

        const users = await User.find({
            _id: { $ne: currentUserId },
            $or: [{ username: regex }, { displayName: regex }],
        })
            .select("username displayName profilePic about")
            .limit(20);

        const userIds = users.map((u) => u._id);

        const friendships = await Friendship.find({
            $or: [
                { requester: currentUserId, recipient: { $in: userIds } },
                { recipient: currentUserId, requester: { $in: userIds } },
            ],
        });

        const friendshipMap = {};
        for (const f of friendships) {
            const otherId =
                f.requester.toString() === currentUserId.toString()
                    ? f.recipient.toString()
                    : f.requester.toString();
            friendshipMap[otherId] = f.status;
        }

        const results = users.map((u) => ({
            _id: u._id,
            username: u.username,
            displayName: u.displayName || u.username,
            profilePic: u.profilePic,
            about: u.about || "",
            friendshipStatus: friendshipMap[u._id.toString()] || "none",
        }));

        res.status(200).json(results);
    } catch (error) {
        console.error("Error in searchUsers:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function checkUsername(req, res) {
    try {
        const { username } = req.params;

        if (!username || username.length < 3 || username.length > 32) {
            return res.status(400).json({ available: false, message: "Username must be 3-32 characters" });
        }

        if (!/^[a-z0-9._]+$/.test(username)) {
            return res.status(400).json({
                available: false,
                message: "Only lowercase letters, numbers, dots, and underscores allowed",
            });
        }

        const reserved = ["admin", "support", "system", "null", "undefined", "chatter", "help"];
        if (reserved.includes(username)) {
            return res.status(200).json({ available: false });
        }

        const existing = await User.findOne({ username });
        const isSelf = existing && existing._id.toString() === req.user._id.toString();

        res.status(200).json({ available: !existing || isSelf });
    } catch (error) {
        console.error("Error in checkUsername:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function setUsername(req, res) {
    try {
        const { username } = req.body;
        const currentUserId = req.user._id;

        if (!username || username.length < 3 || username.length > 32) {
            return res.status(400).json({ message: "Username must be 3-32 characters" });
        }

        const sanitized = username.toLowerCase().trim();

        if (!/^[a-z0-9._]+$/.test(sanitized)) {
            return res.status(400).json({
                message: "Only lowercase letters, numbers, dots, and underscores allowed",
            });
        }

        const currentUser = await User.findById(currentUserId);
        if (currentUser.username && currentUser.username !== sanitized) {
            return res.status(400).json({ message: "Username already set. Contact support to change." });
        }

        const existing = await User.findOne({ username: sanitized });
        if (existing && existing._id.toString() !== currentUserId.toString()) {
            return res.status(409).json({ message: "Username is already taken" });
        }

        const updated = await User.findByIdAndUpdate(
            currentUserId,
            { username: sanitized },
            { new: true }
        ).select("username displayName profilePic about");

        res.status(200).json(updated);
    } catch (error) {
        console.error("Error in setUsername:", error.message);
        if (error.code === 11000) {
            return res.status(409).json({ message: "Username is already taken" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateDisplayName(req, res) {
    try {
        const { displayName } = req.body;

        if (!displayName || displayName.trim().length < 1 || displayName.trim().length > 50) {
            return res.status(400).json({ message: "Display name must be 1-50 characters" });
        }

        const sanitized = displayName.trim().replace(/[<>]/g, "");

        const updated = await User.findByIdAndUpdate(
            req.user._id,
            { displayName: sanitized },
            { new: true }
        ).select("username displayName profilePic about");

        res.status(200).json(updated);
    } catch (error) {
        console.error("Error in updateDisplayName:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateAbout(req, res) {
    try {
        const { about } = req.body;

        if (about !== undefined && about.length > 120) {
            return res.status(400).json({ message: "About must be 120 characters or less" });
        }

        const updated = await User.findByIdAndUpdate(
            req.user._id,
            { about: about || "" },
            { new: true }
        ).select("username displayName profilePic about");

        res.status(200).json(updated);
    } catch (error) {
        console.error("Error in updateAbout:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getUserProfile(req, res) {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const user = await User.findById(userId).select("username displayName profilePic about createdAt");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const friendship = await Friendship.findOne({
            $or: [
                { requester: currentUserId, recipient: userId },
                { requester: userId, recipient: currentUserId },
            ],
        });

        const iBlockedThem = await Block.findOne({ blocker: currentUserId, blocked: userId });
        const theyBlockedMe = await Block.findOne({ blocker: userId, blocked: currentUserId });

        let reconnectRequest = null;
        if (iBlockedThem) {
            reconnectRequest = await ReconnectRequest.findOne({
                requester: currentUserId,
                recipient: userId,
                status: "pending",
            });
        }

        let blockStatus = "none";
        if (iBlockedThem) blockStatus = "blocked_by_me";
        else if (theyBlockedMe) blockStatus = "blocked_by_them";

        res.status(200).json({
            _id: user._id,
            username: user.username,
            displayName: user.displayName || user.username,
            profilePic: user.profilePic,
            about: user.about || "",
            createdAt: user.createdAt,
            friendshipStatus: friendship?.status || "none",
            friendshipId: friendship?._id || null,
            blockStatus,
            reconnectRequestId: reconnectRequest?._id || null,
        });
    } catch (error) {
        console.error("Error in getUserProfile:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function uploadPublicKey(req, res) {
    try {
        const { publicKey, fingerprint } = req.body;

        if (!publicKey || typeof publicKey !== "string") {
            return res.status(400).json({ message: "Public key (JWK string) is required" });
        }

        let parsed;
        try {
            parsed = JSON.parse(publicKey);
        } catch {
            return res.status(400).json({ message: "Public key must be valid JSON (JWK format)" });
        }

        if (parsed.kty !== "EC" || parsed.crv !== "P-256") {
            return res.status(400).json({ message: "Public key must be ECDH P-256 JWK" });
        }

        const user = await User.findById(req.user._id);
        const previousFingerprint = user.identityKeyFingerprint;

        const keyChanged = user.identityPublicKey && user.identityPublicKey !== publicKey;
        const previousFingerprintValue = keyChanged ? previousFingerprint : null;

        user.identityPublicKey = publicKey;
        user.identityKeyFingerprint = fingerprint || "";
        user.identityKeyVersion = (user.identityKeyVersion || 0) + 1;
        user.identityKeyUpdatedAt = new Date();
        await user.save();

        res.status(200).json({
            ok: true,
            keyVersion: user.identityKeyVersion,
            previousFingerprint: previousFingerprintValue,
            currentFingerprint: user.identityKeyFingerprint,
        });
    } catch (error) {
        console.error("Error in uploadPublicKey:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getPublicKey(req, res) {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select(
            "identityPublicKey identityKeyFingerprint identityKeyVersion identityKeyUpdatedAt username"
        );
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.identityPublicKey) {
            return res.status(404).json({ message: "User has not set up encryption" });
        }

        res.status(200).json({
            publicKey: user.identityPublicKey,
            fingerprint: user.identityKeyFingerprint,
            keyVersion: user.identityKeyVersion,
            keyUpdatedAt: user.identityKeyUpdatedAt,
        });
    } catch (error) {
        console.error("Error in getPublicKey:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}
