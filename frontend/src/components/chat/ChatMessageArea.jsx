import { useChatStore } from "../../store/useChatStore";
import { useWallpaperStore } from "../../store/useWallpaperStore";
import { MessageList } from "./MessageList";
import { PinnedMessageBar } from "./PinnedMessageBar";

export function ChatMessageArea() {
    const selectedUser = useChatStore((state) => state.selectedUser);
    const globalId = useWallpaperStore((state) => state.globalId);
    const brightness = useWallpaperStore((state) => state.brightness);
    const conversationMap = useWallpaperStore((state) => state.conversationMap);
    const customWallpapers = useWallpaperStore((state) => state.customWallpapers);
    const getWallpaperStyle = useWallpaperStore((state) => state.getWallpaperStyle);

    const conversationId = selectedUser?._id || "";
    const { wallpaperStyle, overlayOpacity } = getWallpaperStyle(conversationId);

    return (
        <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
            <div
                className="chat-wallpaper-layer"
                style={{
                    ...wallpaperStyle,
                    backgroundColor: wallpaperStyle.background ? undefined : "var(--bg-chat)",
                }}
            />
            <div
                className="chat-wallpaper-overlay"
                style={{ opacity: overlayOpacity }}
            />
            <div className="relative z-[1] flex-1 flex flex-col min-h-0 overflow-hidden">
                <PinnedMessageBar />
                <MessageList />
            </div>
        </div>
    );
}
