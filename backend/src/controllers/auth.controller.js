export async function checkAuth(req, res, next) {
    try {
        res.status(200).json({ user: req.auth.userId ? { clerkId: req.auth.userId } : null });
    } catch (error) {
        next(error);
    }
}