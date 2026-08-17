import { useState, useEffect, useRef } from "react";
import { useFriendStore } from "../../store/useFriendStore";
import { Search, UserPlus, Check, Clock, Loader2, X } from "lucide-react";

export function SearchUsers({ onClose }) {
    const [query, setQuery] = useState("");
    const searchUsers = useFriendStore((s) => s.searchUsers);
    const sendRequest = useFriendStore((s) => s.sendRequest);
    const searchResults = useFriendStore((s) => s.searchResults);
    const isSearching = useFriendStore((s) => s.isSearching);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 1) {
                searchUsers(query);
            } else {
                searchUsers("");
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query, searchUsers]);

    const getActionButton = (user) => {
        switch (user.friendshipStatus) {
            case "none":
                return (
                    <button
                        onClick={() => sendRequest(user._id)}
                        className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-500 transition-all"
                    >
                        <UserPlus className="h-3 w-3" />
                        Add
                    </button>
                );
            case "pending":
                return (
                    <span className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-medium text-slate-400">
                        <Clock className="h-3 w-3" />
                        Requested
                    </span>
                );
            case "accepted":
                return (
                    <span className="flex items-center gap-1 rounded-lg bg-emerald-600/20 px-3 py-1.5 text-[11px] font-medium text-emerald-400">
                        <Check className="h-3 w-3" />
                        Friends
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl bg-slate-900/95 shadow-2xl border border-white/15 backdrop-blur-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <h3 className="text-sm font-bold text-white tracking-tight">Search People</h3>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-slate-400 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by username or display name..."
                            className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                </div>

                <div className="max-h-80 overflow-y-auto px-2 pb-3">
                    {isSearching && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                        </div>
                    )}

                    {!isSearching && query.trim().length >= 1 && searchResults.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="text-xs text-slate-400">No users found</p>
                        </div>
                    )}

                    {!isSearching &&
                        searchResults.map((user) => (
                            <div
                                key={user._id}
                                className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/5 transition-all"
                            >
                                <img
                                    src={user.profilePic || "/favicon.svg"}
                                    alt={user.displayName}
                                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-white truncate">
                                        {user.displayName || user.username}
                                    </p>
                                    <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
                                    {user.about && (
                                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.about}</p>
                                    )}
                                </div>
                                {getActionButton(user)}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
