import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeFriend,
    getFriends,
    getRequests,
} from "../controllers/friend.controller.js";

const router = express.Router();

router.get("/", protectRoute, getFriends);
router.get("/requests", protectRoute, getRequests);
router.post("/request/:userId", protectRoute, sendRequest);
router.post("/accept/:requestId", protectRoute, acceptRequest);
router.post("/reject/:requestId", protectRoute, rejectRequest);
router.post("/cancel/:requestId", protectRoute, cancelRequest);
router.delete("/:friendId", protectRoute, removeFriend);

export default router;
