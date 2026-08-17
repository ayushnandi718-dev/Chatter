import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export const useFriendStore = create((set, get) => ({
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
    incomingReconnectRequests: [],
    searchResults: [],
    isFriendsLoading: false,
    isRequestsLoading: false,
    isSearching: false,

    getFriends: async () => {
        set({ isFriendsLoading: true });
        try {
            const res = await axiosInstance.get("/friends");
            set({ friends: res.data });
        } catch (error) {
            console.error("Error fetching friends:", error);
        } finally {
            set({ isFriendsLoading: false });
        }
    },

    getRequests: async () => {
        set({ isRequestsLoading: true });
        try {
            const [requestsRes, reconnectRes] = await Promise.all([
                axiosInstance.get("/friends/requests"),
                axiosInstance.get("/blocks/reconnect/incoming"),
            ]);
            set({
                incomingRequests: requestsRes.data.incoming,
                outgoingRequests: requestsRes.data.outgoing,
                incomingReconnectRequests: reconnectRes.data,
            });
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            set({ isRequestsLoading: false });
        }
    },

    searchUsers: async (query) => {
        if (!query || query.trim().length < 1) {
            set({ searchResults: [] });
            return;
        }
        set({ isSearching: true });
        try {
            const res = await axiosInstance.get(`/users/search?q=${encodeURIComponent(query.trim())}`);
            set({ searchResults: res.data });
        } catch (error) {
            console.error("Error searching users:", error);
            set({ searchResults: [] });
        } finally {
            set({ isSearching: false });
        }
    },

    sendRequest: async (userId) => {
        try {
            await axiosInstance.post(`/friends/request/${userId}`);
            set((state) => ({
                searchResults: state.searchResults.map((u) =>
                    u._id === userId ? { ...u, friendshipStatus: "pending" } : u
                ),
            }));
            get().getRequests();
            toast.success("Friend request sent");
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to send request";
            toast.error(msg);
        }
    },

    acceptRequest: async (requestId) => {
        try {
            await axiosInstance.post(`/friends/accept/${requestId}`);
            set((state) => ({
                incomingRequests: state.incomingRequests.filter((r) => r._id !== requestId),
            }));
            get().getFriends();
            get().getRequests();
            toast.success("Friend request accepted");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to accept");
        }
    },

    rejectRequest: async (requestId) => {
        try {
            await axiosInstance.post(`/friends/reject/${requestId}`);
            set((state) => ({
                incomingRequests: state.incomingRequests.filter((r) => r._id !== requestId),
            }));
            get().getRequests();
            toast.success("Friend request rejected");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reject");
        }
    },

    cancelRequest: async (requestId) => {
        try {
            await axiosInstance.post(`/friends/cancel/${requestId}`);
            set((state) => ({
                outgoingRequests: state.outgoingRequests.filter((r) => r._id !== requestId),
                searchResults: state.searchResults.map((u) =>
                    u.friendshipStatus === "pending" ? { ...u, friendshipStatus: "none" } : u
                ),
            }));
            toast.success("Request cancelled");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to cancel");
        }
    },

    removeFriend: async (friendId) => {
        try {
            await axiosInstance.delete(`/friends/${friendId}`);
            set((state) => ({
                friends: state.friends.filter((f) => f._id !== friendId),
            }));
            toast.success("Friend removed");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to remove friend");
        }
    },

    acceptReconnectRequest: async (requestId) => {
        try {
            await axiosInstance.post(`/blocks/reconnect/accept/${requestId}`);
            set((state) => ({
                incomingReconnectRequests: state.incomingReconnectRequests.filter((r) => r._id !== requestId),
            }));
            get().getFriends();
            get().getRequests();
            toast.success("Reconnect accepted");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to accept reconnect");
        }
    },

    declineReconnectRequest: async (requestId) => {
        try {
            await axiosInstance.post(`/blocks/reconnect/decline/${requestId}`);
            set((state) => ({
                incomingReconnectRequests: state.incomingReconnectRequests.filter((r) => r._id !== requestId),
            }));
            get().getRequests();
            toast.success("Reconnect declined");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to decline reconnect");
        }
    },

    handleFriendRequestEvent: (data) => {
        set((state) => ({
            incomingRequests: [
                ...state.incomingRequests,
                { _id: data.requestId, user: data.from, createdAt: new Date() },
            ],
        }));
        toast(`${data.from.displayName || data.from.username} sent you a friend request`, {
            duration: 5000,
        });
    },

    handleReconnectRequestEvent: (data) => {
        get().getRequests();
        toast("Someone wants to reconnect with you", {
            duration: 5000,
        });
    },

    handleFriendAcceptedEvent: (data) => {
        get().getFriends();
        get().getRequests();
        toast(`${data.by.displayName || data.by.username} accepted your friend request`, {
            duration: 5000,
        });
    },

    handleFriendRemovedEvent: () => {
        get().getFriends();
        toast("A friend has removed you", { duration: 5000 });
    },

    subscribeToFriendEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("friendRequest");
        socket.off("friendAccepted");
        socket.off("friendRemoved");
        socket.off("reconnectRequest");

        socket.on("friendRequest", (data) => {
            get().handleFriendRequestEvent(data);
        });

        socket.on("friendAccepted", (data) => {
            get().handleFriendAcceptedEvent(data);
        });

        socket.on("friendRemoved", () => {
            get().handleFriendRemovedEvent();
        });

        socket.on("reconnectRequest", (data) => {
            get().handleReconnectRequestEvent(data);
        });
    },

    unsubscribeFromFriendEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        socket.off("friendRequest");
        socket.off("friendAccepted");
        socket.off("friendRemoved");
        socket.off("reconnectRequest");
    },
}));
