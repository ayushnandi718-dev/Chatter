import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { MediaModal } from "./MediaModal";
import { Loader2, Play } from "lucide-react";

function formatTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageList() {
    const messages = useChatStore((state) => state.messages);
    const isMessagesLoading = useChatStore((state) => state.isMessagesLoading);
    const selectedUser = useChatStore((state) => state.selectedUser);
    const authUser = useAuthStore((state) => state.authUser);

    const [modalMedia, setModalMedia] = useState({ url: null, isVideo: false });
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (isMessagesLoading) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
                <p className="text-xs text-slate-400">Loading chat history...</p>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mb-3">
                    <span className="text-2xl">👋</span>
                </div>
                <h4 className="text-sm font-semibold text-white">No messages yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Say hello to {selectedUser?.fullName} and start the conversation!
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg) => {
                const isOutgoing = msg.senderId === authUser?._id;

                return (
                    <div
                        key={msg._id}
                        className={`flex flex-col ${isOutgoing ? "items-end" : "items-start"}`}
                    >
                        <div
                            className={`group relative max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-md backdrop-blur-md transition-all duration-150 ${
                                isOutgoing
                                    ? "bg-blue-600 text-white rounded-br-xs"
                                    : "bg-slate-800/90 text-slate-100 rounded-bl-xs border border-white/10"
                            }`}
                        >
                            {/* Image Attachment */}
                            {msg.image && (
                                <div
                                    className="cursor-pointer overflow-hidden rounded-xl mb-2 border border-black/10 relative group/media"
                                    onClick={() => setModalMedia({ url: msg.image, isVideo: false })}
                                >
                                    <img
                                        src={msg.image}
                                        alt="Chat attachment"
                                        className="max-h-64 w-full object-cover rounded-xl transition-transform duration-200 group-hover/media:scale-105"
                                        loading="lazy"
                                    />
                                </div>
                            )}

                            {/* Video Attachment */}
                            {msg.video && (
                                <div
                                    className="cursor-pointer overflow-hidden rounded-xl mb-2 border border-black/10 relative group/video"
                                    onClick={() => setModalMedia({ url: msg.video, isVideo: true })}
                                >
                                    <video
                                        src={msg.video}
                                        controls
                                        className="max-h-64 w-full rounded-xl object-cover"
                                    />
                                </div>
                            )}

                            {/* Text message */}
                            {msg.text && (
                                <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">
                                    {msg.text}
                                </p>
                            )}

                            {/* Timestamp */}
                            <div
                                className={`text-[10px] mt-1 text-right select-none ${
                                    isOutgoing ? "text-blue-200/80" : "text-slate-400"
                                }`}
                            >
                                {formatTime(msg.createdAt)}
                            </div>
                        </div>
                    </div>
                );
            })}

            <div ref={messagesEndRef} />

            {/* Media Lightbox */}
            <MediaModal
                mediaUrl={modalMedia.url}
                isVideo={modalMedia.isVideo}
                isOpen={Boolean(modalMedia.url)}
                onClose={() => setModalMedia({ url: null, isVideo: false })}
            />
        </div>
    );
}
