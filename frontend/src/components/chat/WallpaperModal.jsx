import { useWallpaper } from "../../context/WallpaperContext";
import { X, Check } from "lucide-react";

export function WallpaperModal({ isOpen, onClose }) {
    const { wallpaperId, setWallpaperId, wallpapers } = useWallpaper();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 p-6 shadow-2xl border border-white/15 backdrop-blur-2xl">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div>
                        <h3 className="text-base font-bold text-white tracking-tight">Choose Wallpaper</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Customize your chat background appearance
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-all"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Wallpaper Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto py-4">
                    {wallpapers.map((wp) => {
                        const isSelected = wp.id === wallpaperId;

                        return (
                            <button
                                key={wp.id}
                                onClick={() => {
                                    setWallpaperId(wp.id);
                                }}
                                className={`group relative flex flex-col items-center overflow-hidden rounded-2xl border p-2 transition-all ${
                                    isSelected
                                        ? "border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20"
                                        : "border-white/10 hover:border-white/25 bg-white/5"
                                }`}
                            >
                                <div
                                    className="h-20 w-full rounded-xl shadow-inner relative flex items-center justify-center"
                                    style={{ background: wp.background }}
                                >
                                    {isSelected && (
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-[11px] font-medium text-slate-200 mt-2 truncate w-full text-center">
                                    {wp.name}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
