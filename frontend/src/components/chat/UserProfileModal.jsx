import { useState, useEffect } from "react";
import { axiosInstance } from "../../lib/axios";
import { X, MessageSquare, UserPlus, UserCheck, Clock, Shield, Ban } from "lucide-react";
import toast from "react-hot-toast";
import { useFriendStore } from "../../store/useFriendStore";
import { useChatStore } from "../../store/useChatStore";

export function UserProfileModal({ userId, onClose, onStartChat }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const sendRequest = useFriendStore((s) => s.sendRequest);
    const sendReconnectRequest = useChatStore((s) => s.sendReconnectRequest);

    const fetchProfile = () => {
        if (!userId) return;
        setLoading(true);
        axiosInstance.get(`/users/profile/${userId}`)
            .then((res) => setProfile(res.data))
            .catch(() => toast.error("Failed to load profile"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    if (!userId) return null;

    const handleSendReconnect = async () => {
        try {
            await sendReconnectRequest(userId);
            fetchProfile();
        } catch {
            // toast already shown
        }
    };

    const handleAddFriend = async () => {
        try {
            await sendRequest(userId);
            fetchProfile();
        } catch {
            // toast already shown
        }
    };

    const renderActions = () => {
        if (!profile) return null;

        const { blockStatus, friendshipStatus, reconnectRequestId } = profile;

        if (blockStatus === "blocked_by_me") {
            return (
                <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
                         style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <Ban className="h-3.5 w-3.5" style={{ color: 'var(--danger)' }} />
                        <span className="text-[11px] font-medium" style={{ color: 'var(--danger)' }}>
                            Blocked
                        </span>
                    </div>
                    <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                        This user is blocked. Manage in Settings &rarr; Privacy &rarr; Blocked Users.
                    </p>
                </div>
            );
        }

        if (blockStatus === "blocked_by_them") {
            return (
                <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
                         style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <Ban className="h-3.5 w-3.5" style={{ color: 'var(--danger)' }} />
                        <span className="text-[11px] font-medium" style={{ color: 'var(--danger)' }}>
                            You can't interact with this user
                        </span>
                    </div>
                </div>
            );
        }

        if (friendshipStatus === "accepted") {
            return (
                <button
                    onClick={() => {
                        onClose();
                        if (onStartChat) onStartChat(profile._id);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-semibold text-white transition-colors"
                    style={{ background: 'var(--accent)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}
                >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Message
                </button>
            );
        }

        if (friendshipStatus === "pending") {
            return (
                <div className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-medium"
                     style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    <Clock className="h-3.5 w-3.5" />
                    Friend Request Pending
                </div>
            );
        }

        return (
            <button
                onClick={handleAddFriend}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-semibold text-white transition-colors"
                style={{ background: 'var(--accent)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}
            >
                <UserPlus className="h-3.5 w-3.5" />
                Add Friend
            </button>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             onClick={onClose}
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                 onClick={(e) => e.stopPropagation()}>

                {/* Banner */}
                <div className="relative h-24 w-full"
                     style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))' }}>
                    <button onClick={onClose}
                            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                            style={{ background: 'rgba(0,0,0,0.3)', color: 'white' }}>
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-5 pb-5 -mt-10 text-center">
                    {loading ? (
                        <div className="py-8">
                            <div className="h-20 w-20 rounded-full mx-auto animate-pulse"
                                 style={{ background: 'var(--bg-elevated)' }} />
                            <div className="h-4 w-32 mx-auto mt-3 rounded animate-pulse"
                                 style={{ background: 'var(--bg-elevated)' }} />
                        </div>
                    ) : profile ? (
                        <>
                            <img
                                src={profile.profilePic || "/favicon.svg"}
                                alt={profile.displayName}
                                className="h-20 w-20 rounded-full object-cover mx-auto"
                                style={{ border: '3px solid var(--bg-surface)' }}
                            />
                            <h3 className="text-sm font-semibold mt-2"
                                style={{ color: 'var(--text-primary)' }}>
                                {profile.displayName || profile.username}
                            </h3>
                            <p className="text-[11px] mt-0.5"
                               style={{ color: 'var(--text-muted)' }}>
                                @{profile.username}
                            </p>
                            {profile.about && (
                                <p className="text-[11px] mt-2 px-4 leading-relaxed"
                                   style={{ color: 'var(--text-secondary)' }}>
                                    {profile.about}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="mt-4">
                                {renderActions()}
                            </div>
                        </>
                    ) : (
                        <div className="py-8">
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                User not found
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
