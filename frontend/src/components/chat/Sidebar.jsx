import { useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useFriendStore } from "../../store/useFriendStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useCryptoStore } from "../../store/useCryptoStore";
import { UserButton } from "@clerk/react";
import { Search, MessageSquare, Users, UserPlus, Bell, Shield } from "lucide-react";

export function Sidebar({ onOpenSearch, onOpenRequests }) {
    const conversations = useChatStore((state) => state.conversations);
    const selectedUser = useChatStore((state) => state.selectedUser);
    const setSelectedUser = useChatStore((state) => state.setSelectedUser);
    const isConversationsLoading = useChatStore((state) => state.isConversationsLoading);
    const searchQuery = useChatStore((state) => state.searchQuery);
    const setSearchQuery = useChatStore((state) => state.setSearchQuery);
    const decryptedPreviews = useChatStore((state) => state.decryptedPreviews);

    const friends = useFriendStore((state) => state.friends);
    const incomingRequests = useFriendStore((state) => state.incomingRequests);
    const isFriendsLoading = useFriendStore((state) => state.isFriendsLoading);

    const authUser = useAuthStore((state) => state.authUser);
    const onlineUsers = useAuthStore((state) => state.onlineUsers);

    const [sidebarTab, setSidebarTab] = useState("chats");

    const filteredConversations = conversations.filter((c) =>
        c.partner?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.partner?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFriends = friends.filter(
        (f) =>
            f.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <aside className="flex h-full w-full flex-col"
               style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}>

            <div className="p-3 space-y-3">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                             style={{ background: 'var(--accent)' }}>
                            <span className="text-white text-xs font-bold">C</span>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Chatter</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onOpenRequests}
                            className="relative flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            title="Friend Requests"
                        >
                            <Bell className="h-3.5 w-3.5" />
                            {incomingRequests.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                                      style={{ background: 'var(--danger)' }}>
                                    {incomingRequests.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={onOpenSearch}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-white transition-colors"
                            style={{ background: 'var(--accent)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}
                            title="Add Friend"
                        >
                            <UserPlus className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                            style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none transition-colors"
                        style={{
                            background: 'var(--bg-hover)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border)',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                    />
                </div>

                <div className="flex gap-1 p-0.5 rounded-lg"
                     style={{ background: 'var(--bg-hover)' }}>
                    {[
                        { id: "chats", icon: MessageSquare, label: "Chats", count: conversations.length },
                        { id: "friends", icon: Users, label: "Friends", count: friends.length },
                    ].map(({ id, icon: Icon, label, count }) => (
                        <button
                            key={id}
                            onClick={() => setSidebarTab(id)}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-all"
                            style={{
                                background: sidebarTab === id ? 'var(--accent)' : 'transparent',
                                color: sidebarTab === id ? 'white' : 'var(--text-secondary)',
                            }}
                        >
                            <Icon className="h-3 w-3" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-1.5 pb-1.5 space-y-0.5">
                {sidebarTab === "chats" ? (
                    isConversationsLoading ? (
                        <div className="flex items-center justify-center py-12"
                             style={{ color: 'var(--text-muted)' }}>
                            <span className="text-[11px]">Loading...</span>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="py-10 px-3 text-center">
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>No conversations yet.</p>
                            <button onClick={onOpenSearch}
                                    className="mt-1.5 text-[11px] font-medium hover:underline"
                                    style={{ color: 'var(--accent)' }}>
                                Find friends
                            </button>
                        </div>
                    ) : (
                        filteredConversations.map((conv) => {
                            const partner = conv.partner;
                            const isOnline = onlineUsers.includes(partner?._id);
                            const isSelected = selectedUser?._id === partner?._id;
                            const preview = decryptedPreviews[conv._id]
                                || conv.lastMessage?.text
                                || (conv.lastMessage?.image && "Photo")
                                || (conv.lastMessage?.video && "Video")
                                || "";

                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => setSelectedUser(partner)}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors"
                                    style={{
                                        background: isSelected ? 'var(--bg-active)' : 'transparent',
                                        borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                                    }}
                                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <div className="relative shrink-0">
                                        <img src={partner?.profilePic || "/favicon.svg"}
                                             alt=""
                                             className="h-9 w-9 rounded-full object-cover" />
                                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2"
                                              style={{
                                                  background: isOnline ? 'var(--success)' : '#52525b',
                                                  ringColor: 'var(--bg-sidebar)',
                                              }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-medium truncate"
                                            style={{ color: 'var(--text-primary)' }}>
                                            {partner?.displayName || partner?.username}
                                        </h4>
                                        <p className="text-[10px] truncate mt-0.5"
                                           style={{ color: preview ? 'var(--text-muted)' : 'var(--text-muted)' }}>
                                            {preview || "Start chatting"}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )
                ) : isFriendsLoading ? (
                    <div className="flex items-center justify-center py-12"
                         style={{ color: 'var(--text-muted)' }}>
                        <span className="text-[11px]">Loading...</span>
                    </div>
                ) : filteredFriends.length === 0 ? (
                    <div className="py-10 px-3 text-center">
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>No friends yet.</p>
                        <button onClick={onOpenSearch}
                                className="mt-1.5 text-[11px] font-medium hover:underline"
                                style={{ color: 'var(--accent)' }}>
                            Find people
                        </button>
                    </div>
                ) : (
                    filteredFriends.map((friend) => {
                        const isOnline = onlineUsers.includes(friend._id);
                        const isSelected = selectedUser?._id === friend._id;

                        return (
                            <button
                                key={friend._id}
                                onClick={() => setSelectedUser(friend)}
                                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors"
                                style={{
                                    background: isSelected ? 'var(--bg-active)' : 'transparent',
                                    borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                                }}
                                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <div className="relative shrink-0">
                                    <img src={friend.profilePic || "/favicon.svg"}
                                         alt=""
                                         className="h-9 w-9 rounded-full object-cover" />
                                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2"
                                          style={{
                                              background: isOnline ? 'var(--success)' : '#52525b',
                                              ringColor: 'var(--bg-sidebar)',
                                          }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-medium truncate"
                                        style={{ color: 'var(--text-primary)' }}>
                                        {friend.displayName || friend.username}
                                    </h4>
                                    <p className="text-[10px] truncate mt-0.5"
                                       style={{ color: 'var(--text-muted)' }}>
                                        @{friend.username}
                                    </p>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            <div className="p-2 flex items-center gap-2"
                 style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-sidebar)' }}>
                <UserButton />
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium truncate"
                       style={{ color: 'var(--text-primary)' }}>
                        {authUser?.displayName || authUser?.username || "Account"}
                    </p>
                    <p className="text-[9px] truncate"
                       style={{ color: 'var(--text-muted)' }}>
                        @{authUser?.username || "username"}
                    </p>
                </div>
                <Shield className="h-3 w-3 shrink-0" style={{ color: 'var(--text-muted)' }} title="End-to-end encrypted" />
            </div>
        </aside>
    );
}
