import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";
import { useAuthStore } from "../store/useAuthStore";
import { useWallpaper } from "../context/WallpaperContext";
import { ChatHeader } from "../components/chat/ChatHeader";
import { MessageList } from "../components/chat/MessageList";
import { ChatComposer } from "../components/chat/ChatComposer";
import { NoChatSelected } from "../components/chat/NoChatSelected";
import { WallpaperModal } from "../components/chat/WallpaperModal";
import { SearchUsers } from "../components/chat/SearchUsers";
import { FriendRequests } from "../components/chat/FriendRequests";
import { Sidebar } from "../components/chat/Sidebar";

export default function ChatPage() {
    const { frameStyle } = useWallpaper();
    const selectedUser = useChatStore((state) => state.selectedUser);
    const subscribeToMessages = useChatStore((state) => state.subscribeToMessages);
    const unsubscribeFromMessages = useChatStore((state) => state.unsubscribeFromMessages);
    const subscribeToFriendEvents = useFriendStore((state) => state.subscribeToFriendEvents);
    const unsubscribeFromFriendEvents = useFriendStore((state) => state.unsubscribeFromFriendEvents);
    const getFriends = useFriendStore((state) => state.getFriends);
    const getRequests = useFriendStore((state) => state.getRequests);
    const getConversations = useChatStore((state) => state.getConversations);

    const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isRequestsOpen, setIsRequestsOpen] = useState(false);

    useEffect(() => {
        subscribeToMessages();
        subscribeToFriendEvents();
        getFriends();
        getRequests();
        getConversations();
        return () => {
            unsubscribeFromMessages();
            unsubscribeFromFriendEvents();
        };
    }, [subscribeToMessages, unsubscribeFromMessages, subscribeToFriendEvents, unsubscribeFromFriendEvents, getFriends, getRequests, getConversations]);

    return (
        <div
            className="flex h-screen w-screen items-center justify-center p-0 md:p-4 lg:p-6 transition-all duration-300 overflow-hidden"
            style={frameStyle}
        >
            <div className="relative flex h-full w-full max-w-7xl overflow-hidden rounded-none md:rounded-3xl bg-slate-950/85 shadow-2xl border-0 md:border border-white/15 backdrop-blur-2xl">
                <div
                    className={`${
                        selectedUser ? "hidden md:flex" : "flex"
                    } h-full w-full md:w-auto shrink-0`}
                >
                    <Sidebar
                        onOpenSearch={() => setIsSearchOpen(true)}
                        onOpenRequests={() => setIsRequestsOpen(true)}
                    />
                </div>

                <div
                    className={`${
                        selectedUser ? "flex" : "hidden md:flex"
                    } flex-1 flex-col h-full overflow-hidden bg-slate-900/40`}
                >
                    {selectedUser ? (
                        <>
                            <ChatHeader onOpenWallpapers={() => setIsWallpaperModalOpen(true)} />
                            <MessageList />
                            <ChatComposer />
                        </>
                    ) : (
                        <NoChatSelected onOpenSearch={() => setIsSearchOpen(true)} />
                    )}
                </div>
            </div>

            <WallpaperModal
                isOpen={isWallpaperModalOpen}
                onClose={() => setIsWallpaperModalOpen(false)}
            />

            {isSearchOpen && <SearchUsers onClose={() => setIsSearchOpen(false)} />}
            {isRequestsOpen && <FriendRequests onClose={() => setIsRequestsOpen(false)} />}
        </div>
    );
}
