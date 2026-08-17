import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useTheme } from "../../context/ThemeContext";
import { useFriendStore } from "../../store/useFriendStore";
import { useSoundStore } from "../../store/useSoundStore";
import { X, Volume2, VolumeX, Palette, Image as ImageIcon, ArrowLeft, UserMinus, Search, Shield, MoreVertical, Ban, Flag, Unlock } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ChatHeader({ onOpenWallpapers, onOpenSearch, onOpenProfile }) {
    const selectedUser = useChatStore((state) => state.selectedUser);
    const setSelectedUser = useChatStore((state) => state.setSelectedUser);
    const onlineUsers = useAuthStore((state) => state.onlineUsers);
    const typingUsers = useChatStore((state) => state.typingUsers);
    const blockedUserIds = useChatStore((state) => state.blockedUserIds);
    const blockUser = useChatStore((state) => state.blockUser);
    const unblockUser = useChatStore((state) => state.unblockUser);
    const reportUser = useChatStore((state) => state.reportUser);
    const { theme, setTheme, themes } = useTheme();
    const { isSoundEnabled, toggleSound } = useSoundStore();
    const removeFriend = useFriendStore((state) => state.removeFriend);
    const [showMenu, setShowMenu] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportDesc, setReportDesc] = useState("");
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        if (showMenu) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [showMenu]);

    if (!selectedUser) return null;

    const isOnline = onlineUsers.includes(selectedUser._id);
    const isTyping = typingUsers.includes(selectedUser._id);
    const isBlocked = blockedUserIds.includes(selectedUser._id);

    const handleRemoveFriend = async () => {
        if (window.confirm(`Remove ${selectedUser.displayName || selectedUser.username} as a friend?`)) {
            await removeFriend(selectedUser._id);
            setSelectedUser(null);
            setShowMenu(false);
        }
    };

    const handleBlock = async () => {
        if (window.confirm(`Block ${selectedUser.displayName || selectedUser.username}? You won't see their messages and they can't message you.`)) {
            await blockUser(selectedUser._id);
            setShowMenu(false);
        }
    };

    const handleUnblock = async () => {
        await unblockUser(selectedUser._id);
        setShowMenu(false);
    };

    const handleReport = async () => {
        if (!reportReason) return;
        await reportUser(selectedUser._id, reportReason, reportDesc);
        setShowReportModal(false);
        setReportReason("");
        setReportDesc("");
        setShowMenu(false);
    };

    return (
        <div className="flex items-center justify-between px-4 py-2.5 z-20"
             style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-chat)' }}>
            <div className="flex items-center gap-2.5">
                <button onClick={() => setSelectedUser(null)}
                        className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{ color: 'var(--text-secondary)' }}>
                    <ArrowLeft className="h-4.5 w-4.5" />
                </button>

                <div className="relative cursor-pointer" onClick={() => onOpenProfile?.(selectedUser._id)}>
                    <img src={selectedUser.profilePic || "/favicon.svg"}
                         alt=""
                         className="h-8 w-8 rounded-full object-cover transition-opacity hover:opacity-80" />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2"
                          style={{
                              background: isOnline ? 'var(--success)' : '#52525b',
                              ringColor: 'var(--bg-chat)',
                          }} />
                </div>

                <div className="cursor-pointer" onClick={() => onOpenProfile?.(selectedUser._id)}>
                    <h3 className="text-xs font-semibold hover:underline" style={{ color: 'var(--text-primary)' }}>
                        {selectedUser.displayName || selectedUser.username}
                    </h3>
                    <p className="text-[10px] flex items-center gap-1.5">
                        {isTyping ? (
                            <span style={{ color: 'var(--accent)' }}>typing...</span>
                        ) : isOnline ? (
                            <span style={{ color: 'var(--success)' }}>Online</span>
                        ) : (
                            <span style={{ color: 'var(--text-muted)' }}>@{selectedUser.username}</span>
                        )}
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium"
                              style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                            <Shield className="h-2 w-2" />
                            E2EE
                        </span>
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button onClick={toggleSound}
                        className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                        style={{
                            color: isSoundEnabled ? 'var(--accent)' : 'var(--text-muted)',
                            background: isSoundEnabled ? 'var(--accent-muted)' : 'transparent',
                        }}
                        title={isSoundEnabled ? "Sound on" : "Sound off"}>
                    {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>

                <button onClick={onOpenWallpapers}
                        className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        title="Wallpaper">
                    <ImageIcon className="h-4 w-4" />
                </button>

                <div className="relative" ref={menuRef}>
                    <button onClick={() => setShowMenu(!showMenu)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <MoreVertical className="h-3.5 w-3.5" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 mt-1 w-48 rounded-lg py-1 z-50"
                             style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

                            <button onClick={() => { onOpenWallpapers(); setShowMenu(false); }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-medium transition-colors"
                                    style={{ color: 'var(--text-primary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                <ImageIcon className="h-3 w-3" style={{ color: 'var(--accent)' }} />
                                Wallpaper
                            </button>

                            <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />

                            {!isBlocked ? (
                                <>
                                    <button onClick={handleBlock}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-medium transition-colors"
                                            style={{ color: 'var(--danger)' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <Ban className="h-3 w-3" />
                                        Block User
                                    </button>
                                    <button onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-medium transition-colors"
                                            style={{ color: '#f59e0b' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <Flag className="h-3 w-3" />
                                        Report User
                                    </button>
                                </>
                            ) : (
                                <button onClick={handleUnblock}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-medium transition-colors"
                                        style={{ color: 'var(--success)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <Unlock className="h-3 w-3" />
                                    Unblock User
                                </button>
                            )}

                            <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />

                            <button onClick={handleRemoveFriend}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-medium transition-colors"
                                    style={{ color: 'var(--danger)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                <UserMinus className="h-3 w-3" />
                                Remove Friend
                            </button>
                            <button onClick={() => { setSelectedUser(null); setShowMenu(false); }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-medium transition-colors"
                                    style={{ color: 'var(--text-secondary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                <X className="h-3 w-3" />
                                Close Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showReportModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                     style={{ background: 'rgba(0,0,0,0.6)' }}
                     onClick={() => setShowReportModal(false)}>
                    <div className="w-full max-w-sm rounded-xl p-4"
                         style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                         onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            Report {selectedUser.displayName || selectedUser.username}
                        </h3>
                        <div className="space-y-1.5 mb-3">
                            {["spam", "harassment", "inappropriate content", "other"].map((r) => (
                                <button key={r}
                                        onClick={() => setReportReason(r)}
                                        className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors"
                                        style={{
                                            background: reportReason === r ? 'var(--accent-muted)' : 'transparent',
                                            color: reportReason === r ? 'var(--accent)' : 'var(--text-primary)',
                                            border: '1px solid ' + (reportReason === r ? 'var(--accent)' : 'var(--border)'),
                                        }}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </button>
                            ))}
                        </div>
                        <textarea value={reportDesc}
                                  onChange={(e) => setReportDesc(e.target.value)}
                                  placeholder="Additional details (optional)"
                                  className="w-full rounded-lg px-3 py-2 text-[11px] outline-none resize-none mb-3"
                                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                                  rows={3} />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowReportModal(false)}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-medium"
                                    style={{ color: 'var(--text-muted)' }}>
                                Cancel
                            </button>
                            <button onClick={handleReport}
                                    disabled={!reportReason}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white disabled:opacity-30"
                                    style={{ background: '#f59e0b' }}>
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
