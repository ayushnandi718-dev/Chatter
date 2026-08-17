/**
 * Strip private fields from a user document for public API responses.
 * Never expose: email, clerkId, fullName.
 */
export function toPublicUser(user) {
    if (!user) return null;

    const obj = user.toObject ? user.toObject() : user;

    return {
        _id: obj._id,
        username: obj.username,
        displayName: obj.displayName || obj.fullName?.split(" ")[0] || obj.username,
        profilePic: obj.profilePic,
        about: obj.about || "",
        createdAt: obj.createdAt,
    };
}

/**
 * Generate a unique username from an email prefix.
 * Sanitizes, then appends random suffix if taken.
 */
export function generateUsername(email) {
    if (!email) return null;

    let base = email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9._]/g, "")
        .replace(/^\.+|\.+$/g, "");

    if (base.length < 3) {
        base = base + "user";
    }

    if (base.length > 28) {
        base = base.slice(0, 28);
    }

    return base;
}
