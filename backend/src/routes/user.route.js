import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    searchUsers,
    checkUsername,
    setUsername,
    updateDisplayName,
    updateAbout,
    getUserProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers);
router.get("/username/:username", protectRoute, checkUsername);
router.get("/profile/:userId", protectRoute, getUserProfile);
router.put("/username", protectRoute, setUsername);
router.put("/display-name", protectRoute, updateDisplayName);
router.put("/about", protectRoute, updateAbout);

export default router;
