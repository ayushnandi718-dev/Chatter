import { Loader2 } from "lucide-react";

export default function PageLoader({ text = "Loading Chatter..." }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
            <div className="flex flex-col items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
                <p className="text-sm font-medium tracking-wide text-slate-400 animate-pulse">{text}</p>
            </div>
        </div>
    );
}
