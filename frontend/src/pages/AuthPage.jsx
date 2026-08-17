import { SignInButton, SignUpButton } from "@clerk/react";
import { MessageSquare, Shield, Image, Sparkles, Volume2, Palette } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function AuthPage() {
    const { theme, setTheme, themes } = useTheme();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 transition-all duration-300"
             style={{ background: 'var(--bg-app)' }}>
            <div className="w-full max-w-4xl overflow-hidden rounded-3xl"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                <div className="flex items-center justify-between px-6 py-4"
                     style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2.5">
                        <img src="/logo.png" alt="Chatter" className="h-9 w-9 rounded-xl object-cover" />
                        <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: '"Bitcount Ink", system-ui' }}>
                            Chatter
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                        <select value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                className="rounded-lg px-2.5 py-1 text-xs font-medium outline-none"
                                style={{
                                    background: 'var(--bg-elevated)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border)',
                                }}>
                            {themes.map((t) => (
                                <option key={t.id} value={t.id}
                                        style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-10 items-center">
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold"
                             style={{ background: 'var(--accent-muted)', color: 'var(--accent)', border: '1px solid rgba(99,102,241,0.2)' }}>
                            <Sparkles className="h-3.5 w-3.5" />
                            Next-Gen Real-Time Chat
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight"
                            style={{ color: 'var(--text-primary)' }}>
                            Real-time messaging, <br />
                            <span style={{ color: 'var(--accent)' }}>
                                elevated and instant.
                            </span>
                        </h1>

                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            Chatter combines bi-directional WebSocket delivery, high-resolution photo & video sharing, mechanical sound effects, and customizable themes into one seamless platform.
                        </p>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            {[
                                { icon: Image, label: "Media Sharing", desc: "Up to 25MB via CDN", iconColor: 'var(--accent)' },
                                { icon: Volume2, label: "Clicky Audio", desc: "Mechanical feedback", iconColor: '#a855f7' },
                                { icon: Shield, label: "E2EE + Clerk", desc: "Encrypted & safe", iconColor: 'var(--success)' },
                                { icon: MessageSquare, label: "Live Presence", desc: "Real-time status", iconColor: '#f59e0b' },
                            ].map(({ icon: Icon, label, desc, iconColor }) => (
                                <div key={label}
                                     className="flex items-center gap-2.5 rounded-xl p-3"
                                     style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                                    <Icon className="h-5 w-5 shrink-0" style={{ color: iconColor }} />
                                    <div className="text-xs">
                                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center rounded-2xl p-8 text-center space-y-6"
                         style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-white"
                             style={{ background: 'var(--accent)' }}>
                            <MessageSquare className="h-8 w-8" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                Get Started
                            </h2>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                Sign in with your Google, GitHub, or Email account
                            </p>
                        </div>

                        <div className="w-full max-w-xs space-y-3">
                            <SignInButton mode="modal">
                                <button className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors"
                                        style={{ background: 'var(--accent)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}>
                                    Sign In
                                </button>
                            </SignInButton>

                            <SignUpButton mode="modal">
                                <button className="w-full rounded-xl py-3 text-sm font-semibold transition-colors"
                                        style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-active)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}>
                                    Create New Account
                                </button>
                            </SignUpButton>
                        </div>

                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            Protected by Clerk Authentication & E2EE
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
