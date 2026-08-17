import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Check, X, AtSign, Loader2 } from "lucide-react";

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
        if (authUser?.username) {
            setUsername(authUser.username);
        }
    }, [authUser]);

    const checkAvailability = useCallback(async (value) => {
        if (value.length < 3) {
            setIsAvailable(null);
            return;
        }
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
            if (!res.data.available) {
                setError("Username is already taken");
            }
        } catch {
            setIsAvailable(false);
        } finally {
            setIsChecking(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (username.length >= 3) {
                checkAvailability(username);
            }
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
            toast.success("Username set successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to set username");
        } finally {
            setIsSaving(false);
        }
    };

    if (!needsUsername) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-md rounded-3xl bg-slate-900/95 p-8 shadow-2xl border border-white/15 backdrop-blur-2xl">
                <div className="text-center mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/25 text-white mx-auto mb-4">
                        <AtSign className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Choose your username</h2>
                    <p className="text-xs text-slate-400 mt-1">
                        This is your unique identity on Chatter. Choose wisely.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">@</span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => {
                                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "");
                                    setUsername(val);
                                    setError("");
                                }}
                                placeholder="username"
                                className="w-full rounded-xl border border-white/10 bg-white/5 pl-8 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                autoFocus
                                maxLength={32}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {isChecking && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                                {!isChecking && isAvailable === true && <Check className="h-4 w-4 text-emerald-400" />}
                                {!isChecking && isAvailable === false && <X className="h-4 w-4 text-red-400" />}
                            </div>
                        </div>
                        {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
                        {!error && username.length >= 3 && isAvailable === true && (
                            <p className="text-xs text-emerald-400 mt-1.5">Username is available</p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-1">
                            3-32 characters. Lowercase letters, numbers, dots, and underscores only.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={!username || username.length < 3 || !isAvailable || isSaving}
                        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Setting...
                            </>
                        ) : (
                            "Continue"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
