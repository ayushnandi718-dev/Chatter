import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        emoji: {
            type: String,
            required: true,
        },
    },
    { _id: false, timestamps: false }
);

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
        clientMessageId: {
            type: String,
            default: "",
        },
        image: {
            type: String,
            default: null,
        },
        video: {
            type: String,
            default: null,
        },
        file: {
            type: String,
            default: null,
        },
        fileName: {
            type: String,
            default: "",
        },
        fileType: {
            type: String,
            default: "",
        },
        fileSize: {
            type: Number,
            default: 0,
        },
        audio: {
            type: String,
            default: null,
        },
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
        reactions: [reactionSchema],
        editedAt: {
            type: Date,
            default: null,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        isDeletedForEveryone: {
            type: Boolean,
            default: false,
        },
        deliveredAt: {
            type: Date,
            default: null,
        },
        readAt: {
            type: Date,
            default: null,
        },
        isPinned: {
            type: Boolean,
            default: false,
        },
        pinnedAt: {
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
