import mongoose from "mongoose";

const reconnectRequestSchema = new mongoose.Schema(
    {
        requester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "declined"],
            default: "pending",
        },
    },
    { timestamps: true }
);

reconnectRequestSchema.index({ requester: 1, recipient: 1 }, { unique: true });
reconnectRequestSchema.index({ recipient: 1, status: 1 });

const ReconnectRequest = mongoose.model("ReconnectRequest", reconnectRequestSchema);

export default ReconnectRequest;
