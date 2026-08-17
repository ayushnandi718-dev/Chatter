import { useEffect } from "react";
import { useFriendStore } from "../../store/useFriendStore";
import { Check, X, Clock, Loader2, UserCheck, UserX } from "lucide-react";

export function FriendRequests({ onClose }) {
    const incomingRequests = useFriendStore((s) => s.incomingRequests);
    const outgoingRequests = useFriendStore((s) => s.outgoingRequests);
    const isRequestsLoading = useFriendStore((s) => s.isRequestsLoading);
    const getRequests = useFriendStore((s) => s.getRequests);
    const acceptRequest = useFriendStore((s) => s.acceptRequest);
    const rejectRequest = useFriendStore((s) => s.rejectRequest);
    const cancelRequest = useFriendStore((s) => s.cancelRequest);

    useEffect(() => {
        getRequests();
    }, [getRequests]);

    const totalCount = incomingRequests.length + outgoingRequests.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl bg-slate-900/95 shadow-2xl border border-white/15 backdrop-blur-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">Friend Requests</h3>
                        {totalCount > 0 && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                {totalCount} pending request{totalCount !== 1 ? "s" : ""}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-slate-400 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {isRequestsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                        </div>
                    ) : (
                        <>
                            {incomingRequests.length > 0 && (
                                <div className="p-3">
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
                                        Incoming ({incomingRequests.length})
                                    </p>
                                    {incomingRequests.map((req) => (
                                        <div
                                            key={req._id}
                                            className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/5 transition-all"
                                        >
                                            <img
                                                src={req.user.profilePic || "/favicon.svg"}
                                                alt={req.user.displayName}
                                                className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-white truncate">
                                                    {req.user.displayName || req.user.username}
                                                </p>
                                                <p className="text-[11px] text-slate-400">
                                                    @{req.user.username}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => acceptRequest(req._id)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-all"
                                                    title="Accept"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => rejectRequest(req._id)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all"
                                                    title="Reject"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {outgoingRequests.length > 0 && (
                                <div className="p-3 border-t border-white/5">
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
                                        Outgoing ({outgoingRequests.length})
                                    </p>
                                    {outgoingRequests.map((req) => (
                                        <div
                                            key={req._id}
                                            className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/5 transition-all"
                                        >
                                            <img
                                                src={req.user.profilePic || "/favicon.svg"}
                                                alt={req.user.displayName}
                                                className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-white truncate">
                                                    {req.user.displayName || req.user.username}
                                                </p>
                                                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Pending
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => cancelRequest(req._id)}
                                                className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-white/15 transition-all"
                                            >
                                                <UserX className="h-3 w-3" />
                                                Cancel
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                                <div className="py-12 text-center">
                                    <UserCheck className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                                    <p className="text-xs text-slate-400">No pending requests</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
