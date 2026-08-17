import mongoose from "mongoose";

const conversationPreferencesSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        partnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        muted: { type: Boolean, default: false },
        mutedUntil: { type: Date, default: null },
        pinned: { type: Boolean, default: false },
        archived: { type: Boolean, default: false },
    },
    { timestamps: true }
);

conversationPreferencesSchema.index({ userId: 1, partnerId: 1 }, { unique: true });

const ConversationPreferences = mongoose.model(
    "ConversationPreferences",
    conversationPreferencesSchema
);

export default ConversationPreferences;
