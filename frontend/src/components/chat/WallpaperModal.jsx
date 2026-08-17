import { useWallpaper } from "../../context/WallpaperContext";
import { X, Check } from "lucide-react";

export function WallpaperModal({ isOpen, onClose }) {
    const { wallpaperId, setWallpaperId, wallpapers } = useWallpaper();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-lg rounded-xl p-6"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between pb-4"
                     style={{ borderBottom: '1px solid var(--border)' }}>
                    <div>
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Choose Wallpaper
                        </h3>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            Customize your chat background appearance
                        </p>
                    </div>
                    <button onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto py-4">
                    {wallpapers.map((wp) => {
                        const isSelected = wp.id === wallpaperId;

                        return (
                            <button key={wp.id}
                                    onClick={() => setWallpaperId(wp.id)}
                                    className="group relative flex flex-col items-center overflow-hidden rounded-lg p-2 transition-colors"
                                    style={{
                                        border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                                        background: isSelected ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                                    }}>
                                <div className="h-20 w-full rounded-md shadow-inner relative flex items-center justify-center"
                                     style={{ background: wp.background }}>
                                    {isSelected && (
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full"
                                             style={{ background: 'var(--accent)' }}>
                                            <Check className="h-3.5 w-3.5 stroke-[3] text-white" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-[11px] font-medium mt-2 truncate w-full text-center"
                                      style={{ color: 'var(--text-primary)' }}>
                                    {wp.name}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4 pt-3 flex justify-end"
                     style={{ borderTop: '1px solid var(--border)' }}>
                    <button onClick={onClose}
                            className="rounded-lg px-5 py-2 text-xs font-semibold text-white transition-colors"
                            style={{ background: 'var(--accent)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
