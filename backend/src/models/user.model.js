import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        clerkId: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
            minlength: 3,
            maxlength: 32,
            match: /^[a-z0-9._]+$/,
        },
        displayName: {
            type: String,
            default: "",
            trim: true,
            maxlength: 50,
        },
        about: {
            type: String,
            default: "",
            trim: true,
            maxlength: 120,
        },
        profilePic: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

userSchema.index({ username: 1 });
userSchema.index({ displayName: "text", username: "text" });

const User = mongoose.model("User", userSchema);

export default User;
