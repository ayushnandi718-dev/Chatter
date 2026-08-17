import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { MediaModal } from "./MediaModal";
import { Loader2, FileText, Download } from "lucide-react";

function formatTime(timestamp) {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
    return new Date(current).toDateString() !== new Date(previous).toDateString();
}

function formatFileSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(type) {
    if (type?.includes("pdf")) return "📄";
    if (type?.includes("word") || type?.includes("doc")) return "📝";
    if (type?.includes("sheet") || type?.includes("csv") || type?.includes("excel")) return "📊";
    if (type?.includes("zip") || type?.includes("rar") || type?.includes("7z")) return "📦";
    if (type?.includes("text")) return "📃";
    return "📎";
}

export function MessageList() {
    const messages = useChatStore((state) => state.messages);
    const isMessagesLoading = useChatStore((state) => state.isMessagesLoading);
    const authUser = useAuthStore((state) => state.authUser);

    const [modalMedia, setModalMedia] = useState({ url: null, isVideo: false });
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No messages yet. Say hello!</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
            <div className="flex items-center justify-center py-4">
                <span className="text-[10px] font-medium px-3 py-1 rounded-full"
                      style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                    Messages are end-to-end encrypted
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
                            <div className="group relative max-w-[80%] px-3 py-2"
                                 style={{
                                     background: isOutgoing ? 'var(--accent)' : 'var(--bg-surface)',
                                     color: isOutgoing ? 'white' : 'var(--text-primary)',
                                     borderRadius: '12px 12px 12px 4px',
                                     ...(isOutgoing ? { borderRadius: '12px 12px 4px 12px' } : {}),
                                 }}>
                                {msg.image && (
                                    <div className="cursor-pointer overflow-hidden rounded-lg mb-1.5"
                                         onClick={() => setModalMedia({ url: msg.image, isVideo: false })}>
                                        <img src={msg.image} alt="" className="max-h-52 w-full object-cover rounded-lg" loading="lazy" />
                                    </div>
                                )}

                                {msg.video && (
                                    <div className="cursor-pointer overflow-hidden rounded-lg mb-1.5"
                                         onClick={() => setModalMedia({ url: msg.video, isVideo: true })}>
                                        <video src={msg.video} controls className="max-h-52 w-full rounded-lg" />
                                    </div>
                                )}

                                {msg.audio && (
                                    <div className="mb-1.5 min-w-[200px]">
                                        <audio src={msg.audio} controls className="w-full h-8" style={{ maxHeight: '32px' }} />
                                    </div>
                                )}

                                {msg.file && (
                                    <a href={msg.file} target="_blank" rel="noopener noreferrer"
                                       className="flex items-center gap-2.5 rounded-lg px-3 py-2 mb-1.5 no-underline transition-colors"
                                       style={{
                                           background: isOutgoing ? 'rgba(255,255,255,0.12)' : 'var(--bg-elevated)',
                                           border: '1px solid ' + (isOutgoing ? 'rgba(255,255,255,0.08)' : 'var(--border)'),
                                       }}>
                                        <span className="text-lg">{getFileIcon(msg.fileType)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-medium truncate"
                                               style={{ color: isOutgoing ? 'white' : 'var(--text-primary)' }}>
                                                {msg.fileName || "File"}
                                            </p>
                                            {msg.fileSize > 0 && (
                                                <p className="text-[9px]"
                                                   style={{ color: isOutgoing ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>
                                                    {formatFileSize(msg.fileSize)}
                                                </p>
                                            )}
                                        </div>
                                        <Download className="h-3.5 w-3.5 shrink-0" style={{ color: isOutgoing ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }} />
                                    </a>
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
