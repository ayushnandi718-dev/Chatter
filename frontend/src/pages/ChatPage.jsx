import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";
import { useAuthStore } from "../store/useAuthStore";
import { ChatHeader } from "../components/chat/ChatHeader";
import { ChatMessageArea } from "../components/chat/ChatMessageArea";
import { ChatComposer } from "../components/chat/ChatComposer";
import { NoChatSelected } from "../components/chat/NoChatSelected";
import { WallpaperPicker } from "../components/chat/WallpaperPicker";
import { SearchUsers } from "../components/chat/SearchUsers";
import { FriendRequests } from "../components/chat/FriendRequests";
import { Sidebar } from "../components/chat/Sidebar";

export default function ChatPage() {
    const selectedUser = useChatStore((state) => state.selectedUser);
    const subscribeToMessages = useChatStore((state) => state.subscribeToMessages);
    const unsubscribeFromMessages = useChatStore((state) => state.unsubscribeFromMessages);
    const subscribeToFriendEvents = useFriendStore((state) => state.subscribeToFriendEvents);
    const unsubscribeFromFriendEvents = useFriendStore((state) => state.unsubscribeFromFriendEvents);
    const getFriends = useFriendStore((state) => state.getFriends);
    const getRequests = useFriendStore((state) => state.getRequests);
    const getConversations = useChatStore((state) => state.getConversations);
    const fetchBlockedUsers = useChatStore((state) => state.fetchBlockedUsers);

    const [isWallpaperOpen, setIsWallpaperOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isRequestsOpen, setIsRequestsOpen] = useState(false);

    useEffect(() => {
        subscribeToMessages();
        subscribeToFriendEvents();
        getFriends();
        getRequests();
        getConversations();
        fetchBlockedUsers();
        return () => {
            unsubscribeFromMessages();
            unsubscribeFromFriendEvents();
        };
    }, [subscribeToMessages, unsubscribeFromMessages, subscribeToFriendEvents, unsubscribeFromFriendEvents, getFriends, getRequests, getConversations, fetchBlockedUsers]);

    return (
        <div className="flex h-screen w-screen items-center justify-center overflow-hidden">
            <div className="relative flex h-full w-full max-w-[1400px] overflow-hidden rounded-none md:rounded-2xl"
                 style={{ background: 'var(--bg-app)' }}>

                <div
                    className={`${
                        selectedUser ? "hidden md:flex" : "flex"
                    } h-full w-full md:w-[300px] lg:w-[320px] shrink-0`}
                >
                    <Sidebar
                        onOpenSearch={() => setIsSearchOpen(true)}
                        onOpenRequests={() => setIsRequestsOpen(true)}
                    />
                </div>

                <div
                    className={`${
                        selectedUser ? "flex" : "hidden md:flex"
                    } flex-1 flex-col h-full overflow-hidden`}
                >
                    {selectedUser ? (
                        <>
                            <ChatHeader
                                onOpenWallpapers={() => setIsWallpaperOpen(true)}
                                onOpenSearch={() => setIsSearchOpen(true)}
                            />
                            <ChatMessageArea />
                            <ChatComposer />
                        </>
                    ) : (
                        <NoChatSelected onOpenSearch={() => setIsSearchOpen(true)} />
                    )}
                </div>
            </div>

            {isWallpaperOpen && (
                <WallpaperPicker
                    isOpen={isWallpaperOpen}
                    onClose={() => setIsWallpaperOpen(false)}
                />
            )}

            {isSearchOpen && <SearchUsers onClose={() => setIsSearchOpen(false)} />}
            {isRequestsOpen && <FriendRequests onClose={() => setIsRequestsOpen(false)} />}
        </div>
    );
}
