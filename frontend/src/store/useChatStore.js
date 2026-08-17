import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { useSoundStore } from "./useSoundStore";
import toast from "react-hot-toast";

export const useChatStore = create((set, get) => ({
    users: [],
    conversations: [],
    messages: [],
    selectedUser: null,
    isUsersLoading: false,
    isConversationsLoading: false,
    isMessagesLoading: false,
    isSendingMedia: false,
    searchQuery: "",
    sidebarTab: "chats", // "chats" | "contacts"

    setSearchQuery: (query) => set({ searchQuery: query }),
    setSidebarTab: (tab) => set({ sidebarTab: tab }),

    setSelectedUser: (selectedUser) => {
        set({ selectedUser, messages: [] });
        if (selectedUser) {
            get().getMessages(selectedUser._id);
        }
    },

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/users");
            set({ users: res.data });
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getConversations: async () => {
        set({ isConversationsLoading: true });
        try {
            const res = await axiosInstance.get("/messages/conversations");
            set({ conversations: res.data });
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            set({ isConversationsLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            console.error("Error fetching messages:", error);
            toast.error("Failed to load messages");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages, conversations } = get();
        if (!selectedUser) return;

        const isFormData = messageData instanceof FormData;
        if (isFormData) {
            set({ isSendingMedia: true });
        }

        try {
            const res = await axiosInstance.post(
                `/messages/send/${selectedUser._id}`,
                messageData,
                isFormData
                    ? { headers: { "Content-Type": "multipart/form-data" } }
                    : undefined
            );

            const newMsg = res.data;
            set({ messages: [...messages, newMsg] });

            // Play send sound
            useSoundStore.getState().playSendSound();

            // Refresh conversations list or update in-place
            get().getConversations();

            return newMsg;
        } catch (error) {
            console.error("Error sending message:", error);
            const msg = error.response?.data?.message || "Failed to send message";
            toast.error(msg);
            throw error;
        } finally {
            if (isFormData) {
                set({ isSendingMedia: false });
            }
        }
    },

    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        // Remove any prior duplicate handler
        socket.off("newMessage");

        socket.on("newMessage", (newMessage) => {
            const { selectedUser, messages } = get();

            // If message belongs to the currently active conversation, append it
            const isFromActiveChat =
                selectedUser &&
                (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id);

            if (isFromActiveChat) {
                set({ messages: [...messages, newMessage] });
            }

            // Play incoming sound effect
            useSoundStore.getState().playReceiveSound();

            // Refresh conversations sidebar
            get().getConversations();
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        socket.off("newMessage");
    },
}));
