import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const usePreferencesStore = create((set, get) => ({
    conversationPrefs: {},
    userPrefs: {
        readReceipts: true,
        showOnlineStatus: true,
        showProfilePhoto: true,
        messageSounds: true,
        typingSounds: true,
    },

    fetchConversationPreferences: async () => {
        try {
            const res = await axiosInstance.get("/preferences");
            set({ conversationPrefs: res.data });
        } catch (err) {
            console.error("Error fetching conversation preferences:", err);
        }
    },

    updateConversationPreferences: async (partnerId, updates) => {
        try {
            const res = await axiosInstance.put(`/preferences/${partnerId}`, updates);
            set((state) => ({
                conversationPrefs: {
                    ...state.conversationPrefs,
                    [partnerId]: res.data,
                },
            }));
            return res.data;
        } catch (err) {
            console.error("Error updating conversation preferences:", err);
            throw err;
        }
    },

    fetchUserPreferences: async () => {
        try {
            const res = await axiosInstance.get("/preferences/user");
            set({ userPrefs: res.data });
        } catch (err) {
            console.error("Error fetching user preferences:", err);
        }
    },

    updateUserPreferences: async (updates) => {
        try {
            const res = await axiosInstance.put("/preferences/user", updates);
            set({ userPrefs: res.data });
            return res.data;
        } catch (err) {
            console.error("Error updating user preferences:", err);
            throw err;
        }
    },

    isMuted: (partnerId) => {
        const prefs = get().conversationPrefs[partnerId];
        if (!prefs?.muted) return false;
        if (prefs.mutedUntil && new Date(prefs.mutedUntil) < new Date()) {
            return false;
        }
        return true;
    },

    isPinned: (partnerId) => {
        return !!get().conversationPrefs[partnerId]?.pinned;
    },

    isArchived: (partnerId) => {
        return !!get().conversationPrefs[partnerId]?.archived;
    },
}));
