import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    blockUser,
    unblockUser,
    getBlockedUsers,
    getIncomingReconnectRequests,
    sendReconnectRequest,
    acceptReconnectRequest,
    declineReconnectRequest,
    reportUser,
} from "../controllers/block.controller.js";

const router = express.Router();

router.get("/", protectRoute, getBlockedUsers);
router.get("/reconnect/incoming", protectRoute, getIncomingReconnectRequests);
router.post("/:userId", protectRoute, blockUser);
router.delete("/:userId", protectRoute, unblockUser);
router.post("/reconnect/:userId", protectRoute, sendReconnectRequest);
router.post("/reconnect/accept/:requestId", protectRoute, acceptReconnectRequest);
router.post("/reconnect/decline/:requestId", protectRoute, declineReconnectRequest);
router.post("/report/:userId", protectRoute, reportUser);

export default router;
