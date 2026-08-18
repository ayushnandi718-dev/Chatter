import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useFriendStore } from "../../store/useFriendStore";
import { axiosInstance } from "../../lib/axios";
import { ConfirmModal } from "./ConfirmModal";
import {
    X, Phone, Video, Search, Image as ImageIcon, Star, Clock, Shield, Lock,
    Heart, HeartOff, Trash2, Ban, Unlock, Flag, MoreHorizontal, MessageSquare,
    ChevronRight, AlertTriangle, Loader2, Edit3
} from "lucide-react";
import toast from "react-hot-toast";

function Section({ icon, label, sub, count, onClick, danger, color }) {
    return (
        <button
            onClick={onClick}
            className="flex w-full items-center gap-3 px-4 py-3 transition-colors text-left"
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
            <span className="shrink-0" style={{ color: color || (danger ? "var(--danger)" : "var(--text-muted)") }}>
                {icon}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium" style={{ color: danger ? "var(--danger)" : "var(--text-primary)" }}>
                    {label}
                </p>
                {sub && (
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>
                )}
            </div>
            {count !== undefined && (
                <span className="text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>{count}</span>
            )}
            {onClick && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
            )}
        </button>
    );
}

function QuickAction({ icon, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-1.5 shrink-0"
        >
            <div
                className="h-10 w-10 flex items-center justify-center rounded-full transition-colors"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-elevated)"}
            >
                {icon}
            </div>
            <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
        </button>
    );
}

export function ContactInfoPanel({ onClose }) {
    const selectedUser = useChatStore((s) => s.selectedUser);
    const messages = useChatStore((s) => s.messages);
    const blockedUserIds = useChatStore((s) => s.blockedUserIds);
    const blockUser = useChatStore((s) => s.blockUser);
    const unblockUser = useChatStore((s) => s.unblockUser);
    const reportUser = useChatStore((s) => s.reportUser);
    const deleteMessage = useChatStore((s) => s.deleteMessage);
    const onlineUsers = useAuthStore((s) => s.onlineUsers);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmAction, setConfirmAction] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportDesc, setReportDesc] = useState("");
    const panelRef = useRef(null);

    const isOnline = onlineUsers.includes(selectedUser?._id);
    const isBlocked = blockedUserIds.includes(selectedUser?._id);

    useEffect(() => {
        if (!selectedUser?._id) return;
        setLoading(true);
        axiosInstance.get(`/users/profile/${selectedUser._id}`)
            .then((res) => { setProfile(res.data); setLoading(false); })
            .catch(() => { setLoading(false); });
    }, [selectedUser?._id]);

    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    if (!selectedUser) return null;

    const mediaCount = messages.filter((m) => m.image || m.video).length;
    const docCount = messages.filter((m) => m.file).length;
    const totalMedia = mediaCount + docCount;

    const handleClearChat = async () => {
        try {
            const ids = messages.filter((m) => m.senderId === useAuthStore.getState().authUser?._id).map((m) => m._id);
            for (const id of ids) {
                await axiosInstance.delete(`/messages/${id}`, { data: { deleteForEveryone: false } });
            }
            useChatStore.setState((s) => ({
                messages: s.messages.filter((m) => m.senderId !== useAuthStore.getState().authUser?._id),
            }));
            toast.success("Chat cleared");
        } catch {
            toast.error("Failed to clear chat");
        }
    };

    const handleBlock = async () => {
        await blockUser(selectedUser._id);
        toast.success("Contact blocked");
    };

    const handleUnblock = async () => {
        await unblockUser(selectedUser._id);
        toast.success("Contact unblocked");
    };

    const handleReport = async () => {
        if (!reportReason) return;
        await reportUser(selectedUser._id, reportReason, reportDesc);
        setShowReportModal(false);
        setReportReason("");
        setReportDesc("");
        toast.success("Report submitted");
    };

    const handleDeleteChat = async () => {
        try {
            const authUser = useAuthStore.getState().authUser;
            const ids = messages.map((m) => m._id);
            for (const id of ids) {
                const msg = messages.find((m) => m._id === id);
                const isOwn = msg?.senderId === authUser?._id;
                await axiosInstance.delete(`/messages/${id}`, { data: { deleteForEveryone: isOwn } });
            }
            useChatStore.setState({ messages: [] });
            toast.success("Chat deleted");
            onClose();
        } catch {
            toast.error("Failed to delete chat");
        }
    };

    return (
        <div
            ref={panelRef}
            className="flex flex-col h-full shrink-0 slide-in-right fixed inset-0 z-50 md:relative md:inset-auto md:z-auto md:w-[340px] md:max-w-[380px]"
            style={{
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
                <h3 className="text-[13px] font-semibold flex-1" style={{ color: "var(--text-primary)" }}>
                    Contact info
                </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Profile */}
                <div className="flex flex-col items-center py-6 px-4">
                    <img
                        src={selectedUser.profilePic || "/favicon.svg"}
                        alt=""
                        className="h-20 w-20 rounded-full object-cover mb-3"
                    />
                    <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {selectedUser.displayName || selectedUser.username}
                    </h2>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        @{selectedUser.username}
                    </p>
                    {profile?.about && (
                        <p className="text-[10px] mt-1 text-center" style={{ color: "var(--text-secondary)" }}>
                            {profile.about}
                        </p>
                    )}
                </div>

                {/* Quick actions */}
                <div className="flex justify-center gap-8 pb-4 px-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <QuickAction
                        icon={<Phone className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />}
                        label="Voice"
                        onClick={() => toast("Voice calls coming soon")}
                    />
                    <QuickAction
                        icon={<Video className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />}
                        label="Video"
                        onClick={() => toast("Video calls coming soon")}
                    />
                    <QuickAction
                        icon={<Search className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />}
                        label="Search"
                        onClick={() => { onClose(); toast("Search in chat"); }}
                    />
                </div>

                {/* Media, links and docs */}
                <div style={{ borderBottom: "1px solid var(--border)" }}>
                    <Section
                        icon={<ImageIcon className="h-4 w-4" />}
                        label="Media, links and docs"
                        count={totalMedia}
                        onClick={() => {}}
                    />
                </div>

                {/* Starred messages */}
                <div style={{ borderBottom: "1px solid var(--border)" }}>
                    <Section
                        icon={<Star className="h-4 w-4" />}
                        label="Starred messages"
                        count={0}
                        onClick={() => {}}
                    />
                </div>

                {/* Settings section */}
                <div style={{ borderBottom: "1px solid var(--border)" }}>
                    <Section
                        icon={<Lock className="h-4 w-4" style={{ color: "var(--success)" }} />}
                        label="Encryption"
                        sub="Messages are end-to-end encrypted"
                        color="var(--success)"
                        onClick={() => {}}
                    />
                </div>

                {/* Actions */}
                <div className="py-1" style={{ borderBottom: "1px solid var(--border)" }}>
                    <Section
                        icon={isBlocked ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        label={isBlocked ? "Unblock contact" : "Block contact"}
                        danger
                        onClick={() => setConfirmAction(isBlocked ? "unblock" : "block")}
                    />
                    <Section
                        icon={<Flag className="h-4 w-4" />}
                        label="Report contact"
                        color="#f59e0b"
                        onClick={() => setShowReportModal(true)}
                    />
                    <Section
                        icon={<Trash2 className="h-4 w-4" />}
                        label="Delete chat"
                        danger
                        onClick={() => setConfirmAction("deleteChat")}
                    />
                </div>

                {/* Spacer */}
                <div className="h-6" />
            </div>

            {/* Confirm modals */}
            <ConfirmModal
                isOpen={confirmAction === "block"}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleBlock}
                title="Block Contact"
                message={`Block ${selectedUser.displayName || selectedUser.username}? You won't receive messages or calls from this contact.`}
                confirmText="Block"
                cancelText="Cancel"
                variant="danger"
                icon={<Ban className="h-5 w-5" style={{ color: "var(--danger)" }} />}
            />

            <ConfirmModal
                isOpen={confirmAction === "unblock"}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleUnblock}
                title="Unblock Contact"
                message={`Unblock ${selectedUser.displayName || selectedUser.username}?`}
                confirmText="Unblock"
                cancelText="Cancel"
                variant="info"
                icon={<Unlock className="h-5 w-5" style={{ color: "var(--accent)" }} />}
            />

            <ConfirmModal
                isOpen={confirmAction === "clearChat"}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleClearChat}
                title="Clear Chat"
                message="Messages will be removed from your chat history."
                confirmText="Clear"
                cancelText="Cancel"
                variant="warning"
                icon={<AlertTriangle className="h-5 w-5" style={{ color: "var(--warning)" }} />}
            />

            <ConfirmModal
                isOpen={confirmAction === "deleteChat"}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleDeleteChat}
                title="Delete Chat"
                message="This will remove the conversation from your chat list."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                icon={<Trash2 className="h-5 w-5" style={{ color: "var(--danger)" }} />}
            />

            {/* Report modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                    onClick={() => setShowReportModal(false)}>
                    <div className="w-full max-w-sm rounded-2xl p-4"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                        onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                            Report {selectedUser.displayName || selectedUser.username}
                        </h3>
                        <div className="space-y-1.5 mb-3">
                            {["spam", "harassment", "inappropriate content", "other"].map((r) => (
                                <button key={r}
                                    onClick={() => setReportReason(r)}
                                    className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors"
                                    style={{
                                        background: reportReason === r ? "var(--accent-muted)" : "transparent",
                                        color: reportReason === r ? "var(--accent)" : "var(--text-primary)",
                                        border: "1px solid " + (reportReason === r ? "var(--accent)" : "var(--border)"),
                                    }}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </button>
                            ))}
                        </div>
                        <textarea value={reportDesc}
                            onChange={(e) => setReportDesc(e.target.value)}
                            placeholder="Additional details (optional)"
                            className="w-full rounded-lg px-3 py-2 text-[11px] outline-none resize-none mb-3"
                            style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                            rows={3} />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowReportModal(false)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-medium"
                                style={{ color: "var(--text-muted)" }}>
                                Cancel
                            </button>
                            <button onClick={handleReport}
                                disabled={!reportReason}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white disabled:opacity-30"
                                style={{ background: "#f59e0b" }}>
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
