import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { useSoundStore } from "../../store/useSoundStore";
import { useCryptoStore } from "../../store/useCryptoStore";
import { usePreferencesStore } from "../../store/usePreferencesStore";
import { useTheme } from "../../context/ThemeContext";
import { axiosInstance } from "../../lib/axios";
import { X, User, Shield, Palette, Volume2, Lock, Info, ChevronRight, ChevronLeft, UserX, RefreshCw, MessageSquare, Globe } from "lucide-react";
import toast from "react-hot-toast";

const THEMES = [
    { id: "dark", label: "Dark", icon: "\u{1F319}" },
    { id: "light", label: "Light", icon: "\u{2600}\u{FE0F}" },
    { id: "system", label: "System", icon: "\u{1F4BB}" },
];

function SettingRow({ label, description, children }) {
    return (
        <div className="flex items-center justify-between py-2.5">
            <div className="flex-1 min-w-0 mr-4">
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {label}
                </p>
                {description && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {description}
                    </p>
                )}
            </div>
            {children}
        </div>
    );
}

function Toggle({ checked, onChange, disabled }) {
    return (
        <button
            onClick={onChange}
            disabled={disabled}
            className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50"
            style={{ background: checked ? 'var(--accent)' : 'var(--bg-elevated)' }}
        >
            <span
                className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform"
                style={{ transform: checked ? 'translateX(17px)' : 'translateX(2px)' }}
            />
        </button>
    );
}

function SectionHeader({ icon: Icon, title }) {
    return (
        <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
            <Icon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
            <h3 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {title}
            </h3>
        </div>
    );
}

function BlockedUserCard({ user, onReconnect, onUnblock }) {
    const isPending = user.reconnectStatus === "pending";

    return (
        <div className="flex items-center gap-3 py-2.5"
             style={{ borderBottom: '1px solid var(--border)' }}>
            <img
                src={user.profilePic || "/favicon.svg"}
                alt=""
                className="h-9 w-9 rounded-full object-cover shrink-0"
                style={{ border: '1px solid var(--border)' }}
            />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {user.displayName || user.username}
                </p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                    @{user.username}
                </p>
                {isPending && (
                    <p className="text-[9px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                        <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                        Reconnect request sent
                    </p>
                )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <button
                    onClick={() => onReconnect(user._id)}
                    disabled={isPending}
                    className="rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors disabled:opacity-50"
                    style={{
                        background: isPending ? 'var(--bg-elevated)' : 'var(--accent-muted)',
                        color: isPending ? 'var(--text-muted)' : 'var(--accent)',
                        border: isPending ? '1px solid var(--border)' : '1px solid transparent',
                    }}
                    title={isPending ? "Request already sent" : "Request to Reconnect"}
                >
                    {isPending ? "Sent" : "Reconnect"}
                </button>
                <button
                    onClick={() => onUnblock(user._id, user.displayName || user.username)}
                    className="rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors"
                    style={{ color: 'var(--danger)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Remove block"
                >
                    <UserX className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
}

export function SettingsPanel({ isOpen, onClose, onOpenWallpapers }) {
    const authUser = useAuthStore((state) => state.authUser);
    const setAuthUser = useAuthStore((state) => state.setAuthUser);
    const blockedUsers = useChatStore((state) => state.blockedUsers);
    const blockedUserIds = useChatStore((state) => state.blockedUserIds);
    const fetchBlockedUsers = useChatStore((state) => state.fetchBlockedUsers);
    const sendReconnectRequest = useChatStore((state) => state.sendReconnectRequest);
    const unblockUser = useChatStore((state) => state.unblockUser);
    const { theme, setTheme } = useTheme();
    const isSoundEnabled = useSoundStore((state) => state.isSoundEnabled);
    const toggleSound = useSoundStore((state) => state.toggleSound);
    const typingSounds = useSoundStore((state) => state.typingSounds);
    const setTypingSounds = useSoundStore((state) => state.setTypingSounds);
    const cryptoState = useCryptoStore((state) => state.cryptoState);
    const identityFingerprint = useCryptoStore((state) => state.identityFingerprint);
    const userPrefs = usePreferencesStore((state) => state.userPrefs);
    const fetchUserPreferences = usePreferencesStore((state) => state.fetchUserPreferences);
    const updateUserPreferences = usePreferencesStore((state) => state.updateUserPreferences);

    const [displayName, setDisplayName] = useState(authUser?.displayName || "");
    const [about, setAbout] = useState(authUser?.about || "");
    const [isSaving, setIsSaving] = useState(false);
    const [showBlockedUsers, setShowBlockedUsers] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setDisplayName(authUser?.displayName || "");
            setAbout(authUser?.about || "");
            fetchBlockedUsers();
            fetchUserPreferences();
        }
    }, [isOpen, authUser, fetchBlockedUsers, fetchUserPreferences]);

    const handleSaveProfile = async () => {
        if (!displayName.trim()) {
            toast.error("Display name cannot be empty");
            return;
        }
        setIsSaving(true);
        try {
            const [nameRes, aboutRes] = await Promise.all([
                axiosInstance.put("/users/display-name", { displayName: displayName.trim() }),
                axiosInstance.put("/users/about", { about: about.trim() }),
            ]);
            setAuthUser({ ...authUser, ...nameRes.data, ...aboutRes.data });
            toast.success("Profile updated");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAboutBlur = async () => {
        try {
            const res = await axiosInstance.put("/users/about", { about: about.trim() });
            setAuthUser({ ...authUser, ...res.data });
        } catch {
            // silent
        }
    };

    const handleTogglePref = async (key, value) => {
        try {
            await updateUserPreferences({ [key]: value });
        } catch {
            toast.error("Failed to update setting");
        }
    };

    const handleReconnect = async (userId) => {
        try {
            await sendReconnectRequest(userId);
            await fetchBlockedUsers();
        } catch {
            // toast already shown
        }
    };

    const handleUnblock = (userId, name) => {
        if (window.confirm(`Remove block on ${name}? This will also remove any pending reconnect requests.`)) {
            unblockUser(userId);
        }
    };

    const formatFingerprint = (fp) => {
        if (!fp) return "Generating...";
        return fp.match(/.{1,4}/g)?.join(" ") || fp;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end"
             onClick={onClose}>
            <div className="absolute inset-0 transition-opacity"
                 style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />

            <div
                className="relative h-full w-full sm:w-96 flex flex-col overflow-hidden"
                style={{
                    background: 'var(--bg-surface)',
                    borderLeft: '1px solid var(--border)',
                    animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 shrink-0"
                     style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                        {showBlockedUsers && (
                            <button onClick={() => setShowBlockedUsers(false)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                                    style={{ color: 'var(--text-muted)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                        )}
                        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {showBlockedUsers ? "Blocked Users" : "Settings"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                    {showBlockedUsers ? (
                        <div className="space-y-3">
                            {blockedUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="h-12 w-12 rounded-full flex items-center justify-center mb-3"
                                         style={{ background: 'var(--bg-elevated)' }}>
                                        <UserX className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                                        No blocked users
                                    </p>
                                    <p className="text-[10px] mt-1 max-w-[200px]" style={{ color: 'var(--text-muted)' }}>
                                        Users you block will appear here. You can send a reconnect request later.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                        Blocked users cannot message you. You can send a reconnect request, but they must accept before you can chat again.
                                    </p>
                                    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                                        <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                                            <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                                {blockedUserIds.length} user{blockedUserIds.length !== 1 ? "s" : ""} blocked
                                            </p>
                                        </div>
                                        <div className="px-3">
                                            {blockedUsers.map((user) => (
                                                <BlockedUserCard
                                                    key={user._id}
                                                    user={user}
                                                    onReconnect={handleReconnect}
                                                    onUnblock={handleUnblock}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Profile */}
                            <SectionHeader icon={User} title="Profile" />
                            <div className="rounded-xl p-3 space-y-3" style={{ background: 'var(--bg-elevated)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img
                                            src={authUser?.profilePic || "/favicon.svg"}
                                            alt=""
                                            className="h-14 w-14 rounded-full object-cover"
                                            style={{ border: '2px solid var(--border)' }}
                                        />
                                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center"
                                             style={{ background: 'var(--bg-elevated)' }}>
                                            <User className="h-2.5 w-2.5" style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                            @{authUser?.username || "username"}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-medium mb-1 block"
                                           style={{ color: 'var(--text-muted)' }}>
                                        Display Name
                                    </label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                                        style={{
                                            background: 'var(--bg-surface)',
                                            color: 'var(--text-primary)',
                                            border: '1px solid var(--border)',
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-medium mb-1 block"
                                           style={{ color: 'var(--text-muted)' }}>
                                        About
                                        <span className="ml-1 font-normal">
                                            ({about.length}/120)
                                        </span>
                                    </label>
                                    <textarea
                                        value={about}
                                        onChange={(e) => setAbout(e.target.value.slice(0, 120))}
                                        onBlur={handleAboutBlur}
                                        placeholder="What's on your mind?"
                                        rows={2}
                                        className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none"
                                        style={{
                                            background: 'var(--bg-surface)',
                                            color: 'var(--text-primary)',
                                            border: '1px solid var(--border)',
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                    />
                                </div>

                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving || (displayName.trim() === (authUser?.displayName || "") && about.trim() === (authUser?.about || ""))}
                                    className="w-full rounded-lg py-2 text-[11px] font-semibold text-white transition-colors disabled:opacity-40"
                                    style={{ background: 'var(--accent)' }}
                                    onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--accent-hover)'; }}
                                    onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--accent)'; }}
                                >
                                    {isSaving ? "Saving..." : "Save Profile"}
                                </button>
                            </div>

                            {/* Appearance */}
                            <SectionHeader icon={Palette} title="Appearance" />
                            <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-elevated)' }}>
                                <div className="flex gap-2">
                                    {THEMES.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTheme(t.id)}
                                            className="flex-1 flex flex-col items-center gap-1.5 rounded-lg py-2.5 transition-all"
                                            style={{
                                                background: theme === t.id ? 'var(--accent-muted)' : 'var(--bg-surface)',
                                                border: theme === t.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                                            }}
                                        >
                                            <span className="text-base">{t.icon}</span>
                                            <span className="text-[10px] font-medium"
                                                  style={{ color: theme === t.id ? 'var(--accent)' : 'var(--text-secondary)' }}>
                                                {t.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={onOpenWallpapers}
                                    className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors"
                                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
                                >
                                    <div className="flex items-center gap-2">
                                        <Palette className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                                            Chat Wallpaper
                                        </span>
                                    </div>
                                    <ChevronRight className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                                </button>
                            </div>

                            {/* Privacy & Security */}
                            <SectionHeader icon={Shield} title="Privacy & Security" />
                            <div className="rounded-xl p-3 divide-y" style={{ background: 'var(--bg-elevated)', divideColor: 'var(--border)' }}>
                                <SettingRow label="Online Status" description="Show when you're active">
                                    <Toggle
                                        checked={userPrefs.showOnlineStatus}
                                        onChange={() => handleTogglePref("showOnlineStatus", !userPrefs.showOnlineStatus)}
                                    />
                                </SettingRow>
                                <SettingRow label="Read Receipts" description="Show when you've read messages">
                                    <Toggle
                                        checked={userPrefs.readReceipts}
                                        onChange={() => handleTogglePref("readReceipts", !userPrefs.readReceipts)}
                                    />
                                </SettingRow>
                                <SettingRow label="Profile Photo" description="Visible to other users">
                                    <Toggle
                                        checked={userPrefs.showProfilePhoto}
                                        onChange={() => handleTogglePref("showProfilePhoto", !userPrefs.showProfilePhoto)}
                                    />
                                </SettingRow>
                                <button
                                    onClick={() => setShowBlockedUsers(true)}
                                    className="w-full flex items-center justify-between py-2.5 transition-colors rounded-lg -mx-1 px-1"
                                    style={{ color: 'var(--text-primary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div>
                                        <p className="text-xs font-medium">Blocked Users</p>
                                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                            {blockedUserIds.length} user{blockedUserIds.length !== 1 ? "s" : ""} blocked
                                        </p>
                                    </div>
                                    <ChevronRight className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                                </button>
                            </div>

                            {/* Sound */}
                            <SectionHeader icon={Volume2} title="Sound" />
                            <div className="rounded-xl p-3 divide-y" style={{ background: 'var(--bg-elevated)', divideColor: 'var(--border)' }}>
                                <SettingRow label="Message Sounds" description="Play sounds for new messages">
                                    <Toggle
                                        checked={userPrefs.messageSounds}
                                        onChange={() => {
                                            handleTogglePref("messageSounds", !userPrefs.messageSounds);
                                            toggleSound();
                                        }}
                                    />
                                </SettingRow>
                                <SettingRow label="Typing Sounds" description="Keystroke feedback sounds">
                                    <Toggle
                                        checked={userPrefs.typingSounds}
                                        onChange={() => {
                                            const next = !userPrefs.typingSounds;
                                            handleTogglePref("typingSounds", next);
                                            setTypingSounds(next);
                                        }}
                                    />
                                </SettingRow>
                            </div>

                            {/* Encryption */}
                            <SectionHeader icon={Lock} title="Encryption" />
                            <div className="rounded-xl p-3 space-y-2.5" style={{ background: 'var(--bg-elevated)' }}>
                                <div className="flex items-center gap-2.5">
                                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                                         style={{ background: cryptoState === "ENCRYPTED" ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }}>
                                        <Lock className="h-4 w-4" style={{ color: cryptoState === "ENCRYPTED" ? 'var(--success)' : 'var(--danger)' }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium"
                                           style={{ color: cryptoState === "ENCRYPTED" ? 'var(--success)' : 'var(--danger)' }}>
                                            {cryptoState === "ENCRYPTED" ? "Active" : "Setup Required"}
                                        </p>
                                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                            {cryptoState === "ENCRYPTED"
                                                ? "Messages are end-to-end encrypted"
                                                : "Encryption is being configured"}
                                        </p>
                                    </div>
                                </div>

                                {identityFingerprint && (
                                    <div className="rounded-lg p-2.5" style={{ background: 'var(--bg-surface)' }}>
                                        <p className="text-[9px] font-medium uppercase tracking-wider mb-1"
                                           style={{ color: 'var(--text-muted)' }}>
                                            Your Fingerprint
                                        </p>
                                        <p className="text-[11px] font-mono break-all leading-relaxed"
                                           style={{ color: 'var(--text-secondary)' }}>
                                            {formatFingerprint(identityFingerprint)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* About */}
                            <SectionHeader icon={Info} title="About" />
                            <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-elevated)' }}>
                                <div className="flex items-center gap-2.5">
                                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                                         style={{ background: 'var(--accent-muted)' }}>
                                        <MessageSquare className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)', fontFamily: '"Bitcount Ink", system-ui' }}>
                                            Chatter v4.0
                                        </p>
                                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                            Built with privacy in mind
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg px-3 py-2"
                                     style={{ background: 'var(--bg-surface)' }}>
                                    <Globe className="h-3 w-3 shrink-0" style={{ color: 'var(--text-muted)' }} />
                                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                        End-to-end encryption &bull; Open source
                                    </span>
                                </div>
                            </div>

                            <div className="h-4" />
                        </>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}
