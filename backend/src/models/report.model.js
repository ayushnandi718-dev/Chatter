import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reportedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reason: {
            type: String,
            enum: ["spam", "harassment", "scam", "impersonation", "illegal", "other"],
            required: true,
        },
        description: {
            type: String,
            default: "",
            maxlength: 500,
        },
        status: {
            type: String,
            enum: ["pending", "reviewed", "resolved"],
            default: "pending",
        },
    },
    { timestamps: true }
);

reportSchema.index({ reportedUser: 1, status: 1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;
