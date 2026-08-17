export const WALLPAPERS = [
    {
        id: "sonoma-horizon",
        name: "Sonoma Horizon",
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 70%, #6366f1 100%)",
        preview: "from-indigo-950 via-indigo-900 to-indigo-600",
    },
    {
        id: "cyber-neon",
        name: "Cyber Neon",
        background: "linear-gradient(135deg, #050505 0%, #180828 50%, #2e0854 100%)",
        preview: "from-neutral-950 via-purple-950 to-purple-900",
    },
    {
        id: "aurora-borealis",
        name: "Aurora Borealis",
        background: "linear-gradient(135deg, #022c22 0%, #064e3b 40%, #047857 75%, #10b981 100%)",
        preview: "from-emerald-950 via-emerald-900 to-emerald-500",
    },
    {
        id: "sunset-dusk",
        name: "Sunset Dusk",
        background: "linear-gradient(135deg, #450a0a 0%, #7f1d1d 30%, #b91c1c 65%, #f97316 100%)",
        preview: "from-rose-950 via-red-900 to-orange-500",
    },
    {
        id: "midnight-ocean",
        name: "Midnight Ocean",
        background: "linear-gradient(135deg, #082f49 0%, #0c4a6e 40%, #0369a1 75%, #38bdf8 100%)",
        preview: "from-sky-950 via-sky-900 to-sky-400",
    },
    {
        id: "lavender-dream",
        name: "Lavender Dream",
        background: "linear-gradient(135deg, #2e1065 0%, #581c87 40%, #7e22ce 75%, #c084fc 100%)",
        preview: "from-purple-950 via-purple-900 to-purple-400",
    },
    {
        id: "obsidian-slate",
        name: "Obsidian Slate",
        background: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)",
        preview: "from-slate-950 via-slate-900 to-slate-800",
    },
    {
        id: "candy-bliss",
        name: "Candy Bliss",
        background: "linear-gradient(135deg, #831843 0%, #9d174d 40%, #db2777 75%, #f472b6 100%)",
        preview: "from-pink-950 via-pink-900 to-pink-400",
    },
    {
        id: "golden-hour",
        name: "Golden Hour",
        background: "linear-gradient(135deg, #451a03 0%, #78350f 40%, #b45309 75%, #f59e0b 100%)",
        preview: "from-amber-950 via-amber-900 to-amber-500",
    },
    {
        id: "deep-forest",
        name: "Deep Forest",
        background: "linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 75%, #22c55e 100%)",
        preview: "from-green-950 via-green-900 to-green-500",
    },
    {
        id: "arctic-glacier",
        name: "Arctic Glacier",
        background: "linear-gradient(135deg, #134e4a 0%, #115e59 40%, #0f766e 75%, #14b8a6 100%)",
        preview: "from-teal-950 via-teal-900 to-teal-500",
    },
    {
        id: "crimson-velvet",
        name: "Crimson Velvet",
        background: "linear-gradient(135deg, #500724 0%, #831843 40%, #9f1239 75%, #e11d48 100%)",
        preview: "from-rose-950 via-pink-950 to-rose-600",
    },
    {
        id: "clean-minimal",
        name: "Clean Minimal",
        background: "linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)",
        preview: "from-zinc-900 via-zinc-800 to-zinc-700",
    },
];

export function getWallpaperById(id) {
    return WALLPAPERS.find((w) => w.id === id) || WALLPAPERS[0];
}
