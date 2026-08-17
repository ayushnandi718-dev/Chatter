import express from "express";
import {
    getConversationPreferences,
    updateConversationPreferences,
    getUserPreferences,
    updateUserPreferences,
} from "../controllers/preferences.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/user", protectRoute, getUserPreferences);
router.put("/user", protectRoute, updateUserPreferences);
router.get("/", protectRoute, getConversationPreferences);
router.put("/:partnerId", protectRoute, updateConversationPreferences);

export default router;
