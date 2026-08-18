import { X, Image, Video, Mic, FileText } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

function getReplyContentPreview(replyTo) {
    if (replyTo.isDeletedForEveryone) return { icon: null, text: "This message was deleted" };
    if (replyTo.image) return { icon: <Image className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} />, text: "Photo" };
    if (replyTo.video) return { icon: <Video className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} />, text: "Video" };
    if (replyTo.audio) return { icon: <Mic className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} />, text: "Audio" };
    if (replyTo.file) return { icon: <FileText className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} />, text: replyTo.fileName || "File" };
    if (replyTo.text) return { icon: null, text: replyTo.text };
    if (replyTo.encryptedText) return { icon: null, text: "Encrypted message" };
    return { icon: null, text: "Message" };
}

export function ReplyPreview({ replyingTo, senderName, onCancel }) {
    if (!replyingTo) return null;

    const authUser = useAuthStore.getState().authUser;
    const isOwn = replyingTo.senderId === authUser?._id;
    const displayName = isOwn ? "You" : senderName;
    const { icon, text } = getReplyContentPreview(replyingTo);

    return (
        <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-t-lg reply-preview-enter"
            style={{
                background: "var(--bg-surface)",
                borderLeft: "3px solid var(--accent)",
                borderBottom: "1px solid var(--border)",
            }}
        >
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold" style={{ color: "var(--accent)" }}>
                    {displayName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {icon}
                    <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                        {text}
                    </p>
                </div>
            </div>
            <button
                onClick={onCancel}
                className="h-6 w-6 flex items-center justify-center rounded-full shrink-0 transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
