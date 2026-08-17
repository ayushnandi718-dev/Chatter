export const DEFAULT_WALLPAPER = {
    id: "chatter-default",
    type: "gradient",
    name: "Chatter Default",
    value: "radial-gradient(ellipse at 20% 50%, rgba(49,46,129,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(67,56,202,0.08) 0%, transparent 40%), #08090f",
};

export const WALLPAPERS = [
    // ── SOLID ──
    {
        id: "midnight",
        type: "solid",
        name: "Midnight",
        value: "#08090f",
        category: "solid",
    },
    {
        id: "graphite",
        type: "solid",
        name: "Graphite",
        value: "#1a1a2e",
        category: "solid",
    },
    {
        id: "slate-dark",
        type: "solid",
        name: "Slate",
        value: "#1e293b",
        category: "solid",
    },
    {
        id: "deep-navy",
        type: "solid",
        name: "Deep Navy",
        value: "#0f172a",
        category: "solid",
    },
    {
        id: "charcoal",
        type: "solid",
        name: "Charcoal",
        value: "#27272a",
        category: "solid",
    },
    {
        id: "obsidian",
        type: "solid",
        name: "Obsidian",
        value: "#09090b",
        category: "solid",
    },

    // ── GRADIENT ──
    {
        id: "midnight-blue",
        type: "gradient",
        name: "Midnight Blue",
        value: "linear-gradient(135deg, #0c1445 0%, #1a1a3e 50%, #0f0f2e 100%)",
        category: "gradient",
    },
    {
        id: "aurora",
        type: "gradient",
        name: "Aurora",
        value: "linear-gradient(160deg, #022c22 0%, #064e3b 40%, #047857 80%, #0d9488 100%)",
        category: "gradient",
    },
    {
        id: "deep-purple",
        type: "gradient",
        name: "Deep Purple",
        value: "linear-gradient(145deg, #1e1065 0%, #3b0f80 50%, #581c87 100%)",
        category: "gradient",
    },
    {
        id: "ocean-deep",
        type: "gradient",
        name: "Ocean",
        value: "linear-gradient(150deg, #082f49 0%, #0c4a6e 45%, #075985 100%)",
        category: "gradient",
    },
    {
        id: "violet-dusk",
        type: "gradient",
        name: "Violet",
        value: "linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #6d28d9 100%)",
        category: "gradient",
    },
    {
        id: "ember-glow",
        type: "gradient",
        name: "Ember",
        value: "linear-gradient(140deg, #1c0a00 0%, #431407 40%, #7c2d12 80%, #9a3412 100%)",
        category: "gradient",
    },
    {
        id: "cyber-pulse",
        type: "gradient",
        name: "Cyber",
        value: "linear-gradient(135deg, #050505 0%, #0a1628 40%, #0f2847 70%, #0ea5e9 100%)",
        category: "gradient",
    },

    // ── PATTERN ──
    {
        id: "grid-dots",
        type: "pattern",
        name: "Dots",
        value: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px), #0d0d12",
        patternSize: "20px 20px",
        category: "pattern",
    },
    {
        id: "grid-lines",
        type: "pattern",
        name: "Grid",
        value: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px), #0d0d12",
        patternSize: "24px 24px",
        category: "pattern",
    },
    {
        id: "crosshatch",
        type: "pattern",
        name: "Crosshatch",
        value: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.015) 8px, rgba(255,255,255,0.015) 9px), #0d0d12",
        patternSize: "auto",
        category: "pattern",
    },
    {
        id: "waves",
        type: "pattern",
        name: "Waves",
        value: "repeating-linear-gradient(0deg, transparent, transparent 12px, rgba(255,255,255,0.02) 12px, rgba(255,255,255,0.02) 13px), #0d0d12",
        patternSize: "auto",
        category: "pattern",
    },
    {
        id: "noise-subtle",
        type: "pattern",
        name: "Noise",
        value: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\"), #0d0d12",
        patternSize: "auto",
        category: "pattern",
    },
    {
        id: "minimal-geo",
        type: "pattern",
        name: "Geometry",
        value: "linear-gradient(30deg, rgba(255,255,255,0.02) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.02) 87.5%), linear-gradient(150deg, rgba(255,255,255,0.02) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.02) 87.5%), linear-gradient(30deg, rgba(255,255,255,0.02) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.02) 87.5%), linear-gradient(150deg, rgba(255,255,255,0.02) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.02) 87.5%), #0d0d12",
        patternSize: "auto",
        category: "pattern",
    },
    {
        id: "orbit",
        type: "pattern",
        name: "Orbit",
        value: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 1px), radial-gradient(circle at 0% 0%, rgba(255,255,255,0.02) 0%, transparent 2px), #0d0d12",
        patternSize: "32px 32px",
        category: "pattern",
    },

    // ── ABSTRACT ──
    {
        id: "nebula",
        type: "gradient",
        name: "Nebula",
        value: "radial-gradient(ellipse at 30% 30%, rgba(88,28,135,0.25) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(30,58,138,0.2) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(15,23,42,0.8) 0%, transparent 80%), #08090f",
        category: "abstract",
    },
    {
        id: "aurora-glow",
        type: "gradient",
        name: "Aurora Glow",
        value: "radial-gradient(ellipse at 20% 80%, rgba(16,185,129,0.12) 0%, transparent 40%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.1) 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, rgba(8,9,15,0.9) 0%, transparent 70%), #08090f",
        category: "abstract",
    },
    {
        id: "liquid-dark",
        type: "gradient",
        name: "Liquid Dark",
        value: "radial-gradient(ellipse at 25% 25%, rgba(99,102,241,0.12) 0%, transparent 45%), radial-gradient(ellipse at 75% 75%, rgba(139,92,246,0.08) 0%, transparent 45%), #0a0a0f",
        category: "abstract",
    },
    {
        id: "soft-blur",
        type: "gradient",
        name: "Soft Blur",
        value: "radial-gradient(ellipse at 40% 40%, rgba(59,130,246,0.1) 0%, transparent 50%), radial-gradient(ellipse at 60% 60%, rgba(168,85,247,0.08) 0%, transparent 50%), #0b0b10",
        category: "abstract",
    },
    {
        id: "cosmic",
        type: "gradient",
        name: "Cosmic",
        value: "radial-gradient(ellipse at 15% 85%, rgba(124,58,237,0.15) 0%, transparent 40%), radial-gradient(ellipse at 85% 15%, rgba(14,165,233,0.12) 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, rgba(8,9,15,0.95) 0%, transparent 70%), #060608",
        category: "abstract",
    },
    {
        id: "glass-waves",
        type: "gradient",
        name: "Glass Waves",
        value: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%), radial-gradient(ellipse at 30% 60%, rgba(100,116,139,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 40%, rgba(71,85,105,0.06) 0%, transparent 50%), #0c0c10",
        category: "abstract",
    },
];

export const CATEGORIES = [
    { id: "solid", name: "Solid" },
    { id: "gradient", name: "Gradients" },
    { id: "pattern", name: "Patterns" },
    { id: "abstract", name: "Abstract" },
];

export function getWallpaperById(id) {
    if (id === "chatter-default" || id === "none") return DEFAULT_WALLPAPER;
    return WALLPAPERS.find((w) => w.id === id) || DEFAULT_WALLPAPER;
}

export function getWallpapersByCategory(category) {
    return WALLPAPERS.filter((w) => w.category === category);
}
