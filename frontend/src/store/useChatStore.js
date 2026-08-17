import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { useSoundStore } from "./useSoundStore";
import toast from "react-hot-toast";

export const useChatStore = create((set, get) => ({
    conversations: [],
    messages: [],
    selectedUser: null,
    isConversationsLoading: false,
    isMessagesLoading: false,
    isSendingMedia: false,
    searchQuery: "",
    typingUsers: [],

    setSearchQuery: (query) => set({ searchQuery: query }),

    setSelectedUser: (selectedUser) => {
        set({ selectedUser, messages: [] });
        if (selectedUser) {
            get().getMessages(selectedUser._id);
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

            await axiosInstance.post(`/messages/read/${userId}`).catch(() => {});
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

            useSoundStore.getState().playSendSound();
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

        socket.off("newMessage");
        socket.off("typing");
        socket.off("stopTyping");
        socket.off("messagesRead");

        socket.on("newMessage", (newMessage) => {
            const { selectedUser, messages } = get();

            const isFromActiveChat =
                selectedUser &&
                (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id);

            if (isFromActiveChat) {
                set({ messages: [...messages, newMessage] });
            }

            useSoundStore.getState().playReceiveSound();
            get().getConversations();
        });

        socket.on("typing", ({ from }) => {
            set((state) => ({
                typingUsers: state.typingUsers.includes(from)
                    ? state.typingUsers
                    : [...state.typingUsers, from],
            }));
        });

        socket.on("stopTyping", ({ from }) => {
            set((state) => ({
                typingUsers: state.typingUsers.filter((id) => id !== from),
            }));
        });

        socket.on("messagesRead", ({ by }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg.senderId === by && !msg.readAt
                        ? { ...msg, readAt: new Date().toISOString() }
                        : msg
                ),
            }));
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        socket.off("newMessage");
        socket.off("typing");
        socket.off("stopTyping");
        socket.off("messagesRead");
    },

    sendTyping: (toUserId) => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
            socket.emit("typing", { to: toUserId });
        }
    },

    sendStopTyping: (toUserId) => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
            socket.emit("stopTyping", { to: toUserId });
        }
    },
}));
