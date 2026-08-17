import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { MediaModal } from "./MediaModal";
import { Loader2 } from "lucide-react";

function formatTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

function shouldShowDate(current, previous) {
    if (!previous) return true;
    const a = new Date(current);
    const b = new Date(previous);
    return a.toDateString() !== b.toDateString();
}

export function MessageList() {
    const messages = useChatStore((state) => state.messages);
    const isMessagesLoading = useChatStore((state) => state.isMessagesLoading);
    const selectedUser = useChatStore((state) => state.selectedUser);
    const authUser = useAuthStore((state) => state.authUser);

    const [modalMedia, setModalMedia] = useState({ url: null, isVideo: false });
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (isMessagesLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    No messages yet. Say hello!
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
            <div className="flex items-center justify-center py-4">
                <span className="text-[10px] font-medium px-3 py-1 rounded-full"
                      style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                    🔒 Messages are end-to-end encrypted
                </span>
            </div>

            {messages.map((msg, idx) => {
                const isOutgoing = msg.senderId === authUser?._id;
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const showDate = shouldShowDate(msg.createdAt, prevMsg?.createdAt);
                const isLegacy = !msg.protocolVersion && !msg.encryptedText;

                return (
                    <div key={msg._id}>
                        {showDate && (
                            <div className="flex items-center justify-center py-3">
                                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full"
                                      style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                                    {formatDate(msg.createdAt)}
                                </span>
                            </div>
                        )}

                        <div className={`flex flex-col ${isOutgoing ? "items-end" : "items-start"} mb-0.5`}>
                            <div className="group relative max-w-[75%] px-3 py-2"
                                 style={{
                                     background: isOutgoing ? 'var(--accent)' : 'var(--bg-surface)',
                                     color: isOutgoing ? 'white' : 'var(--text-primary)',
                                     borderRadius: '12px 12px 12px 4px',
                                     ...(isOutgoing ? { borderRadius: '12px 12px 4px 12px' } : {}),
                                 }}>
                                {msg.image && (
                                    <div className="cursor-pointer overflow-hidden rounded-lg mb-1.5"
                                         onClick={() => setModalMedia({ url: msg.image, isVideo: false })}>
                                        <img src={msg.image}
                                             alt=""
                                             className="max-h-52 w-full object-cover rounded-lg"
                                             loading="lazy" />
                                    </div>
                                )}

                                {msg.video && (
                                    <div className="cursor-pointer overflow-hidden rounded-lg mb-1.5"
                                         onClick={() => setModalMedia({ url: msg.video, isVideo: true })}>
                                        <video src={msg.video}
                                               controls
                                               className="max-h-52 w-full rounded-lg" />
                                    </div>
                                )}

                                {msg.text && (
                                    <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap break-words">
                                        {msg.text}
                                    </p>
                                )}

                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                    {isLegacy && (
                                        <span className="text-[8px]" style={{ color: isOutgoing ? 'rgba(255,255,255,0.4)' : 'var(--text-muted)' }}>
                                            legacy
                                        </span>
                                    )}
                                    <span className="text-[9px]"
                                          style={{ color: isOutgoing ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>
                                        {formatTime(msg.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            <div ref={messagesEndRef} />

            <MediaModal
                mediaUrl={modalMedia.url}
                isVideo={modalMedia.isVideo}
                isOpen={Boolean(modalMedia.url)}
                onClose={() => setModalMedia({ url: null, isVideo: false })}
            />
        </div>
    );
}
