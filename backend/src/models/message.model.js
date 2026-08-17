import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            default: "",
        },
        encryptedText: {
            type: String,
            default: "",
        },
        iv: {
            type: String,
            default: "",
        },
        sequenceNumber: {
            type: Number,
            default: 0,
        },
        protocolVersion: {
            type: Number,
            default: 0,
        },
        image: {
            type: String,
            default: null,
        },
        video: {
            type: String,
            default: null,
        },
        readAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
messageSchema.index({ receiverId: 1, senderId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
