import { useEffect, useRef } from "react";
import { X, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { useChatStore, MessageStatus } from "../../store/useChatStore";

function formatFullDate(timestamp) {
    if (!timestamp) return "";
    const d = new Date(timestamp);
    return d.toLocaleDateString([], { month: "numeric", day: "numeric", year: "numeric" }) +
        " at " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function DeliveryEntry({ icon, label, date, color }) {
    return (
        <div className="flex items-start gap-3 py-3">
            <div className="mt-0.5 shrink-0" style={{ color }}>
                {icon}
            </div>
            <div>
                <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{label}</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {date ? formatFullDate(date) : "—"}
                </p>
            </div>
        </div>
    );
}

export function MessageInfoDrawer({ message, isOutgoing, onClose }) {
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    useEffect(() => {
        if (ref.current) ref.current.focus();
    }, []);

    if (!message) return null;

    const status = message._status || MessageStatus.SENT;
    const isFailed = status === MessageStatus.FAILED;

    const checkIcon = <CheckCheck className="h-4 w-4" />;
    const clockIcon = <Clock className="h-4 w-4" />;
    const failIcon = <AlertCircle className="h-4 w-4" />;

    const statusEntries = [];

    statusEntries.push({
        key: "sent",
        icon: checkIcon,
        label: "Sent",
        date: message.createdAt,
        color: "var(--text-muted)",
    });

    if (message.deliveredAt) {
        statusEntries.push({
            key: "delivered",
            icon: checkIcon,
            label: "Delivered",
            date: message.deliveredAt,
            color: "var(--text-secondary)",
        });
    }

    if (message.readAt) {
        statusEntries.push({
            key: "read",
            icon: checkIcon,
            label: "Read",
            date: message.readAt,
            color: "var(--accent)",
        });
    }

    if (isFailed) {
        statusEntries.push({
            key: "failed",
            icon: failIcon,
            label: "Failed to send",
            date: null,
            color: "var(--danger)",
        });
    }

    if (!message.deliveredAt && !message.readAt && !isFailed && isOutgoing) {
        statusEntries.push({
            key: "waiting",
            icon: clockIcon,
            label: "Waiting to be delivered",
            date: null,
            color: "var(--text-muted)",
        });
    }

    let preview = "";
    if (message.isDeletedForEveryone) {
        preview = "This message was deleted";
    } else if (message.text) {
        preview = message.text;
    } else if (message.encryptedText) {
        preview = "🔒 Encrypted message";
    } else if (message.image) {
        preview = "📷 Photo";
    } else if (message.video) {
        preview = "🎬 Video";
    } else if (message.audio) {
        preview = "🎤 Audio message";
    } else if (message.file) {
        preview = "📎 " + (message.fileName || "File");
    }

    return (
        <div
            ref={ref}
            tabIndex={-1}
            className="flex flex-col h-full outline-none slide-in-right shrink-0"
            style={{
                width: "100%",
                maxWidth: "340px",
                background: "var(--bg-surface)",
                borderLeft: "1px solid var(--border)",
            }}
        >
            {/* Header */}
            <div
                className="flex items-center gap-3 px-4 py-3 shrink-0"
                style={{ borderBottom: "1px solid var(--border)" }}
            >
                <button
                    onClick={onClose}
                    className="flex items-center justify-center h-8 w-8 rounded-full transition-colors shrink-0"
                    style={{ color: "var(--text-primary)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                    <X className="h-4 w-4" />
                </button>
                <h3 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                    Message info
                </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {/* Message preview */}
                {!message.isDeletedForEveryone && preview && (
                    <div
                        className="rounded-lg px-3 py-2.5"
                        style={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border)",
                        }}
                    >
                        <p className="text-[11px] leading-relaxed whitespace-pre-wrap break-words"
                            style={{ color: "var(--text-secondary)" }}>
                            {preview}
                        </p>
                        {message.editedAt && (
                            <p className="text-[9px] italic mt-1" style={{ color: "var(--text-muted)" }}>
                                Edited
                            </p>
                        )}
                    </div>
                )}

                {/* Delivery & read status */}
                {isOutgoing && (
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                            style={{ color: "var(--text-muted)" }}>
                            Delivery status
                        </p>
                        <div className="space-y-0">
                            {statusEntries.map((entry) => (
                                <DeliveryEntry
                                    key={entry.key}
                                    icon={entry.icon}
                                    label={entry.label}
                                    date={entry.date}
                                    color={entry.color}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Timestamps */}
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                        style={{ color: "var(--text-muted)" }}>
                        Details
                    </p>
                    <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Sent</span>
                            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                                {formatFullDate(message.createdAt)}
                            </span>
                        </div>
                        {message.deliveredAt && (
                            <div className="flex justify-between items-center">
                                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Delivered</span>
                                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                                    {formatFullDate(message.deliveredAt)}
                                </span>
                            </div>
                        )}
                        {message.readAt && (
                            <div className="flex justify-between items-center">
                                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Read</span>
                                <span className="text-[11px]" style={{ color: "var(--accent)" }}>
                                    {formatFullDate(message.readAt)}
                                </span>
                            </div>
                        )}
                        {message.isPinned && message.pinnedAt && (
                            <div className="flex justify-between items-center">
                                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Pinned</span>
                                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                                    {formatFullDate(message.pinnedAt)}
                                </span>
                            </div>
                        )}
                        {message.editedAt && (
                            <div className="flex justify-between items-center">
                                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Edited</span>
                                <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                                    {formatFullDate(message.editedAt)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
