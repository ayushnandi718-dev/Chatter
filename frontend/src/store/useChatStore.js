import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { useSoundStore } from "./useSoundStore";
import { useCryptoStore } from "./useCryptoStore";
import { usePreferencesStore } from "./usePreferencesStore";
import toast from "react-hot-toast";

export const MessageStatus = Object.freeze({
    SENDING: "SENDING",
    SENT: "SENT",
    DELIVERED: "DELIVERED",
    READ: "READ",
    FAILED: "FAILED",
});

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
    pinnedMessageIds: [],

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
        } catch (err) {
            console.error("Error fetching conversations:", err);
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

            const withStatus = decryptedMessages.map((msg) => ({
                ...msg,
                _status: msg.readAt
                    ? MessageStatus.READ
                    : msg.deliveredAt
                    ? MessageStatus.DELIVERED
                    : MessageStatus.SENT,
            }));

            set({ messages: withStatus });

            await axiosInstance.post(`/messages/read/${userId}`).catch(() => {});
        } catch (err) {
            console.error("Error fetching messages:", err);
            toast.error("Failed to load messages");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        if (!selectedUser) return;

        const isFormData = messageData instanceof FormData;
        if (isFormData) {
            set({ isSendingMedia: true });
        }

        let optimisticId = null;
        let tempId = null;

        try {
            let payload;

            if (isFormData) {
                payload = messageData;
                tempId = "temp-" + Date.now();
            } else {
                const cryptoStore = useCryptoStore.getState();
                const authUser = useAuthStore.getState().authUser;

                if (!authUser?._id) {
                    toast.error("Not authenticated");
                    return null;
                }

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

                    if (encrypted?.error) {
                        toast.error(encrypted.error);
                        return null;
                    }

                    if (!encrypted) {
                        toast.error("Encryption failed. Message not sent.");
                        return null;
                    }

                    payload = {
                        encryptedText: encrypted.encryptedText,
                        iv: encrypted.iv,
                        sequenceNumber: encrypted.sequenceNumber,
                        protocolVersion: encrypted.protocolVersion,
                        clientMessageId: encrypted.messageId,
                    };
                } else {
                    payload = messageData;
                }

                tempId = "temp-" + Date.now();
                optimisticId = tempId;

                const optimisticMsg = {
                    _id: tempId,
                    senderId: authUser._id,
                    receiverId: selectedUser._id,
                    text: messageData.text || "",
                    encryptedText: payload.encryptedText || "",
                    iv: payload.iv || "",
                    protocolVersion: payload.protocolVersion || 0,
                    clientMessageId: payload.clientMessageId || "",
                    _status: MessageStatus.SENDING,
                    createdAt: new Date().toISOString(),
                };

                set((state) => ({ messages: [...state.messages, optimisticMsg] }));
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

            newMsg._status = MessageStatus.SENT;

            set((state) => {
                const msgs = state.messages.filter((m) => m._id !== optimisticId);
                const isDuplicate = msgs.some(
                    (m) => m.clientMessageId && m.clientMessageId === newMsg.clientMessageId && m._id !== newMsg._id
                );
                if (isDuplicate) return { messages: msgs };
                return { messages: [...msgs, newMsg] };
            });

            useSoundStore.getState().playSendSound();
            get().getConversations();

            return newMsg;
        } catch (err) {
            console.error("Error sending message:", err);

            if (optimisticId) {
                set((state) => ({
                    messages: state.messages.map((m) =>
                        m._id === optimisticId ? { ...m, _status: MessageStatus.FAILED } : m
                    ),
                }));
            }

            const msg = err.response?.data?.message || "Failed to send message";
            toast.error(msg);
            throw err;
        } finally {
            if (isFormData) {
                set({ isSendingMedia: false });
            }
        }
    },

    retryMessage: async (failedMessage) => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        set((state) => ({
            messages: state.messages.filter((m) => m._id !== failedMessage._id),
        }));

        return get().sendMessage({ text: failedMessage.text });
    },

    deleteMessage: async (messageId, deleteForEveryone = false) => {
        try {
            await axiosInstance.delete(`/messages/${messageId}`, {
                data: { deleteForEveryone },
            });
            set((state) => ({
                messages: state.messages.filter((m) => m._id !== messageId),
            }));
            get().getConversations();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete message");
        }
    },

    requestNotificationPermission: () => {
        if (!("Notification" in window)) return;
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
    },

    showBrowserNotification: (senderName, messageText, profilePic) => {
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted") return;

        const prefStore = usePreferencesStore.getState();
        if (!prefStore.userPrefs.messageSounds) return;

        try {
            new Notification(senderName, {
                body: messageText || "Sent a media file",
                icon: profilePic || "/favicon.svg",
            });
        } catch {
            // notification blocked
        }
    },

    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        get().requestNotificationPermission();

        socket.off("newMessage");
        socket.off("typing");
        socket.off("stopTyping");
        socket.off("messageDelivered");
        socket.off("messagesRead");
        socket.off("messageDeleted");
        socket.off("messageEdited");
        socket.off("messageReaction");

        socket.on("newMessage", async (newMessage) => {
            const { selectedUser } = get();

            const isFromActiveChat =
                selectedUser &&
                (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id);

            if (newMessage.encryptedText && newMessage.iv) {
                const decrypted = await useCryptoStore.getState().decryptIncoming(newMessage);
                newMessage.text = decrypted ?? "\ud83d\udd12 Could not decrypt";
            }

            newMessage._status = MessageStatus.DELIVERED;

            if (newMessage.senderId !== authUser._id) {
                socket.emit("messageDelivered", {
                    to: newMessage.senderId,
                    messageId: newMessage._id,
                });
            }

            set((state) => {
                const clientMsgId = newMessage.clientMessageId;
                if (clientMsgId) {
                    const existingIdx = state.messages.findIndex(
                        (m) => m.clientMessageId === clientMsgId && m._id !== newMessage._id
                    );
                    if (existingIdx >= 0) {
                        const updated = [...state.messages];
                        updated[existingIdx] = newMessage;
                        return { messages: updated };
                    }
                }

                if (!isFromActiveChat) return {};

                const isDuplicate = state.messages.some((m) => m._id === newMessage._id);
                if (isDuplicate) return {};

                return { messages: [...state.messages, newMessage] };
            });

            useSoundStore.getState().playReceiveSound();
            get().getConversations();

            if (!isFromActiveChat) {
                const conversations = get().conversations;
                const conv = conversations.find(
                    (c) => c.partner?._id === newMessage.senderId
                );
                const senderName = conv?.partner?.displayName || conv?.partner?.username || "New Message";
                const profilePic = conv?.partner?.profilePic;
                get().showBrowserNotification(senderName, newMessage.text, profilePic);
            }
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

        socket.on("messageDelivered", ({ messageId, by }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId && msg.senderId === by && msg._status === MessageStatus.SENT
                        ? { ...msg, _status: MessageStatus.DELIVERED, deliveredAt: new Date().toISOString() }
                        : msg
                ),
            }));
        });

        socket.on("messagesRead", ({ by }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg.senderId === by && !msg.readAt
                        ? { ...msg, readAt: new Date().toISOString(), _status: MessageStatus.READ }
                        : msg
                ),
            }));
        });

        socket.on("messageDeleted", ({ messageId, deletedBy }) => {
            set((state) => ({
                messages: state.messages.map((m) =>
                    m._id === messageId
                        ? { ...m, isDeletedForEveryone: true, text: "", encryptedText: "", iv: "" }
                        : m
                ),
            }));
            get().getConversations();
        });

        socket.on("messageEdited", async ({ messageId, text, encryptedText, iv, protocolVersion, editedAt }) => {
            let decryptedText = text;

            if (encryptedText && iv) {
                const msg = get().messages.find((m) => m._id === messageId);
                if (msg) {
                    const decrypted = await useCryptoStore.getState().decryptIncoming({
                        ...msg,
                        encryptedText,
                        iv,
                        protocolVersion,
                    });
                    decryptedText = decrypted ?? "\ud83d\udd12 Could not decrypt";
                }
            }

            set((state) => ({
                messages: state.messages.map((m) =>
                    m._id === messageId ? { ...m, text: decryptedText, editedAt } : m
                ),
            }));
        });

        socket.on("messageReaction", ({ messageId, reactions }) => {
            set((state) => ({
                messages: state.messages.map((m) =>
                    m._id === messageId ? { ...m, reactions } : m
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
        socket.off("messageDelivered");
        socket.off("messagesRead");
        socket.off("messageDeleted");
        socket.off("messageEdited");
        socket.off("messageReaction");
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

    blockedUserIds: [],
    blockedUsers: [],

    fetchBlockedUsers: async () => {
        try {
            const res = await axiosInstance.get("/blocks");
            set({
                blockedUserIds: res.data.blockedUserIds || [],
                blockedUsers: res.data.blockedUsers || [],
            });
        } catch {
            // silent
        }
    },

    blockUser: async (userId) => {
        try {
            await axiosInstance.post(`/blocks/${userId}`);
            set((state) => ({
                blockedUserIds: [...state.blockedUserIds, userId],
                selectedUser: state.selectedUser?._id === userId ? null : state.selectedUser,
            }));
            toast.success("User blocked");
            get().getConversations();
            get().fetchBlockedUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to block user");
        }
    },

    unblockUser: async (userId) => {
        try {
            await axiosInstance.delete(`/blocks/${userId}`);
            set((state) => ({
                blockedUserIds: state.blockedUserIds.filter((id) => id !== userId),
                blockedUsers: state.blockedUsers.filter((u) => u._id !== userId),
            }));
            toast.success("User unblocked");
            get().getConversations();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to unblock user");
        }
    },

    sendReconnectRequest: async (userId) => {
        try {
            await axiosInstance.post(`/blocks/reconnect/${userId}`);
            set((state) => ({
                blockedUsers: state.blockedUsers.map((u) =>
                    u._id === userId ? { ...u, reconnectStatus: "pending" } : u
                ),
            }));
            toast.success("Reconnect request sent");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send reconnect request");
        }
    },

    handleReconnectAccepted: () => {
        get().fetchBlockedUsers();
        get().getConversations();
        toast("Reconnect request accepted", { duration: 5000 });
    },

    handleReconnectDeclined: () => {
        get().fetchBlockedUsers();
        toast("Reconnect request declined", { duration: 5000 });
    },

    subscribeToReconnectEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("reconnectAccepted");
        socket.off("reconnectDeclined");

        socket.on("reconnectAccepted", () => {
            get().handleReconnectAccepted();
        });

        socket.on("reconnectDeclined", () => {
            get().handleReconnectDeclined();
        });
    },

    unsubscribeFromReconnectEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        socket.off("reconnectAccepted");
        socket.off("reconnectDeclined");
    },

    reportUser: async (userId, reason, description) => {
        try {
            await axiosInstance.post(`/blocks/report/${userId}`, { reason, description });
            toast.success("Report submitted");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit report");
        }
    },
}));
