import { toPublicUser } from "../lib/utils.js";

export async function checkAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    res.status(200).json(toPublicUser(req.user));
}
