import "dotenv/config";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";

const sampleUsers = [
    {
        clerkId: "seed_user_sarah_101",
        email: "sarah.connor@example.com",
        fullName: "Sarah Connor",
        profilePic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
    {
        clerkId: "seed_user_alex_102",
        email: "alex.mercer@example.com",
        fullName: "Alex Mercer",
        profilePic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    {
        clerkId: "seed_user_elena_103",
        email: "elena.rostova@example.com",
        fullName: "Elena Rostova",
        profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    {
        clerkId: "seed_user_marcus_104",
        email: "marcus.vance@example.com",
        fullName: "Marcus Vance",
        profilePic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
];

async function seedDatabase() {
    try {
        await connectDB();

        for (const u of sampleUsers) {
            await User.findOneAndUpdate(
                { clerkId: u.clerkId },
                u,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        console.log("Successfully seeded sample users into MongoDB!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding users:", error.message);
        process.exit(1);
    }
}

seedDatabase();
