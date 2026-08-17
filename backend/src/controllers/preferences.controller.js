import UserPreferences from "../models/userPreferences.model.js";
import ConversationPreferences from "../models/conversationPreferences.model.js";

export async function getConversationPreferences(req, res) {
    try {
        const prefs = await ConversationPreferences.find({ userId: req.user._id });
        res.status(200).json(prefs);
    } catch (error) {
        console.error("Error in getConversationPreferences:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateConversationPreferences(req, res) {
    try {
        const { partnerId } = req.params;
        const { muted, mutedUntil, pinned, archived } = req.body;

        const update = {};
        if (muted !== undefined) update.muted = muted;
        if (mutedUntil !== undefined) update.mutedUntil = mutedUntil;
        if (pinned !== undefined) update.pinned = pinned;
        if (archived !== undefined) update.archived = archived;

        const prefs = await ConversationPreferences.findOneAndUpdate(
            { userId: req.user._id, partnerId },
            { $set: update },
            { new: true, upsert: true }
        );

        res.status(200).json(prefs);
    } catch (error) {
        console.error("Error in updateConversationPreferences:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function getUserPreferences(req, res) {
    try {
        let prefs = await UserPreferences.findOne({ userId: req.user._id });
        if (!prefs) {
            prefs = await UserPreferences.create({ userId: req.user._id });
        }
        res.status(200).json(prefs);
    } catch (error) {
        console.error("Error in getUserPreferences:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateUserPreferences(req, res) {
    try {
        const { readReceipts, showOnlineStatus, showProfilePhoto, messageSounds, typingSounds } =
            req.body;

        const update = {};
        if (readReceipts !== undefined) update.readReceipts = readReceipts;
        if (showOnlineStatus !== undefined) update.showOnlineStatus = showOnlineStatus;
        if (showProfilePhoto !== undefined) update.showProfilePhoto = showProfilePhoto;
        if (messageSounds !== undefined) update.messageSounds = messageSounds;
        if (typingSounds !== undefined) update.typingSounds = typingSounds;

        const prefs = await UserPreferences.findOneAndUpdate(
            { userId: req.user._id },
            { $set: update },
            { new: true, upsert: true }
        );

        res.status(200).json(prefs);
    } catch (error) {
        console.error("Error in updateUserPreferences:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}
