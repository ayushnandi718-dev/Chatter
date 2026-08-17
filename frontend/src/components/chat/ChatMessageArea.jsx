import { useMemo } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useWallpaperStore } from "../../store/useWallpaperStore";
import { MessageList } from "./MessageList";

export function ChatMessageArea() {
    const selectedUser = useChatStore((state) => state.selectedUser);
    const getWallpaperStyle = useWallpaperStore((state) => state.getWallpaperStyle);

    const conversationId = selectedUser?._id || "";
    const { wallpaperStyle, overlayOpacity } = useMemo(
        () => getWallpaperStyle(conversationId),
        [conversationId, getWallpaperStyle]
    );

    return (
        <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
            <div
                className="chat-wallpaper-layer"
                style={wallpaperStyle}
            />
            <div
                className="chat-wallpaper-overlay"
                style={{ opacity: overlayOpacity }}
            />
            <div className="relative z-[1] flex-1 flex flex-col min-h-0 overflow-hidden">
                <MessageList />
            </div>
        </div>
    );
}
