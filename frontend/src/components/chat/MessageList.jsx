import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore, MessageStatus } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useCryptoStore } from "../../store/useCryptoStore";
import { MediaModal } from "./MediaModal";
import { ImageViewer } from "./ImageViewer";
import { Loader2, Download, Check, CheckCheck, AlertCircle, Reply, Copy, Trash2, RotateCcw, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";

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

function shouldShowSender(current, previous, isOutgoing) {
    if (isOutgoing) return false;
    if (!previous) return true;
    return previous.senderId !== current.senderId;
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

function DeliveryStatus({ status, isOutgoing }) {
    if (!isOutgoing) return null;

    const size = "h-3 w-3";
    const color = status === MessageStatus.READ ? "var(--accent)" : "rgba(255,255,255,0.5)";

    switch (status) {
        case MessageStatus.SENDING:
            return <Loader2 className={`${size} animate-spin`} style={{ color: "rgba(255,255,255,0.4)" }} />;
        case MessageStatus.SENT:
            return <Check className={size} style={{ color }} />;
        case MessageStatus.DELIVERED:
            return <CheckCheck className={size} style={{ color }} />;
        case MessageStatus.READ:
            return <CheckCheck className={size} style={{ color }} />;
        case MessageStatus.FAILED:
            return <AlertCircle className={size} style={{ color: "#ef4444" }} />;
        default:
            return null;
    }
}

const DEFAULT_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

function ReactionBar({ reactions, isOutgoing, onToggle }) {
    if (!reactions || reactions.length === 0) return null;

    const grouped = {};
    for (const r of reactions) {
        if (!grouped[r.emoji]) grouped[r.emoji] = { emoji: r.emoji, count: 0, userIds: [] };
        grouped[r.emoji].count++;
        grouped[r.emoji].userIds.push(r.userId);
    }

    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {Object.values(grouped).map(({ emoji, count, userIds }) => {
                const isMyReaction = userIds.includes(useAuthStore.getState().authUser?._id);
                return (
                    <button key={emoji}
                            onClick={(e) => { e.stopPropagation(); onToggle(emoji); }}
                            className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] transition-colors"
                            style={{
                                background: isMyReaction ? "var(--accent-muted)" : (isOutgoing ? "rgba(255,255,255,0.1)" : "var(--bg-elevated)"),
                                border: "1px solid " + (isMyReaction ? "var(--accent)" : "transparent"),
                            }}>
                        <span>{emoji}</span>
                        {count > 1 && <span style={{ color: isOutgoing ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>{count}</span>}
                    </button>
                );
            })}
        </div>
    );
}

function ReactionPicker({ onSelect, onClose }) {
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    return (
        <div ref={ref}
             className="absolute bottom-full mb-1 flex gap-0.5 rounded-full px-2 py-1 z-50"
             style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
            {DEFAULT_REACTIONS.map((emoji) => (
                <button key={emoji}
                        onClick={(e) => { e.stopPropagation(); onSelect(emoji); }}
                        className="text-sm hover:scale-125 transition-transform px-0.5">
                    {emoji}
                </button>
            ))}
        </div>
    );
}

function MessageContextMenu({ x, y, message, isOutgoing, onClose, onReply, onDelete, onRetry, onEdit, onReact }) {
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener("mousedown", handler);
        document.addEventListener("touchstart", handler);
        return () => {
            document.removeEventListener("mousedown", handler);
            document.removeEventListener("touchstart", handler);
        };
    }, [onClose]);

    const handleCopy = () => {
        if (message.text) {
            navigator.clipboard.writeText(message.text).then(() => toast.success("Copied"));
        }
        onClose();
    };

    return (
        <div ref={ref}
             className="fixed z-[200] w-44 rounded-lg py-1 shadow-xl"
             style={{
                 left: Math.min(x, window.innerWidth - 180),
                 top: Math.min(y, window.innerHeight - 280),
                 background: "var(--bg-surface)",
                 border: "1px solid var(--border)",
             }}>
            <button onClick={onReply}
                    className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-medium transition-colors"
                    style={{ color: "var(--text-primary)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <Reply className="h-3 w-3" style={{ color: "var(--accent)" }} />
                Reply
            </button>

            <button onClick={onReact}
                    className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-medium transition-colors"
                    style={{ color: "var(--text-primary)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <span className="text-sm">😊</span>
                React
            </button>

            {message.text && (
                <button onClick={handleCopy}
                        className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-medium transition-colors"
                        style={{ color: "var(--text-primary)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <Copy className="h-3 w-3" style={{ color: "var(--accent)" }} />
                    Copy
                </button>
            )}

            {isOutgoing && !message.isDeletedForEveryone && message.text && !message.encryptedText && (
                <button onClick={onEdit}
                        className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-medium transition-colors"
                        style={{ color: "var(--text-primary)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <Pencil className="h-3 w-3" style={{ color: "var(--accent)" }} />
                    Edit
                </button>
            )}

            {isOutgoing && message._status === MessageStatus.FAILED && (
                <button onClick={() => { onRetry(); onClose(); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-medium transition-colors"
                        style={{ color: "var(--accent)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <RotateCcw className="h-3 w-3" />
                    Retry
                </button>
            )}

            <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />

            <button onClick={() => { onDelete(); onClose(); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-medium transition-colors"
                    style={{ color: "var(--danger)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <Trash2 className="h-3 w-3" />
                {isOutgoing ? "Delete for everyone" : "Delete for me"}
            </button>
        </div>
    );
}

function ReplyPreview({ replyToMessage, onCancel }) {
    if (!replyToMessage) return null;

    let preview = "";
    if (replyToMessage.isDeletedForEveryone) {
        preview = "Message deleted";
    } else if (replyToMessage.text) {
        preview = replyToMessage.text;
    } else if (replyToMessage.encryptedText) {
        preview = "🔒 Encrypted message";
    } else if (replyToMessage.image) {
        preview = "📷 Photo";
    } else if (replyToMessage.video) {
        preview = "🎬 Video";
    } else if (replyToMessage.audio) {
        preview = "🎤 Audio";
    } else if (replyToMessage.file) {
        preview = "📎 " + (replyToMessage.fileName || "File");
    }

    const authUser = useAuthStore.getState().authUser;
    const isOwn = replyToMessage.senderId === authUser?._id;

    return (
        <div className="flex items-center gap-2 mb-2 rounded-lg px-3 py-2"
             style={{ background: "var(--bg-elevated)", borderLeft: "3px solid var(--accent)" }}>
            <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold" style={{ color: "var(--accent)" }}>
                    {isOwn ? "You" : "Replying to message"}
                </p>
                <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                    {preview}
                </p>
            </div>
            <button onClick={onCancel}
                    className="h-5 w-5 flex items-center justify-center rounded-full shrink-0"
                    style={{ color: "var(--text-muted)" }}>
                ✕
            </button>
        </div>
    );
}

export function MessageList({ onReply }) {
    const messages = useChatStore((state) => state.messages);
    const isMessagesLoading = useChatStore((state) => state.isMessagesLoading);
    const retryMessage = useChatStore((state) => state.retryMessage);
    const deleteMessage = useChatStore((state) => state.deleteMessage);
    const authUser = useAuthStore((state) => state.authUser);

    const [modalMedia, setModalMedia] = useState({ url: null, isVideo: false });
    const [contextMenu, setContextMenu] = useState(null);
    const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);
    const messagesEndRef = useRef(null);

    const allImageUrls = messages
        .map((m) => m.image)
        .filter(Boolean);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleContextMenu = useCallback((e, msg) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, message: msg });
    }, []);

    const handleTouchStart = useCallback((e, msg) => {
        const touch = e.touches[0];
        const timer = setTimeout(() => {
            setContextMenu({ x: touch.clientX, y: touch.clientY, message: msg });
        }, 500);
        const clear = () => {
            clearTimeout(timer);
            document.removeEventListener("touchend", clear);
            document.removeEventListener("touchmove", clear);
        };
        document.addEventListener("touchend", clear, { once: true });
        document.addEventListener("touchmove", clear, { once: true });
    }, []);

    const handleReaction = useCallback(async (messageId, emoji) => {
        try {
            const res = await axiosInstance.post(`/messages/${messageId}/reaction`, { emoji });
            useChatStore.setState((state) => ({
                messages: state.messages.map((m) =>
                    m._id === messageId ? { ...m, reactions: res.data.reactions } : m
                ),
            }));
        } catch {
            toast.error("Failed to react");
        }
    }, []);

    const handleDelete = useCallback((messageId) => {
        const msg = messages.find((m) => m._id === messageId);
        const isOwn = msg?.senderId === authUser?._id;
        deleteMessage(messageId, isOwn);
    }, [messages, authUser, deleteMessage]);

    const handleEdit = useCallback(async (message) => {
        const newText = prompt("Edit message:", message.text);
        if (newText === null || newText.trim() === message.text.trim()) return;
        try {
            await axiosInstance.patch(`/messages/${message._id}`, { text: newText.trim() });
            toast.success("Message edited");
        } catch {
            toast.error("Failed to edit message");
        }
    }, []);

    if (isMessagesLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--accent)" }} />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>No messages yet. Say hello!</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
            <div className="flex items-center justify-center py-4">
                <span className="text-[10px] font-medium px-3 py-1 rounded-full"
                      style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                    Text messages are end-to-end encrypted
                </span>
            </div>

            {messages.map((msg, idx) => {
                const isOutgoing = msg.senderId === authUser?._id;
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const showDate = shouldShowDate(msg.createdAt, prevMsg?.createdAt);
                const isLegacy = !msg.protocolVersion && !msg.encryptedText;
                const isFailed = msg._status === MessageStatus.FAILED;
                const isDeleted = msg.isDeletedForEveryone;

                return (
                    <div key={msg._id}>
                        {showDate && (
                            <div className="flex items-center justify-center py-3">
                                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full"
                                      style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                                    {formatDate(msg.createdAt)}
                                </span>
                            </div>
                        )}

                        <div className={`flex flex-col ${isOutgoing ? "items-end" : "items-start"} mb-0.5`}>
                            <div
                                className="group relative max-w-[80%] px-3 py-2 select-none"
                                style={{
                                    background: isFailed ? "rgba(239,68,68,0.15)" : isDeleted ? "var(--bg-elevated)" : isOutgoing ? "var(--accent)" : "var(--bg-surface)",
                                    color: isFailed ? "var(--danger)" : isDeleted ? "var(--text-muted)" : isOutgoing ? "white" : "var(--text-primary)",
                                    borderRadius: isOutgoing ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                                    border: isFailed ? "1px solid rgba(239,68,68,0.3)" : isDeleted ? "1px solid var(--border)" : "none",
                                    opacity: msg._status === MessageStatus.SENDING ? 0.7 : 1,
                                }}
                                onContextMenu={(e) => !isDeleted && handleContextMenu(e, msg)}
                                onTouchStart={(e) => !isDeleted && handleTouchStart(e, msg)}>

                                {isDeleted ? (
                                    <p className="text-[11px] italic" style={{ color: "var(--text-muted)" }}>
                                        This message was deleted
                                    </p>
                                ) : (
                                    <>
                                        {msg.replyTo && msg.replyToMessage && (
                                            <div className="mb-1.5 rounded-md px-2 py-1.5"
                                                 style={{
                                                     background: isOutgoing ? "rgba(255,255,255,0.1)" : "var(--bg-elevated)",
                                                     borderLeft: "2px solid " + (isOutgoing ? "rgba(255,255,255,0.4)" : "var(--accent)"),
                                                 }}>
                                                <p className="text-[8px] font-semibold" style={{ color: isOutgoing ? "rgba(255,255,255,0.6)" : "var(--accent)" }}>
                                                    {msg.replyToMessage.senderId === authUser?._id ? "You" : "Reply"}
                                                </p>
                                                <p className="text-[9px] truncate" style={{ color: isOutgoing ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }}>
                                                    {msg.replyToMessage.isDeletedForEveryone
                                                        ? "Message deleted"
                                                        : msg.replyToMessage.text || msg.replyToMessage.encryptedText
                                                            ? "🔒 Encrypted"
                                                            : msg.replyToMessage.image ? "📷 Photo" : "📎 File"}
                                                </p>
                                            </div>
                                        )}

                                        {isFailed && (
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <AlertCircle className="h-3 w-3" style={{ color: "var(--danger)" }} />
                                                <span className="text-[9px] font-medium" style={{ color: "var(--danger)" }}>
                                                    Failed to send
                                                </span>
                                            </div>
                                        )}

                                        {msg.image && (
                                            <div className="cursor-pointer overflow-hidden rounded-lg mb-1.5"
                                                 onClick={() => {
                                                     const idx = allImageUrls.indexOf(msg.image);
                                                     setViewerIndex(idx >= 0 ? idx : 0);
                                                     setViewerOpen(true);
                                                 }}>
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
                                                <audio src={msg.audio} controls className="w-full h-8" style={{ maxHeight: "32px" }} />
                                            </div>
                                        )}

                                        {msg.file && (
                                            msg.fileType?.startsWith("image/") ? (
                                                <button
                                                    onClick={() => {
                                                        setViewerIndex(0);
                                                        setViewerOpen(true);
                                                    }}
                                                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 mb-1.5 transition-colors text-left w-full"
                                                    style={{
                                                        background: isOutgoing ? "rgba(255,255,255,0.12)" : "var(--bg-elevated)",
                                                        border: "1px solid " + (isOutgoing ? "rgba(255,255,255,0.08)" : "var(--border)"),
                                                    }}>
                                                    <span className="text-lg">{getFileIcon(msg.fileType)}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-medium truncate"
                                                           style={{ color: isOutgoing ? "white" : "var(--text-primary)" }}>
                                                            {msg.fileName || "File"}
                                                        </p>
                                                        {msg.fileSize > 0 && (
                                                            <p className="text-[9px]"
                                                               style={{ color: isOutgoing ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }}>
                                                                {formatFileSize(msg.fileSize)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Download className="h-3.5 w-3.5 shrink-0" style={{ color: isOutgoing ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }} />
                                                </button>
                                            ) : (
                                                <a
                                                    href={msg.file}
                                                    download={msg.fileName || "file"}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 mb-1.5 transition-colors text-left w-full"
                                                    style={{
                                                        background: isOutgoing ? "rgba(255,255,255,0.12)" : "var(--bg-elevated)",
                                                        border: "1px solid " + (isOutgoing ? "rgba(255,255,255,0.08)" : "var(--border)"),
                                                    }}>
                                                    <span className="text-lg">{getFileIcon(msg.fileType)}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-medium truncate"
                                                           style={{ color: isOutgoing ? "white" : "var(--text-primary)" }}>
                                                            {msg.fileName || "File"}
                                                        </p>
                                                        {msg.fileSize > 0 && (
                                                            <p className="text-[9px]"
                                                               style={{ color: isOutgoing ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }}>
                                                                {formatFileSize(msg.fileSize)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Download className="h-3.5 w-3.5 shrink-0" style={{ color: isOutgoing ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }} />
                                                </a>
                                            )
                                        )}

                                        {msg.text && (
                                            <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap break-words">
                                                {msg.text}
                                            </p>
                                        )}
                                    </>
                                )}

                                {!isDeleted && (
                                    <>
                                        <ReactionBar reactions={msg.reactions} isOutgoing={isOutgoing} onToggle={(emoji) => handleReaction(msg._id, emoji)} />

                                        <div className="flex items-center justify-end gap-1 mt-0.5">
                                            {isLegacy && (
                                                <span className="text-[8px]" style={{ color: isOutgoing ? "rgba(255,255,255,0.4)" : "var(--text-muted)" }}>
                                                    legacy
                                                </span>
                                            )}
                                            {msg.editedAt && (
                                                <span className="text-[8px] italic" style={{ color: isOutgoing ? "rgba(255,255,255,0.4)" : "var(--text-muted)" }}>
                                                    edited
                                                </span>
                                            )}
                                            <span className="text-[9px]"
                                                  style={{ color: isOutgoing ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }}>
                                                {formatTime(msg.createdAt)}
                                            </span>
                                            <DeliveryStatus status={msg._status} isOutgoing={isOutgoing} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            <div ref={messagesEndRef} />

            <MediaModal
                mediaUrl={modalMedia.url}
                isVideo={modalMedia.isVideo}
                isOpen={Boolean(modalMedia.url && modalMedia.isVideo)}
                onClose={() => setModalMedia({ url: null, isVideo: false })}
            />

            <ImageViewer
                images={allImageUrls}
                initialIndex={viewerIndex}
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
            />

            {contextMenu && (
                <MessageContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    message={contextMenu.message}
                    isOutgoing={contextMenu.message.senderId === authUser?._id}
                    onClose={() => setContextMenu(null)}
                    onReply={() => {
                        if (onReply) onReply(contextMenu.message);
                        setContextMenu(null);
                    }}
                    onDelete={() => {
                        handleDelete(contextMenu.message._id);
                        setContextMenu(null);
                    }}
                    onRetry={() => retryMessage(contextMenu.message)}
                    onEdit={() => {
                        handleEdit(contextMenu.message);
                        setContextMenu(null);
                    }}
                    onReact={() => {
                        setReactionPickerMsgId(contextMenu.message._id);
                        setContextMenu(null);
                    }}
                />
            )}

            {reactionPickerMsgId && (
                <div className="fixed z-[200]"
                     style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                    <ReactionPicker
                        onSelect={(emoji) => {
                            handleReaction(reactionPickerMsgId, emoji);
                            setReactionPickerMsgId(null);
                        }}
                        onClose={() => setReactionPickerMsgId(null)}
                    />
                </div>
            )}
        </div>
    );
}
