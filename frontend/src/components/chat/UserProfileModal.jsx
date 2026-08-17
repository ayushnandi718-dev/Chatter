import { useState, useEffect } from "react";
import { axiosInstance } from "../../lib/axios";
import { X, MessageSquare, UserPlus, UserCheck, Clock, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { useChatStore } from "../../store/useChatStore";
import { useFriendStore } from "../../store/useFriendStore";

export function UserProfileModal({ userId, onClose, onStartChat }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const sendRequest = useFriendStore((s) => s.sendRequest);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        axiosInstance.get(`/users/profile/${userId}`)
            .then((res) => setProfile(res.data))
            .catch(() => toast.error("Failed to load profile"))
            .finally(() => setLoading(false));
    }, [userId]);

    if (!userId) return null;

    const friendshipLabel = (status) => {
        switch (status) {
            case "accepted": return { text: "Friends", icon: UserCheck, color: "var(--success)" };
            case "pending": return { text: "Request Sent", icon: Clock, color: "var(--text-muted)" };
            default: return null;
        }
    };

    const friendStatus = profile ? friendshipLabel(profile.friendshipStatus) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             onClick={onClose}
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                 onClick={(e) => e.stopPropagation()}>

                {/* Header / Banner */}
                <div className="relative h-24 w-full"
                     style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))' }}>
                    <button onClick={onClose}
                            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                            style={{ background: 'rgba(0,0,0,0.3)', color: 'white' }}>
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Avatar + Info */}
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

                            {/* Friendship status */}
                            {friendStatus && (
                                <div className="flex items-center justify-center gap-1.5 mt-3">
                                    <friendStatus.icon className="h-3 w-3" style={{ color: friendStatus.color }} />
                                    <span className="text-[10px] font-medium" style={{ color: friendStatus.color }}>
                                        {friendStatus.text}
                                    </span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 mt-4">
                                {profile.friendshipStatus === "accepted" ? (
                                    <button
                                        onClick={() => {
                                            onClose();
                                            if (onStartChat) onStartChat(profile._id);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-semibold text-white transition-colors"
                                        style={{ background: 'var(--accent)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}
                                    >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        Message
                                    </button>
                                ) : profile.friendshipStatus === "pending" ? (
                                    <div className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-medium"
                                         style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                        <Clock className="h-3.5 w-3.5" />
                                        Request Sent
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => sendRequest(profile._id)}
                                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-semibold text-white transition-colors"
                                        style={{ background: 'var(--accent)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}
                                    >
                                        <UserPlus className="h-3.5 w-3.5" />
                                        Add Friend
                                    </button>
                                )}
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
