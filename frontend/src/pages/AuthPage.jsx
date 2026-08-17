import { SignInButton, SignUpButton } from "@clerk/react";
import { MessageSquare, Shield, Image, Sparkles, Volume2, Palette } from "lucide-react";
import { useWallpaper } from "../context/WallpaperContext";
import { useTheme } from "../context/ThemeContext";

export default function AuthPage() {
    const { frameStyle } = useWallpaper();
    const { theme, setTheme, themes } = useTheme();

    return (
        <div
            className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 transition-all duration-300"
            style={frameStyle}
        >
            <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-slate-950/80 shadow-2xl border border-white/15 backdrop-blur-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 text-white font-bold">
                            💬
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white">Chatter</span>
                    </div>

                    {/* Theme switcher */}
                    <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-slate-400" />
                        <select
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {themes.map((t) => (
                                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Hero / Main Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-10 items-center">
                    {/* Left: Branding & Value Proposition */}
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3.5 py-1 border border-blue-500/20 text-xs font-semibold text-blue-400">
                            <Sparkles className="h-3.5 w-3.5" />
                            Next-Gen Real-Time Chat
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                            Real-time messaging, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                                elevated and instant.
                            </span>
                        </h1>

                        <p className="text-sm text-slate-300 leading-relaxed">
                            Chatter combines bi-directional WebSocket delivery, high-resolution photo & video sharing, mechanical sound effects, and customizable themes into one seamless platform.
                        </p>

                        {/* Feature Badges */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-3 border border-white/10">
                                <Image className="h-5 w-5 text-blue-400 shrink-0" />
                                <div className="text-xs">
                                    <p className="font-semibold text-white">Media Sharing</p>
                                    <p className="text-[10px] text-slate-400">Up to 25MB via CDN</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-3 border border-white/10">
                                <Volume2 className="h-5 w-5 text-purple-400 shrink-0" />
                                <div className="text-xs">
                                    <p className="font-semibold text-white">Clicky Audio</p>
                                    <p className="text-[10px] text-slate-400">Mechanical feedback</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-3 border border-white/10">
                                <Shield className="h-5 w-5 text-emerald-400 shrink-0" />
                                <div className="text-xs">
                                    <p className="font-semibold text-white">Clerk Identity</p>
                                    <p className="text-[10px] text-slate-400">Safe & synchronized</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-3 border border-white/10">
                                <MessageSquare className="h-5 w-5 text-amber-400 shrink-0" />
                                <div className="text-xs">
                                    <p className="font-semibold text-white">Live Presence</p>
                                    <p className="text-[10px] text-slate-400">Real-time status</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Auth Action Card */}
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-white/5 p-8 border border-white/10 backdrop-blur-xl text-center space-y-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/25 text-white">
                            <MessageSquare className="h-8 w-8" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Get Started</h2>
                            <p className="text-xs text-slate-300 mt-1">
                                Sign in with your Google, GitHub, or Email account
                            </p>
                        </div>

                        <div className="w-full max-w-xs space-y-3">
                            <SignInButton mode="modal">
                                <button className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all">
                                    Sign In
                                </button>
                            </SignInButton>

                            <SignUpButton mode="modal">
                                <button className="w-full rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all">
                                    Create New Account
                                </button>
                            </SignUpButton>
                        </div>

                        <p className="text-[11px] text-slate-400">
                            Protected by Clerk Authentication & Webhook verification
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
