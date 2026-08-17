import { create } from "zustand";
import { DEFAULT_WALLPAPER, getWallpaperById } from "../lib/wallpapers";

const MAX_CUSTOM = 5;

function loadState() {
    try {
        const raw = localStorage.getItem("chatter-wallpaper-state");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function saveState(state) {
    try {
        localStorage.setItem("chatter-wallpaper-state", JSON.stringify({
            globalId: state.globalId,
            brightness: state.brightness,
            conversationMap: state.conversationMap,
            customWallpapers: state.customWallpapers.map((w) => ({
                id: w.id,
                name: w.name,
                dataUrl: w.dataUrl,
            })),
        }));
    } catch {
        // localStorage full — silently fail
    }
}

const saved = loadState();

export const useWallpaperStore = create((set, get) => ({
    globalId: saved?.globalId || "chatter-default",
    brightness: saved?.brightness ?? 40,
    conversationMap: saved?.conversationMap || {},
    customWallpapers: saved?.customWallpapers || [],

    setGlobalWallpaper: (id) => {
        set({ globalId: id });
        saveState(get());
    },

    setConversationWallpaper: (conversationId, id) => {
        set((state) => ({
            conversationMap: {
                ...state.conversationMap,
                [conversationId]: id,
            },
        }));
        saveState(get());
    },

    resetConversationWallpaper: (conversationId) => {
        set((state) => {
            const next = { ...state.conversationMap };
            delete next[conversationId];
            return { conversationMap: next };
        });
        saveState(get());
    },

    setBrightness: (val) => {
        set({ brightness: val });
        saveState(get());
    },

    addCustomWallpaper: (dataUrl, name) => {
        const id = "custom-" + Date.now();
        const wp = { id, name: name || "Upload " + (get().customWallpapers.length + 1), dataUrl };
        set((state) => {
            const updated = [...state.customWallpapers, wp].slice(-MAX_CUSTOM);
            return { customWallpapers: updated };
        });
        saveState(get());
        return id;
    },

    removeCustomWallpaper: (id) => {
        set((state) => ({
            customWallpapers: state.customWallpapers.filter((w) => w.id !== id),
        }));
        saveState(get());
    },

    getWallpaperForConversation: (conversationId) => {
        const state = get();
        const convId = state.conversationMap[conversationId];
        if (convId) {
            if (convId.startsWith("custom-")) {
                return state.customWallpapers.find((w) => w.id === convId) || DEFAULT_WALLPAPER;
            }
            return getWallpaperById(convId);
        }
        if (state.globalId.startsWith("custom-")) {
            return state.customWallpapers.find((w) => w.id === state.globalId) || DEFAULT_WALLPAPER;
        }
        return getWallpaperById(state.globalId);
    },

    getWallpaperStyle: (conversationId) => {
        const wp = get().getWallpaperForConversation(conversationId);
        const brightness = get().brightness;
        const overlayOpacity = brightness / 100;

        const style = {};
        if (wp.dataUrl) {
            style.backgroundImage = `url(${wp.dataUrl})`;
            style.backgroundSize = "cover";
            style.backgroundPosition = "center";
            style.backgroundRepeat = "no-repeat";
        } else if (wp.value) {
            style.background = wp.value;
        }
        if (wp.patternSize && wp.patternSize !== "auto") {
            style.backgroundSize = wp.patternSize;
        }
        return { wallpaperStyle: style, overlayOpacity };
    },

    hasConversationOverride: (conversationId) => {
        return Boolean(get().conversationMap[conversationId]);
    },
}));
