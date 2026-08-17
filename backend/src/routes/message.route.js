import express from "express";
import {
    getConversationsForSidebar,
    getMessages,
    sendMessage,
    markAsRead,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.get("/conversations", protectRoute, getConversationsForSidebar);
router.get("/unread-count", protectRoute, async (req, res) => {
    const Message = (await import("../models/message.model.js")).default;
    const count = await Message.countDocuments({
        receiverId: req.user._id,
        readAt: null,
    });
    res.status(200).json({ count });
});
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, upload.single("file"), sendMessage);
router.post("/read/:id", protectRoute, markAsRead);

export default router;
