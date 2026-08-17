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
                    <button onClick={() => sendRequest(user._id)}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-colors"
                            style={{ background: 'var(--accent)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}>
                        <UserPlus className="h-3 w-3" />
                        Add
                    </button>
                );
            case "pending":
                return (
                    <span className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                        <Clock className="h-3 w-3" />
                        Requested
                    </span>
                );
            case "accepted":
                return (
                    <span className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium"
                          style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--success)' }}>
                        <Check className="h-3 w-3" />
                        Friends
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-lg rounded-xl overflow-hidden"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between px-5 py-3"
                     style={{ borderBottom: '1px solid var(--border)' }}>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Search People
                    </h3>
                    <button onClick={onClose}
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                        <input ref={inputRef}
                               type="text"
                               value={query}
                               onChange={(e) => setQuery(e.target.value)}
                               placeholder="Search by username or display name..."
                               className="w-full rounded-lg pl-9 pr-4 py-2.5 text-xs outline-none transition-colors"
                               style={{
                                   background: 'var(--bg-elevated)',
                                   color: 'var(--text-primary)',
                                   border: '1px solid var(--border)',
                               }}
                               onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                               onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                </div>

                <div className="max-h-80 overflow-y-auto px-2 pb-3">
                    {isSearching && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--accent)' }} />
                        </div>
                    )}

                    {!isSearching && query.trim().length >= 1 && searchResults.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No users found</p>
                        </div>
                    )}

                    {!isSearching && searchResults.map((user) => (
                        <div key={user._id}
                             className="flex items-center gap-3 rounded-lg p-2.5 transition-colors"
                             onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                             onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <img src={user.profilePic || "/favicon.svg"}
                                 alt={user.displayName}
                                 className="h-10 w-10 rounded-full object-cover" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate"
                                   style={{ color: 'var(--text-primary)' }}>
                                    {user.displayName || user.username}
                                </p>
                                <p className="text-[11px] truncate"
                                   style={{ color: 'var(--text-muted)' }}>@{user.username}</p>
                                {user.about && (
                                    <p className="text-[10px] truncate mt-0.5"
                                       style={{ color: 'var(--text-muted)' }}>{user.about}</p>
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
