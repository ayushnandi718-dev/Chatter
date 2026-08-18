import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";
import { useAuthStore } from "../store/useAuthStore";
import { usePreferencesStore } from "../store/usePreferencesStore";
import { ChatHeader } from "../components/chat/ChatHeader";
import { ChatMessageArea } from "../components/chat/ChatMessageArea";
import { ChatComposer } from "../components/chat/ChatComposer";
import { NoChatSelected } from "../components/chat/NoChatSelected";
import { WallpaperPicker } from "../components/chat/WallpaperPicker";
import { SearchUsers } from "../components/chat/SearchUsers";
import { FriendRequests } from "../components/chat/FriendRequests";
import { Sidebar } from "../components/chat/Sidebar";
import { SettingsPanel } from "../components/chat/SettingsPanel";
import { UserProfileModal } from "../components/chat/UserProfileModal";
import { ContactInfoPanel } from "../components/chat/ContactInfoPanel";
import { MessageInfoDrawer } from "../components/chat/MessageInfoDrawer";

export default function ChatPage() {
    const selectedUser = useChatStore((state) => state.selectedUser);
    const subscribeToMessages = useChatStore((state) => state.subscribeToMessages);
    const unsubscribeFromMessages = useChatStore((state) => state.unsubscribeFromMessages);
    const subscribeToFriendEvents = useFriendStore((state) => state.subscribeToFriendEvents);
    const unsubscribeFromFriendEvents = useFriendStore((state) => state.unsubscribeFromFriendEvents);
    const subscribeToReconnectEvents = useChatStore((state) => state.subscribeToReconnectEvents);
    const unsubscribeFromReconnectEvents = useChatStore((state) => state.unsubscribeFromReconnectEvents);
    const getFriends = useFriendStore((state) => state.getFriends);
    const getRequests = useFriendStore((state) => state.getRequests);
    const getConversations = useChatStore((state) => state.getConversations);
    const fetchBlockedUsers = useChatStore((state) => state.fetchBlockedUsers);
    const fetchUserPreferences = usePreferencesStore((state) => state.fetchUserPreferences);

    const [isWallpaperOpen, setIsWallpaperOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isRequestsOpen, setIsRequestsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [viewProfileUserId, setViewProfileUserId] = useState(null);
    const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
    const [messageInfoMsg, setMessageInfoMsg] = useState(null);

    useEffect(() => {
        subscribeToMessages();
        subscribeToFriendEvents();
        subscribeToReconnectEvents();
        getFriends();
        getRequests();
        getConversations();
        fetchBlockedUsers();
        fetchUserPreferences();
        return () => {
            unsubscribeFromMessages();
            unsubscribeFromFriendEvents();
            unsubscribeFromReconnectEvents();
        };
    }, [subscribeToMessages, unsubscribeFromMessages, subscribeToFriendEvents, unsubscribeFromFriendEvents, subscribeToReconnectEvents, unsubscribeFromReconnectEvents, getFriends, getRequests, getConversations, fetchBlockedUsers, fetchUserPreferences]);

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
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onOpenProfile={(userId) => setViewProfileUserId(userId)}
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
                                onOpenContactInfo={() => setIsContactInfoOpen(true)}
                                onOpenProfile={(userId) => setViewProfileUserId(userId)}
                            />
                            <div className="flex-1 flex min-h-0 overflow-hidden">
                                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                                    <ChatMessageArea onMessageInfo={(msg) => setMessageInfoMsg(msg)} />
                                    <ChatComposer />
                                </div>
                                {isContactInfoOpen && (
                                    <ContactInfoPanel onClose={() => setIsContactInfoOpen(false)} />
                                )}
                                {messageInfoMsg && (
                                    <MessageInfoDrawer
                                        message={messageInfoMsg}
                                        isOutgoing={messageInfoMsg.senderId === useAuthStore.getState().authUser?._id}
                                        onClose={() => setMessageInfoMsg(null)}
                                    />
                                )}
                            </div>
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
            <SettingsPanel
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onOpenWallpapers={() => { setIsSettingsOpen(false); setIsWallpaperOpen(true); }}
            />
            {viewProfileUserId && (
                <UserProfileModal
                    userId={viewProfileUserId}
                    onClose={() => setViewProfileUserId(null)}
                    onStartChat={(userId) => {
                        const conv = useChatStore.getState().conversations.find((c) => c._id === userId);
                        if (conv) {
                            useChatStore.getState().setSelectedUser(conv.partner || { _id: userId });
                        }
                        setViewProfileUserId(null);
                    }}
                />
            )}
        </div>
    );
}
