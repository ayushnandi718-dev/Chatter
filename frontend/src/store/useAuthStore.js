import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === "development" ? "http://localhost:3000" : "/");

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        set({ isCheckingAuth: true });
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data });
            get().connectSocket(res.data);

            const { useCryptoStore } = await import("./useCryptoStore");
            useCryptoStore.getState().ensureIdentityKey(res.data);
        } catch (error) {
            console.error("Auth check failed:", error.response?.data?.message || error.message);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    setAuthUser: (user) => {
        set({ authUser: user });
        if (user) {
            get().connectSocket(user);
        } else {
            get().disconnectSocket();
        }
    },

    connectSocket: (user) => {
        const currentUser = user || get().authUser;
        if (!currentUser || get().socket?.connected) return;

        const socket = io(SOCKET_URL, {
            query: { userId: currentUser._id },
            withCredentials: true,
        });

        socket.connect();
        set({ socket });

        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds });
        });
    },

    disconnectSocket: () => {
        if (get().socket?.connected) {
            get().socket.disconnect();
        }
        set({ socket: null, onlineUsers: [] });
    },
}));
