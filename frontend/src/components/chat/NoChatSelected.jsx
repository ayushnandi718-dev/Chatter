import { MessageSquare, Sparkles, Image, ShieldCheck, Volume2 } from "lucide-react";

export function NoChatSelected({ onOpenSearch }) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/25 border border-white/20">
                <MessageSquare className="h-12 w-12 text-white" />
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-slate-900">
                    <Sparkles className="h-3.5 w-3.5" />
                </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Welcome to Chatter</h2>
            <p className="max-w-md text-sm text-slate-300 mb-8 leading-relaxed">
                Search for friends, send a request, and start chatting in real-time with rich media, themes, and custom wallpapers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl w-full">
                <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-center">
                    <Image className="h-6 w-6 text-blue-400 mb-2" />
                    <span className="text-xs font-semibold text-white">Media Sharing</span>
                    <span className="text-[11px] text-slate-400">Photos & Videos up to 25MB</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-center">
                    <Volume2 className="h-6 w-6 text-purple-400 mb-2" />
                    <span className="text-xs font-semibold text-white">Clicky Audio</span>
                    <span className="text-[11px] text-slate-400">Mechanical typing sounds</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-center">
                    <ShieldCheck className="h-6 w-6 text-emerald-400 mb-2" />
                    <span className="text-xs font-semibold text-white">Private & Anonymous</span>
                    <span className="text-[11px] text-slate-400">Only friends can chat</span>
                </div>
            </div>

            <button
                onClick={onOpenSearch}
                className="mt-8 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all"
            >
                Find Friends
            </button>
        </div>
    );
}
