import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useTheme } from "../../context/ThemeContext";
import { useFriendStore } from "../../store/useFriendStore";
import { useSoundStore } from "../../store/useSoundStore";
import { X, Volume2, VolumeX, Palette, Image as ImageIcon, ArrowLeft, UserMinus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export function ChatHeader({ onOpenWallpapers }) {
    const selectedUser = useChatStore((state) => state.selectedUser);
    const setSelectedUser = useChatStore((state) => state.setSelectedUser);
    const onlineUsers = useAuthStore((state) => state.onlineUsers);
    const typingUsers = useChatStore((state) => state.typingUsers);
    const { theme, setTheme, themes } = useTheme();
    const { isSoundEnabled, toggleSound } = useSoundStore();
    const removeFriend = useFriendStore((state) => state.removeFriend);
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

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
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl z-20">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>

                <div className="relative">
                    <img
                        src={selectedUser.profilePic || "/favicon.svg"}
                        alt={selectedUser.displayName || selectedUser.username}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-white/15"
                    />
                    <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-slate-900 ${
                            isOnline ? "bg-emerald-500" : "bg-slate-500"
                        }`}
                    />
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">
                        {selectedUser.displayName || selectedUser.username}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400">
                        {isTyping ? (
                            <span className="text-blue-400 italic">typing...</span>
                        ) : isOnline ? (
                            <span className="text-emerald-400 font-semibold">Online</span>
                        ) : (
                            <span>@{selectedUser.username}</span>
                        )}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={toggleSound}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                        isSoundEnabled
                            ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                            : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                    }`}
                    title={isSoundEnabled ? "Keyboard sounds enabled" : "Keyboard sounds muted"}
                >
                    {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>

                <button
                    onClick={onOpenWallpapers}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                    title="Change chat wallpaper"
                >
                    <ImageIcon className="h-4 w-4" />
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowThemeMenu(!showThemeMenu)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                        title="Change color theme"
                    >
                        <Palette className="h-4 w-4" />
                    </button>

                    {showThemeMenu && (
                        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900/95 p-2 shadow-2xl border border-white/15 backdrop-blur-xl z-50">
                            <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                                Choose Theme
                            </div>
                            <div className="max-h-56 overflow-y-auto space-y-1">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => {
                                            setTheme(t.id);
                                            setShowThemeMenu(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                                            theme === t.id
                                                ? "bg-blue-600 text-white"
                                                : "text-slate-300 hover:bg-white/10"
                                        }`}
                                    >
                                        <span>{t.label}</span>
                                        <span
                                            className="h-3 w-3 rounded-full border border-white/20"
                                            style={{ backgroundColor: t.primary }}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                        title="More options"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900/95 p-2 shadow-2xl border border-white/15 backdrop-blur-xl z-50">
                            <button
                                onClick={handleRemoveFriend}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all"
                            >
                                <UserMinus className="h-3.5 w-3.5" />
                                Remove Friend
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedUser(null);
                                    setShowMenu(false);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 transition-all"
                            >
                                <X className="h-3.5 w-3.5" />
                                Close Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
