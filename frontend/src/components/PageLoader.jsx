import { Loader2 } from "lucide-react";

export default function PageLoader({ text = "Loading Chatter..." }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center"
             style={{ background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
            <div className="flex flex-col items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl"
                     style={{ background: 'var(--accent)' }}>
                    <Loader2 className="h-7 w-7 animate-spin text-white" />
                </div>
                <p className="text-xs font-medium tracking-wide animate-pulse"
                   style={{ color: 'var(--text-muted)' }}>
                    {text}
                </p>
            </div>
        </div>
    );
}
