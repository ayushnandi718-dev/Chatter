import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useWallpaper } from "../context/WallpaperContext";
import { ChatSidebar } from "../components/chat/ChatSidebar";
import { ChatHeader } from "../components/chat/ChatHeader";
import { MessageList } from "../components/chat/MessageList";
import { ChatComposer } from "../components/chat/ChatComposer";
import { NoChatSelected } from "../components/chat/NoChatSelected";
import { WallpaperModal } from "../components/chat/WallpaperModal";

export default function ChatPage() {
    const { frameStyle } = useWallpaper();
    const selectedUser = useChatStore((state) => state.selectedUser);
    const subscribeToMessages = useChatStore((state) => state.subscribeToMessages);
    const unsubscribeFromMessages = useChatStore((state) => state.unsubscribeFromMessages);

    const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);

    useEffect(() => {
        subscribeToMessages();
        return () => {
            unsubscribeFromMessages();
        };
    }, [subscribeToMessages, unsubscribeFromMessages]);

    return (
        <div
            className="flex h-screen w-screen items-center justify-center p-0 md:p-4 lg:p-6 transition-all duration-300 overflow-hidden"
            style={frameStyle}
        >
            <div className="relative flex h-full w-full max-w-7xl overflow-hidden rounded-none md:rounded-3xl bg-slate-950/85 shadow-2xl border-0 md:border border-white/15 backdrop-blur-2xl">
                {/* Left Sidebar */}
                <div
                    className={`${
                        selectedUser ? "hidden md:flex" : "flex"
                    } h-full w-full md:w-auto shrink-0`}
                >
                    <ChatSidebar />
                </div>

                {/* Right Active Chat Area */}
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
                        <NoChatSelected />
                    )}
                </div>
            </div>

            {/* Wallpaper Picker Modal */}
            <WallpaperModal
                isOpen={isWallpaperModalOpen}
                onClose={() => setIsWallpaperModalOpen(false)}
            />
        </div>
    );
}
