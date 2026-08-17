import { useEffect } from "react";
import { useFriendStore } from "../../store/useFriendStore";
import { Check, X, Clock, Loader2, UserCheck, UserX, RefreshCw } from "lucide-react";

export function FriendRequests({ onClose }) {
    const incomingRequests = useFriendStore((s) => s.incomingRequests);
    const outgoingRequests = useFriendStore((s) => s.outgoingRequests);
    const incomingReconnectRequests = useFriendStore((s) => s.incomingReconnectRequests);
    const isRequestsLoading = useFriendStore((s) => s.isRequestsLoading);
    const getRequests = useFriendStore((s) => s.getRequests);
    const acceptRequest = useFriendStore((s) => s.acceptRequest);
    const rejectRequest = useFriendStore((s) => s.rejectRequest);
    const cancelRequest = useFriendStore((s) => s.cancelRequest);
    const acceptReconnectRequest = useFriendStore((s) => s.acceptReconnectRequest);
    const declineReconnectRequest = useFriendStore((s) => s.declineReconnectRequest);

    useEffect(() => {
        getRequests();
    }, [getRequests]);

    const totalCount = incomingRequests.length + outgoingRequests.length + incomingReconnectRequests.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-lg rounded-xl overflow-hidden"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between px-5 py-3"
                     style={{ borderBottom: '1px solid var(--border)' }}>
                    <div>
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Friend Requests
                        </h3>
                        {totalCount > 0 && (
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {totalCount} pending request{totalCount !== 1 ? "s" : ""}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose}
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {isRequestsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--accent)' }} />
                        </div>
                    ) : (
                        <>
                            {/* Reconnect Requests */}
                            {incomingReconnectRequests.length > 0 && (
                                <div className="p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider px-2 mb-2"
                                       style={{ color: 'var(--accent)' }}>
                                        <RefreshCw className="h-3 w-3 inline mr-1" />
                                        Reconnect Requests ({incomingReconnectRequests.length})
                                    </p>
                                    {incomingReconnectRequests.map((req) => (
                                        <div key={req._id}
                                             className="flex items-center gap-3 rounded-lg p-2.5 transition-colors"
                                             style={{ color: 'var(--text-primary)', background: 'var(--accent-muted)' }}
                                             onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                             onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-muted)'}>
                                            <img src={req.user.profilePic || "/favicon.svg"}
                                                 alt={req.user.displayName}
                                                 className="h-10 w-10 rounded-full object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold truncate"
                                                   style={{ color: 'var(--text-primary)' }}>
                                                    {req.user.displayName || req.user.username}
                                                </p>
                                                <p className="text-[11px]" style={{ color: 'var(--accent)' }}>
                                                    Wants to reconnect with you
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => acceptReconnectRequest(req._id)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                                                        style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--success)' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(34,197,94,0.25)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(34,197,94,0.15)'}
                                                        title="Accept">
                                                    <Check className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => declineReconnectRequest(req._id)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                                                        style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                                                        title="Decline">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Regular Incoming Requests */}
                            {incomingRequests.length > 0 && (
                                <div className="p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider px-2 mb-2"
                                       style={{ color: 'var(--text-muted)' }}>
                                        Incoming ({incomingRequests.length})
                                    </p>
                                    {incomingRequests.map((req) => (
                                        <div key={req._id}
                                             className="flex items-center gap-3 rounded-lg p-2.5 transition-colors"
                                             style={{ color: 'var(--text-primary)' }}
                                             onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                             onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <img src={req.user.profilePic || "/favicon.svg"}
                                                 alt={req.user.displayName}
                                                 className="h-10 w-10 rounded-full object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold truncate"
                                                   style={{ color: 'var(--text-primary)' }}>
                                                    {req.user.displayName || req.user.username}
                                                </p>
                                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                                    @{req.user.username}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => acceptRequest(req._id)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                                                        style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--success)' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(34,197,94,0.25)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(34,197,94,0.15)'}
                                                        title="Accept">
                                                    <Check className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => rejectRequest(req._id)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                                                        style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                                                        title="Reject">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Outgoing Requests */}
                            {outgoingRequests.length > 0 && (
                                <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider px-2 mb-2"
                                       style={{ color: 'var(--text-muted)' }}>
                                        Outgoing ({outgoingRequests.length})
                                    </p>
                                    {outgoingRequests.map((req) => (
                                        <div key={req._id}
                                             className="flex items-center gap-3 rounded-lg p-2.5 transition-colors"
                                             style={{ color: 'var(--text-primary)' }}
                                             onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                             onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <img src={req.user.profilePic || "/favicon.svg"}
                                                 alt={req.user.displayName}
                                                 className="h-10 w-10 rounded-full object-cover" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold truncate"
                                                   style={{ color: 'var(--text-primary)' }}>
                                                    {req.user.displayName || req.user.username}
                                                </p>
                                                <p className="text-[11px] flex items-center gap-1"
                                                   style={{ color: 'var(--text-muted)' }}>
                                                    <Clock className="h-3 w-3" />
                                                    Pending
                                                </p>
                                            </div>
                                            <button onClick={() => cancelRequest(req._id)}
                                                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors"
                                                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}>
                                                <UserX className="h-3 w-3" />
                                                Cancel
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {totalCount === 0 && (
                                <div className="py-12 text-center">
                                    <UserCheck className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        No pending requests
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
