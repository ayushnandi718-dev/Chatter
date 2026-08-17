import { useEffect } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { UserButton } from "@clerk/react";
import { Search, MessageSquare, Users, Loader2 } from "lucide-react";

export function ChatSidebar() {
    const users = useChatStore((state) => state.users);
    const conversations = useChatStore((state) => state.conversations);
    const selectedUser = useChatStore((state) => state.selectedUser);
    const setSelectedUser = useChatStore((state) => state.setSelectedUser);
    const getUsers = useChatStore((state) => state.getUsers);
    const getConversations = useChatStore((state) => state.getConversations);
    const isUsersLoading = useChatStore((state) => state.isUsersLoading);
    const isConversationsLoading = useChatStore((state) => state.isConversationsLoading);
    const searchQuery = useChatStore((state) => state.searchQuery);
    const setSearchQuery = useChatStore((state) => state.setSearchQuery);
    const sidebarTab = useChatStore((state) => state.sidebarTab);
    const setSidebarTab = useChatStore((state) => state.setSidebarTab);

    const authUser = useAuthStore((state) => state.authUser);
    const onlineUsers = useAuthStore((state) => state.onlineUsers);

    useEffect(() => {
        getUsers();
        getConversations();
    }, [getUsers, getConversations]);

    // Filter conversations / contacts based on search query
    const filteredConversations = conversations.filter((c) =>
        c.partner?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = users.filter((u) =>
        u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <aside className="flex h-full w-full md:w-80 lg:w-96 flex-col border-r border-white/10 bg-slate-950/70 backdrop-blur-2xl">
            {/* Header: Title & Search */}
            <div className="p-4 border-b border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 text-white font-bold text-sm">
                            💬
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-white">Chatter</h1>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                </div>

                {/* Tabs: Chats vs Contacts */}
                <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
                    <button
                        onClick={() => setSidebarTab("chats")}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                            sidebarTab === "chats"
                                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chats ({conversations.length})</span>
                    </button>
                    <button
                        onClick={() => setSidebarTab("contacts")}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                            sidebarTab === "contacts"
                                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <Users className="h-3.5 w-3.5" />
                        <span>Contacts ({users.length})</span>
                    </button>
                </div>
            </div>

            {/* List View */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sidebarTab === "chats" ? (
                    isConversationsLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-xs">Loading conversations...</span>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="py-10 px-4 text-center">
                            <p className="text-xs text-slate-400">No conversations found.</p>
                            <button
                                onClick={() => setSidebarTab("contacts")}
                                className="mt-2 text-xs font-semibold text-blue-400 hover:underline"
                            >
                                Start a chat from Contacts
                            </button>
                        </div>
                    ) : (
                        filteredConversations.map((conv) => {
                            const partner = conv.partner;
                            const isOnline = onlineUsers.includes(partner?._id);
                            const isSelected = selectedUser?._id === partner?._id;

                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => setSelectedUser(partner)}
                                    className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all ${
                                        isSelected
                                            ? "bg-blue-600/25 border border-blue-500/30 text-white"
                                            : "hover:bg-white/5 text-slate-300"
                                    }`}
                                >
                                    <div className="relative shrink-0">
                                        <img
                                            src={partner?.profilePic || "/favicon.svg"}
                                            alt={partner?.fullName}
                                            className="h-11 w-11 rounded-full object-cover ring-2 ring-white/10"
                                        />
                                        <span
                                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-slate-950 ${
                                                isOnline ? "bg-emerald-500" : "bg-slate-500"
                                            }`}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-semibold text-white truncate">
                                                {partner?.fullName}
                                            </h4>
                                        </div>
                                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                            {conv.lastMessage?.text ||
                                                (conv.lastMessage?.image && "📷 Photo") ||
                                                (conv.lastMessage?.video && "🎥 Video") ||
                                                "Start chatting"}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )
                ) : isUsersLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        <span className="text-xs">Loading contacts...</span>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="py-10 px-4 text-center">
                        <p className="text-xs text-slate-400">No contacts found.</p>
                    </div>
                ) : (
                    filteredUsers.map((user) => {
                        const isOnline = onlineUsers.includes(user._id);
                        const isSelected = selectedUser?._id === user._id;

                        return (
                            <button
                                key={user._id}
                                onClick={() => setSelectedUser(user)}
                                className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all ${
                                    isSelected
                                        ? "bg-blue-600/25 border border-blue-500/30 text-white"
                                        : "hover:bg-white/5 text-slate-300"
                                    }`}
                            >
                                <div className="relative shrink-0">
                                    <img
                                        src={user.profilePic || "/favicon.svg"}
                                        alt={user.fullName}
                                        className="h-11 w-11 rounded-full object-cover ring-2 ring-white/10"
                                    />
                                    <span
                                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-slate-950 ${
                                            isOnline ? "bg-emerald-500" : "bg-slate-500"
                                        }`}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-semibold text-white truncate">{user.fullName}</h4>
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Footer: Logged in user info */}
            <div className="p-3 border-t border-white/10 bg-slate-900/60 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                    <UserButton />
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{authUser?.fullName || "My Account"}</p>
                        <p className="text-[10px] text-slate-400 truncate">{authUser?.email}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
