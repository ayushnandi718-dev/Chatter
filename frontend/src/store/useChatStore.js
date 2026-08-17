import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { useSoundStore } from "./useSoundStore";
import { useCryptoStore } from "./useCryptoStore";
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
    decryptedPreviews: {},

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
            const conversations = res.data;

            set({ conversations });

            const cryptoStore = useCryptoStore.getState();

            for (const conv of conversations) {
                const lastMsg = conv.lastMessage;
                if (lastMsg?.encryptedText && lastMsg?.iv && !get().decryptedPreviews[conv._id]) {
                    cryptoStore.decryptIncoming({
                        ...lastMsg,
                        senderId: lastMsg.senderId,
                        receiverId: lastMsg.receiverId,
                    }).then((plaintext) => {
                        if (plaintext) {
                            set((state) => ({
                                decryptedPreviews: {
                                    ...state.decryptedPreviews,
                                    [conv._id]: plaintext,
                                },
                            }));
                        }
                    }).catch(() => {});
                }
            }
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
            const rawMessages = res.data;

            const cryptoStore = useCryptoStore.getState();

            const decryptedMessages = await cryptoStore.decryptMessages(rawMessages);

            set({ messages: decryptedMessages });

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
            let payload;

            if (isFormData) {
                payload = messageData;
            } else {
                const cryptoStore = useCryptoStore.getState();
                const authUser = useAuthStore.getState().authUser;

                const conversationId = [authUser._id, selectedUser._id].sort().join("-");
                const seqNum = messages.filter(
                    (m) => m.senderId === authUser._id && m.protocolVersion > 0
                ).length + 1;

                if (messageData.text) {
                    const encrypted = await cryptoStore.encryptOutgoing(
                        messageData.text,
                        selectedUser._id,
                        conversationId,
                        seqNum
                    );

                    if (encrypted) {
                        payload = {
                            encryptedText: encrypted.encryptedText,
                            iv: encrypted.iv,
                            sequenceNumber: encrypted.sequenceNumber,
                            protocolVersion: encrypted.protocolVersion,
                        };
                    } else {
                        toast.error("Encryption failed. Message not sent.");
                        return null;
                    }
                } else {
                    payload = messageData;
                }
            }

            const res = await axiosInstance.post(
                `/messages/send/${selectedUser._id}`,
                payload,
                isFormData
                    ? { headers: { "Content-Type": "multipart/form-data" } }
                    : undefined
            );

            const newMsg = res.data;

            if (newMsg.encryptedText && newMsg.iv) {
                const decrypted = await useCryptoStore.getState().decryptIncoming(newMsg);
                newMsg.text = decrypted ?? "🔒 Could not decrypt";
            }

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

        socket.on("newMessage", async (newMessage) => {
            const { selectedUser, messages } = get();

            const isFromActiveChat =
                selectedUser &&
                (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id);

            if (newMessage.encryptedText && newMessage.iv) {
                const { useCryptoStore } = await import("./useCryptoStore");
                const decrypted = await useCryptoStore.getState().decryptIncoming(newMessage);
                newMessage.text = decrypted ?? "🔒 Could not decrypt";
            }

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
