import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useTheme } from "../../context/ThemeContext";
import { useFriendStore } from "../../store/useFriendStore";
import { useSoundStore } from "../../store/useSoundStore";
import { X, Volume2, VolumeX, Palette, Image as ImageIcon, ArrowLeft, UserMinus, Search, Shield, MoreVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ChatHeader({ onOpenWallpapers, onOpenSearch }) {
    const selectedUser = useChatStore((state) => state.selectedUser);
    const setSelectedUser = useChatStore((state) => state.setSelectedUser);
    const onlineUsers = useAuthStore((state) => state.onlineUsers);
    const typingUsers = useChatStore((state) => state.typingUsers);
    const { theme, setTheme, themes } = useTheme();
    const { isSoundEnabled, toggleSound } = useSoundStore();
    const removeFriend = useFriendStore((state) => state.removeFriend);
    const [showMenu, setShowMenu] = useState(false);
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

    const handleRemoveFriend = async () => {
        if (window.confirm(`Remove ${selectedUser.displayName || selectedUser.username} as a friend?`)) {
            await removeFriend(selectedUser._id);
            setSelectedUser(null);
            setShowMenu(false);
        }
    };

    return (
        <div className="flex items-center justify-between px-4 py-2.5 z-20"
             style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-chat)' }}>
            <div className="flex items-center gap-2.5">
                <button onClick={() => setSelectedUser(null)}
                        className="md:hidden flex h-7 w-7 items-center justify-center rounded-md"
                        style={{ color: 'var(--text-secondary)' }}>
                    <ArrowLeft className="h-4 w-4" />
                </button>

                <div className="relative">
                    <img src={selectedUser.profilePic || "/favicon.svg"}
                         alt=""
                         className="h-8 w-8 rounded-full object-cover" />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2"
                          style={{
                              background: isOnline ? 'var(--success)' : '#52525b',
                              ringColor: 'var(--bg-chat)',
                          }} />
                </div>

                <div>
                    <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
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

            <div className="flex items-center gap-0.5">
                <button onClick={toggleSound}
                        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                        style={{
                            color: isSoundEnabled ? 'var(--accent)' : 'var(--text-muted)',
                            background: isSoundEnabled ? 'var(--accent-muted)' : 'transparent',
                        }}
                        title={isSoundEnabled ? "Sound on" : "Sound off"}>
                    {isSoundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                </button>

                <button onClick={onOpenWallpapers}
                        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        title="Wallpaper">
                    <ImageIcon className="h-3.5 w-3.5" />
                </button>

                <div className="relative" ref={menuRef}>
                    <button onClick={() => setShowMenu(!showMenu)}
                            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <MoreVertical className="h-3.5 w-3.5" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 mt-1 w-44 rounded-lg py-1 z-50"
                             style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                            <button onClick={handleRemoveFriend}
                                    className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] font-medium transition-colors"
                                    style={{ color: 'var(--danger)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                <UserMinus className="h-3 w-3" />
                                Remove Friend
                            </button>
                            <button onClick={() => { setSelectedUser(null); setShowMenu(false); }}
                                    className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] font-medium transition-colors"
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
        </div>
    );
}
