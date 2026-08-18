import { useState, useRef, useEffect } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { Pin, X, ChevronDown, ChevronUp, Image as ImageIcon, FileText } from "lucide-react";

export function PinnedMessageBar() {
    const pinnedMessages = useChatStore((s) => s.pinnedMessages);
    const [expanded, setExpanded] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const barRef = useRef(null);

    useEffect(() => {
        setDismissed(false);
        setExpanded(false);
    }, [pinnedMessages.length]);

    if (!pinnedMessages.length || dismissed) return null;

    const latest = pinnedMessages[0];
    const hasMultiple = pinnedMessages.length > 1;

    const getPreview = (msg) => {
        if (msg.isDeletedForEveryone) return "🚫 Message deleted";
        if (msg.image) return "📷 Image";
        if (msg.video) return "🎥 Video";
        if (msg.audio || msg.file) return "📎 " + (msg.fileName || "Attachment");
        return msg.text || (msg.encryptedText ? "🔒 Encrypted message" : "Message");
    };

    const handleClick = (msg) => {
        setExpanded(false);
        const el = document.getElementById(`msg-${msg._id}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("msg-highlight");
            setTimeout(() => el.classList.remove("msg-highlight"), 1300);
        }
    };

    return (
        <div
            ref={barRef}
            className="shrink-0 border-b"
            style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border)",
            }}
        >
            {/* Collapsed header */}
            <div className="flex items-center gap-2 px-3 py-2">
                <Pin
                    className="h-3 w-3 shrink-0"
                    style={{ color: "var(--accent)", transform: "rotate(45deg)" }}
                />
                <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleClick(latest)}
                >
                    <p
                        className="text-[11px] font-semibold truncate"
                        style={{ color: "var(--accent)" }}
                    >
                        Pinned Message
                    </p>
                    <p
                        className="text-[10px] truncate"
                        style={{ color: "var(--text-muted)" }}
                    >
                        {getPreview(latest)}
                    </p>
                </div>

                {hasMultiple && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium transition-colors"
                        style={{
                            color: "var(--text-muted)",
                            background: "var(--bg-elevated)",
                        }}
                    >
                        {pinnedMessages.length}
                        {expanded ? (
                            <ChevronUp className="h-2.5 w-2.5" />
                        ) : (
                            <ChevronDown className="h-2.5 w-2.5" />
                        )}
                    </button>
                )}

                <button
                    onClick={() => setDismissed(true)}
                    className="p-1 rounded-md transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--bg-hover)")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                    }
                >
                    <X className="h-3 w-3" />
                </button>
            </div>

            {/* Expanded list */}
            {expanded && hasMultiple && (
                <div
                    className="max-h-40 overflow-y-auto border-t"
                    style={{ borderColor: "var(--border)" }}
                >
                    {pinnedMessages.map((msg) => {
                        const sender =
                            msg.senderId === useAuthStore.getState().authUser?._id
                                ? "You"
                                : "";
                        return (
                            <button
                                key={msg._id}
                                onClick={() => handleClick(msg)}
                                className="flex items-start gap-2 w-full px-3 py-2 text-left transition-colors"
                                style={{ borderBottom: "1px solid var(--border)" }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                        "var(--bg-hover)")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = "transparent")
                                }
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        {sender && (
                                            <span
                                                className="text-[10px] font-semibold"
                                                style={{ color: "var(--accent)" }}
                                            >
                                                {sender}:
                                            </span>
                                        )}
                                        <p
                                            className="text-[10px] truncate"
                                            style={{ color: "var(--text-primary)" }}
                                        >
                                            {getPreview(msg)}
                                        </p>
                                    </div>
                                    <p
                                        className="text-[9px] mt-0.5"
                                        style={{ color: "var(--text-muted)" }}
                                    >
                                        {new Date(msg.pinnedAt || msg.createdAt).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                                <ChevronDown
                                    className="h-2.5 w-2.5 mt-0.5 shrink-0"
                                    style={{
                                        color: "var(--text-muted)",
                                        transform: "rotate(-90deg)",
                                    }}
                                />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
