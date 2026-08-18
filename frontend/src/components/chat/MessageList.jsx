import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore, MessageStatus } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useCryptoStore } from "../../store/useCryptoStore";
import { MediaModal } from "./MediaModal";
import { ImageViewer } from "./ImageViewer";
import { Loader2, Download, Check, CheckCheck, AlertCircle, Reply, Copy, Trash2, RotateCcw, Pencil, Pin, Info } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";
import { PromptModal } from "./PromptModal";

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
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);
    return (
        <div ref={ref}
            className="absolute bottom-full mb-1 flex gap-0.5 rounded-full px-2 py-1 z-[150]"
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

function HoverBar({ isOutgoing, onReact, onReply, onMore }) {
    const ref = useRef(null);
    const [barPos, setBarPos] = useState({ top: true });

    useEffect(() => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setBarPos({ top: rect.top > 40 });
        }
    }, []);

    const btnStyle = {
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
    };

    return (
        <div ref={ref}
            className="absolute z-[100] flex items-center gap-[3px] rounded-full px-[5px] py-[3px]"
            style={{
                [barPos.top ? "bottom" : "top"]: "100%",
                [isOutgoing ? "right" : "left"]: 0,
                marginBottom: barPos.top ? "4px" : undefined,
                marginTop: !barPos.top ? "4px" : undefined,
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <button
                onClick={(e) => { e.stopPropagation(); onReact(); }}
                className="flex items-center justify-center h-[28px] w-[28px] rounded-full text-[14px] transition-all hover:scale-110"
                style={btnStyle}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = btnStyle.background}
            >😊</button>
            <button
                onClick={(e) => { e.stopPropagation(); onReply(); }}
                className="flex items-center justify-center h-[28px] w-[28px] rounded-full transition-all hover:scale-110"
                style={btnStyle}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = btnStyle.background}
            >
                <Reply className="h-[14px] w-[14px]" style={{ color: "var(--text-primary)" }} />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onMore(); }}
                className="flex items-center justify-center h-[28px] w-[28px] rounded-full transition-all hover:scale-110"
                style={btnStyle}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = btnStyle.background}
            >
                <span className="text-[14px] font-bold leading-none" style={{ color: "var(--text-primary)" }}>⋮</span>
            </button>
        </div>
    );
}

function FloatingMenu({ message, isOutgoing, onClose, onReply, onReact, onPin, onEdit, onDelete, onDeleteForEveryone, onRetry }) {
    const ref = useRef(null);
    const [pos, setPos] = useState({ top: false, right: isOutgoing });
    const [showDeleteSub, setShowDeleteSub] = useState(false);

    useEffect(() => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const spaceAbove = rect.top;
            const spaceBelow = window.innerHeight - rect.bottom;
            setPos({
                top: spaceAbove < rect.height + 8 && spaceBelow > spaceAbove,
                right: isOutgoing,
            });
        }
    }, [isOutgoing]);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    const handleCopy = () => {
        if (message.text) {
            navigator.clipboard.writeText(message.text).then(() => toast.success("Copied"));
        }
        onClose();
    };

    const menuStyle = {
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    };

    const itemBase = "flex w-full items-center gap-2.5 px-3 py-[9px] text-[12px] transition-colors";
    const itemColor = { color: "var(--text-primary)" };
    const itemHover = (e) => e.currentTarget.style.background = "var(--bg-hover)";
    const itemLeave = (e) => e.currentTarget.style.background = "transparent";

    const menuItems = [];

    menuItems.push(
        <button key="reply" onClick={() => { onReply(); onClose(); }}
            className={itemBase} style={itemColor}
            onMouseEnter={itemHover} onMouseLeave={itemLeave}>
            <Reply className="h-[13px] w-[13px]" style={{ color: "var(--accent)" }} />
            Reply
        </button>
    );

    menuItems.push(
        <button key="react" onClick={() => { onReact(); onClose(); }}
            className={itemBase} style={itemColor}
            onMouseEnter={itemHover} onMouseLeave={itemLeave}>
            <span className="text-[13px]">😊</span>
            React
        </button>
    );

    if (isOutgoing && !message.isDeletedForEveryone) {
        menuItems.push(
            <button key="pin" onClick={() => { onPin(); onClose(); }}
                className={itemBase} style={itemColor}
                onMouseEnter={itemHover} onMouseLeave={itemLeave}>
                <Pin className="h-[13px] w-[13px]" style={{ color: "var(--accent)" }} />
                {message.isPinned ? "Unpin" : "Pin"}
            </button>
        );
    }

    if (message.text) {
        menuItems.push(
            <button key="copy" onClick={() => { handleCopy(); }}
                className={itemBase} style={itemColor}
                onMouseEnter={itemHover} onMouseLeave={itemLeave}>
                <Copy className="h-[13px] w-[13px]" style={{ color: "var(--accent)" }} />
                Copy
            </button>
        );
    }

    if (isOutgoing && !message.isDeletedForEveryone && message.text) {
        menuItems.push(
            <button key="edit" onClick={() => { onEdit(); onClose(); }}
                className={itemBase} style={itemColor}
                onMouseEnter={itemHover} onMouseLeave={itemLeave}>
                <Pencil className="h-[13px] w-[13px]" style={{ color: "var(--accent)" }} />
                Edit
            </button>
        );
    }

    if (isOutgoing && message._status === MessageStatus.FAILED) {
        menuItems.push(
            <button key="retry" onClick={() => { onRetry(); onClose(); }}
                className={itemBase} style={{ color: "var(--accent)" }}
                onMouseEnter={itemHover} onMouseLeave={itemLeave}>
                <RotateCcw className="h-[13px] w-[13px]" />
                Retry
            </button>
        );
    }

    menuItems.push(
        <button key="info" onClick={onClose}
            className={itemBase} style={itemColor}
            onMouseEnter={itemHover} onMouseLeave={itemLeave}>
            <Info className="h-[13px] w-[13px]" style={{ color: "var(--accent)" }} />
            Message info
        </button>
    );

    menuItems.push(<div key="sep" style={{ borderTop: "1px solid var(--border)", margin: "3px 0" }} />);

    if (showDeleteSub) {
        menuItems.push(
            <button key="del-back" onClick={() => setShowDeleteSub(false)}
                className={itemBase} style={itemColor}
                onMouseEnter={itemHover} onMouseLeave={itemLeave}>
                <span className="text-[13px]">←</span>
                Back
            </button>
        );
        if (isOutgoing) {
            menuItems.push(
                <button key="del-me" onClick={() => { onDelete(); onClose(); }}
                    className={itemBase} style={{ color: "var(--danger)" }}
                    onMouseEnter={itemHover} onMouseLeave={itemLeave}>
                    <Trash2 className="h-[13px] w-[13px]" />
                    Delete for me
                </button>
            );
            menuItems.push(
                <button key="del-all" onClick={() => { onDeleteForEveryone(); onClose(); }}
                    className={itemBase} style={{ color: "var(--danger)" }}
                    onMouseEnter={itemHover} onMouseLeave={itemLeave}>
                    <Trash2 className="h-[13px] w-[13px]" />
                    Delete for everyone
                </button>
            );
        } else {
            menuItems.push(
                <button key="del-me" onClick={() => { onDelete(); onClose(); }}
                    className={itemBase} style={{ color: "var(--danger)" }}
                    onMouseEnter={itemHover} onMouseLeave={itemLeave}>
                    <Trash2 className="h-[13px] w-[13px]" />
                    Delete for me
                </button>
            );
        }
    } else {
        menuItems.push(
            <button key="delete" onClick={() => setShowDeleteSub(true)}
                className={itemBase} style={{ color: "var(--danger)" }}
                onMouseEnter={itemHover} onMouseLeave={itemLeave}>
                <Trash2 className="h-[13px] w-[13px]" />
                Delete
                <span className="ml-auto text-[10px] opacity-50">›</span>
            </button>
        );
    }

    return (
        <div ref={ref}
            className="absolute z-[200] w-[180px] rounded-xl py-1 overflow-hidden"
            style={{
                [pos.top ? "bottom" : "top"]: "100%",
                [pos.right ? "right" : "left"]: 0,
                marginBottom: pos.top ? "6px" : undefined,
                marginTop: !pos.top ? "6px" : undefined,
                ...menuStyle,
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {menuItems}
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
                <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{preview}</p>
            </div>
            <button onClick={onCancel}
                className="h-5 w-5 flex items-center justify-center rounded-full shrink-0"
                style={{ color: "var(--text-muted)" }}>✕</button>
        </div>
    );
}

export function MessageList({ onReply }) {
    const messages = useChatStore((s) => s.messages);
    const isMessagesLoading = useChatStore((s) => s.isMessagesLoading);
    const retryMessage = useChatStore((s) => s.retryMessage);
    const deleteMessage = useChatStore((s) => s.deleteMessage);
    const authUser = useAuthStore((s) => s.authUser);

    const [modalMedia, setModalMedia] = useState({ url: null, isVideo: false });
    const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);
    const [editMessage, setEditMessage] = useState(null);
    const [hoveredMsgId, setHoveredMsgId] = useState(null);
    const [floatingMenuMsgId, setFloatingMenuMsgId] = useState(null);

    const hoverTimeoutRef = useRef(null);
    const bubbleRefs = useRef({});
    const lastTapRef = useRef(null);
    const tapTimerRef = useRef(null);

    const messagesEndRef = useRef(null);

    const allImageUrls = messages.map((m) => m.image).filter(Boolean);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const clearHoverTimeout = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    }, []);

    const startHoverTimeout = useCallback(() => {
        clearHoverTimeout();
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredMsgId(null);
            hoverTimeoutRef.current = null;
        }, 400);
    }, [clearHoverTimeout]);

    const handleMouseEnter = useCallback((msgId) => {
        clearHoverTimeout();
        setHoveredMsgId(msgId);
    }, [clearHoverTimeout]);

    const handleMouseLeave = useCallback(() => {
        startHoverTimeout();
    }, [startHoverTimeout]);

    useEffect(() => {
        const handler = (e) => {
            const target = e.target;
            const insideAnyMsg = target.closest?.("[data-msg-id]");
            const insideAnyMenu = target.closest?.("[data-float-menu]");
            if (!insideAnyMsg && !insideAnyMenu) {
                setFloatingMenuMsgId(null);
                setHoveredMsgId(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleTouchEnd = useCallback((e, msgId) => {
        const now = Date.now();
        if (lastTapRef.current && now - lastTapRef.current < 300 && lastTapRef.currentId === msgId) {
            e.preventDefault();
            setHoveredMsgId(msgId);
            if (tapTimerRef.current) { clearTimeout(tapTimerRef.current); tapTimerRef.current = null; }
        } else {
            lastTapRef.current = now;
            lastTapRef.currentId = msgId;
        }
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
        deleteMessage(messageId, false);
    }, [messages, authUser, deleteMessage]);

    const handleDeleteForEveryone = useCallback((messageId) => {
        deleteMessage(messageId, true);
    }, [deleteMessage]);

    const handleEdit = useCallback((message) => {
        setEditMessage(message);
    }, []);

    const handleEditConfirm = useCallback(async (newText) => {
        if (!editMessage) return;
        try {
            const payload = { text: newText };
            if (editMessage.encryptedText && editMessage.iv && editMessage.receiverId) {
                const crypto = useCryptoStore.getState();
                const encrypted = await crypto.encryptOutgoing(
                    newText, editMessage.receiverId, editMessage.senderId
                );
                if (encrypted) {
                    payload.text = "";
                    payload.encryptedText = encrypted.encryptedText;
                    payload.iv = encrypted.iv;
                    payload.protocolVersion = encrypted.protocolVersion;
                }
            }
            await axiosInstance.patch(`/messages/${editMessage._id}`, payload);
            toast.success("Message edited");
            setEditMessage(null);
        } catch {
            toast.error("Failed to edit message");
        }
    }, [editMessage]);

    const handlePin = useCallback(async (messageId) => {
        try {
            const res = await axiosInstance.post(`/messages/${messageId}/pin`);
            const { isPinned, pinnedAt } = res.data;
            toast.success(isPinned ? "Message pinned" : "Message unpinned");
            useChatStore.setState((state) => {
                const updatedMessages = state.messages.map((m) =>
                    m._id === messageId ? { ...m, isPinned, pinnedAt } : m
                );
                const updatedPinned = isPinned
                    ? [...state.pinnedMessages.filter((m) => m._id !== messageId),
                       updatedMessages.find((m) => m._id === messageId)].filter(Boolean)
                    : state.pinnedMessages.filter((m) => m._id !== messageId);
                return { messages: updatedMessages, pinnedMessages: updatedPinned };
            });
        } catch {
            toast.error("Failed to pin message");
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
                const isHovered = hoveredMsgId === msg._id;
                const isMenuOpen = floatingMenuMsgId === msg._id;

                return (
                    <div key={msg._id} id={`msg-${msg._id}`}>
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
                                data-msg-id={msg._id}
                                className="group relative max-w-[80%] select-none"
                                onMouseEnter={() => handleMouseEnter(msg._id)}
                                onMouseLeave={handleMouseLeave}
                                onTouchEnd={(e) => !isDeleted && handleTouchEnd(e, msg._id)}
                            >
                                {/* Floating hover bar — only on hover, not when menu is open */}
                                {!isDeleted && (isHovered || isMenuOpen) && !isMenuOpen && (
                                    <HoverBar
                                        isOutgoing={isOutgoing}
                                        onReact={() => setReactionPickerMsgId(msg._id)}
                                        onReply={() => { if (onReply) onReply(msg); }}
                                        onMore={() => setFloatingMenuMsgId(msg._id)}
                                    />
                                )}

                                {/* WhatsApp-style floating menu — anchored to bubble */}
                                {!isDeleted && isMenuOpen && (
                                    <div data-float-menu>
                                        <FloatingMenu
                                            message={msg}
                                            isOutgoing={isOutgoing}
                                            onClose={() => setFloatingMenuMsgId(null)}
                                            onReply={() => { if (onReply) onReply(msg); }}
                                            onReact={() => setReactionPickerMsgId(msg._id)}
                                            onPin={() => handlePin(msg._id)}
                                            onEdit={() => handleEdit(msg)}
                                            onDelete={() => handleDelete(msg._id)}
                                            onDeleteForEveryone={() => handleDeleteForEveryone(msg._id)}
                                            onRetry={() => retryMessage(msg)}
                                        />
                                    </div>
                                )}

                                {/* Reaction picker — anchored to bottom of bubble */}
                                {reactionPickerMsgId === msg._id && (
                                    <ReactionPicker
                                        onSelect={(emoji) => {
                                            handleReaction(msg._id, emoji);
                                            setReactionPickerMsgId(null);
                                        }}
                                        onClose={() => setReactionPickerMsgId(null)}
                                    />
                                )}

                                {/* Message bubble */}
                                <div
                                    className="px-3 py-2"
                                    style={{
                                        background: isFailed ? "rgba(239,68,68,0.15)" : isDeleted ? "var(--bg-elevated)" : isOutgoing ? "var(--accent)" : "var(--bg-surface)",
                                        color: isFailed ? "var(--danger)" : isDeleted ? "var(--text-muted)" : isOutgoing ? "white" : "var(--text-primary)",
                                        borderRadius: isOutgoing ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                                        border: isFailed ? "1px solid rgba(239,68,68,0.3)" : isDeleted ? "1px solid var(--border)" : "none",
                                        opacity: msg._status === MessageStatus.SENDING ? 0.7 : 1,
                                    }}
                                    onContextMenu={(e) => {
                                        if (!isDeleted) {
                                            e.preventDefault();
                                            setFloatingMenuMsgId(msg._id);
                                        }
                                    }}
                                >
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
                                                        const i = allImageUrls.indexOf(msg.image);
                                                        setViewerIndex(i >= 0 ? i : 0);
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
                                                    <button onClick={() => { setViewerIndex(0); setViewerOpen(true); }}
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
                                                        <Download className="h-3.5 w-3.5 shrink-0"
                                                            style={{ color: isOutgoing ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }} />
                                                    </button>
                                                ) : (
                                                    <a href={msg.file} download={msg.fileName || "file"} target="_blank" rel="noopener noreferrer"
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
                                                        <Download className="h-3.5 w-3.5 shrink-0"
                                                            style={{ color: isOutgoing ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }} />
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
                                </div>

                                {/* Reactions + timestamp — outside bubble */}
                                {!isDeleted && (
                                    <>
                                        <ReactionBar reactions={msg.reactions} isOutgoing={isOutgoing}
                                            onToggle={(emoji) => handleReaction(msg._id, emoji)} />
                                        <div className="flex items-center justify-end gap-1 mt-0.5">
                                            {isLegacy && (
                                                <span className="text-[8px]"
                                                    style={{ color: isOutgoing ? "rgba(255,255,255,0.4)" : "var(--text-muted)" }}>
                                                    legacy
                                                </span>
                                            )}
                                            {msg.editedAt && (
                                                <span className="text-[8px] italic"
                                                    style={{ color: isOutgoing ? "rgba(255,255,255,0.4)" : "var(--text-muted)" }}>
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

            <PromptModal
                isOpen={!!editMessage}
                onClose={() => setEditMessage(null)}
                onConfirm={handleEditConfirm}
                title="Edit Message"
                defaultValue={editMessage?.text || ""}
                placeholder="Type your message..."
                confirmText="Save"
                maxLength={500}
                icon={<Pencil className="h-5 w-5" style={{ color: "var(--accent)" }} />}
            />
        </div>
    );
}
