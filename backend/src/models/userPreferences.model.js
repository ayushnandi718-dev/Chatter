import mongoose from "mongoose";

const userPreferencesSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            unique: true,
            required: true,
        },
        readReceipts: { type: Boolean, default: true },
        showOnlineStatus: { type: Boolean, default: true },
        showProfilePhoto: { type: Boolean, default: true },
        messageSounds: { type: Boolean, default: true },
        typingSounds: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const UserPreferences = mongoose.model("UserPreferences", userPreferencesSchema);

export default UserPreferences;
