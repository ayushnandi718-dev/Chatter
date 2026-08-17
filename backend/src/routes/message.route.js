import express from "express";
import {
    getConversationsForSidebar,
    getMessages,
    sendMessage,
    markAsRead,
    deleteMessage,
    editMessage,
    addReaction,
    pinMessage,
    getPinnedMessages,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.get("/conversations", protectRoute, getConversationsForSidebar);
router.get("/unread-count", protectRoute, async (req, res) => {
    try {
        const Message = (await import("../models/message.model.js")).default;
        const count = await Message.countDocuments({
            receiverId: req.user._id,
            readAt: null,
        });
        res.status(200).json({ count });
    } catch (error) {
        console.error("Error in unread-count:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.get("/pinned/:userId", protectRoute, getPinnedMessages);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, upload.single("file"), sendMessage);
router.post("/read/:id", protectRoute, markAsRead);
router.post("/:id/reaction", protectRoute, addReaction);
router.post("/:id/pin", protectRoute, pinMessage);
router.patch("/:id", protectRoute, editMessage);
router.delete("/:id", protectRoute, deleteMessage);

export default router;
