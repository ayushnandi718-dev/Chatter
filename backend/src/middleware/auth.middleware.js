import { getAuth, clerkClient } from "@clerk/express";
import User from "../models/user.model.js";
import { generateUsername } from "../lib/utils.js";

async function generateUniqueUsername(base) {
    let username = base;
    let isTaken = await User.findOne({ username });
    let attempts = 0;
    while (isTaken && attempts < 10) {
        username = base + Math.floor(1000 + Math.random() * 9000).toString();
        isTaken = await User.findOne({ username });
        attempts++;
    }
    return username;
}

export async function protectRoute(req, res, next) {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        let user = await User.findOne({ clerkId: userId });

        if (!user) {
            const clerkUser = await clerkClient.users.getUser(userId);

            const email =
                clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.email_address ??
                clerkUser.emailAddresses?.[0]?.email_address;

            const fullName =
                [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
                clerkUser.username ||
                email?.split("@")[0] ||
                "User";

            const username = await generateUniqueUsername(generateUsername(email) || "user");

            user = await User.create({
                clerkId: userId,
                email: email || "",
                fullName,
                username,
                displayName: fullName,
                profilePic: clerkUser.imageUrl || "",
            });
        } else if (!user.username) {
            const clerkUser = await clerkClient.users.getUser(userId);

            const email =
                clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.email_address ??
                clerkUser.emailAddresses?.[0]?.email_address;

            const username = await generateUniqueUsername(generateUsername(email) || "user");

            user.username = username;
            user.displayName = user.displayName || user.fullName;
            if (!user.profilePic && clerkUser.imageUrl) {
                user.profilePic = clerkUser.imageUrl;
            }
            await user.save();
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Error in protectRoute middleware:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}
