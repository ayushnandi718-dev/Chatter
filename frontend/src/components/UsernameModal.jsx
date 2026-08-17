import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Check, X, AtSign, Loader2, Shield } from "lucide-react";

export default function UsernameModal() {
    const authUser = useAuthStore((state) => state.authUser);
    const setAuthUser = useAuthStore((state) => state.setAuthUser);
    const [username, setUsername] = useState("");
    const [isAvailable, setIsAvailable] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const needsUsername = authUser && !authUser.username;

    useEffect(() => {
        if (authUser?.username) setUsername(authUser.username);
    }, [authUser]);

    const checkAvailability = useCallback(async (value) => {
        if (value.length < 3) { setIsAvailable(null); return; }
        if (!/^[a-z0-9._]+$/.test(value)) {
            setIsAvailable(false);
            setError("Only lowercase letters, numbers, dots, and underscores");
            return;
        }
        setIsChecking(true);
        setError("");
        try {
            const res = await axiosInstance.get(`/users/username/${value}`);
            setIsAvailable(res.data.available);
            if (!res.data.available) setError("Username is already taken");
        } catch { setIsAvailable(false); }
        finally { setIsChecking(false); }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (username.length >= 3) checkAvailability(username);
        }, 500);
        return () => clearTimeout(timer);
    }, [username, checkAvailability]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || username.length < 3 || !isAvailable) return;
        setIsSaving(true);
        try {
            const res = await axiosInstance.put("/users/username", { username });
            setAuthUser(res.data);
            toast.success("Username set!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to set username");
        } finally { setIsSaving(false); }
    };

    if (!needsUsername) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-sm rounded-xl p-6"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="text-center mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl mx-auto mb-3"
                         style={{ background: 'var(--accent-muted)' }}>
                        <AtSign className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                    </div>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Choose your username
                    </h2>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Your public identity on Chatter.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium"
                                  style={{ color: 'var(--text-muted)' }}>@</span>
                            <input type="text"
                                   value={username}
                                   onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "")); setError(""); }}
                                   placeholder="username"
                                   className="w-full rounded-lg pl-7 pr-8 py-2 text-xs outline-none transition-colors"
                                   style={{
                                       background: 'var(--bg-elevated)',
                                       color: 'var(--text-primary)',
                                       border: '1px solid var(--border)',
                                   }}
                                   onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                                   onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                   autoFocus maxLength={32} />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                {isChecking && <Loader2 className="h-3 w-3 animate-spin" style={{ color: 'var(--text-muted)' }} />}
                                {!isChecking && isAvailable === true && <Check className="h-3 w-3" style={{ color: 'var(--success)' }} />}
                                {!isChecking && isAvailable === false && <X className="h-3 w-3" style={{ color: 'var(--danger)' }} />}
                            </div>
                        </div>
                        {error && <p className="text-[10px] mt-1" style={{ color: 'var(--danger)' }}>{error}</p>}
                        {!error && username.length >= 3 && isAvailable === true && (
                            <p className="text-[10px] mt-1" style={{ color: 'var(--success)' }}>Available</p>
                        )}
                    </div>

                    <button type="submit"
                            disabled={!username || username.length < 3 || !isAvailable || isSaving}
                            className="w-full rounded-lg py-2 text-xs font-semibold text-white transition-colors disabled:opacity-30 flex items-center justify-center gap-1.5"
                            style={{ background: 'var(--accent)' }}>
                        {isSaving ? <><Loader2 className="h-3 w-3 animate-spin" /> Setting...</> : "Continue"}
                    </button>
                </form>
            </div>
        </div>
    );
}
