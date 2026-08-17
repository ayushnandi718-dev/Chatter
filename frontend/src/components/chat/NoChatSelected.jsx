import { Shield, MessageSquare } from "lucide-react";

export function NoChatSelected({ onOpenSearch }) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
                 style={{ background: 'var(--accent-muted)' }}>
                <MessageSquare className="h-7 w-7" style={{ color: 'var(--accent)' }} />
            </div>

            <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Your conversations, privately connected.
            </h2>
            <p className="max-w-sm text-xs mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Search for someone, send a friend request, and start an encrypted conversation.
            </p>

            <button onClick={onOpenSearch}
                    className="rounded-lg px-5 py-2 text-xs font-semibold text-white transition-colors"
                    style={{ background: 'var(--accent)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}>
                Find People
            </button>

            <div className="flex items-center gap-1.5 mt-6 px-3 py-1.5 rounded-full"
                 style={{ background: 'var(--bg-hover)' }}>
                <Shield className="h-3 w-3" style={{ color: 'var(--accent)' }} />
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    Text messages are end-to-end encrypted
                </span>
            </div>
        </div>
    );
}
