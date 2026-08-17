import { useWallpaper } from "../../context/WallpaperContext";
import { X, Check, Upload, Trash2, ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

const MAX_SIZE = 5 * 1024 * 1024;

export function WallpaperModal({ isOpen, onClose }) {
    const {
        wallpaperId, setWallpaperId, wallpapers,
        customWallpapers, customWallpaperId, isCustom,
        addCustomWallpaper, removeCustomWallpaper, selectCustomWallpaper,
    } = useWallpaper();

    const [tab, setTab] = useState("preloaded");
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Only image files are allowed");
            return;
        }
        if (file.size > MAX_SIZE) {
            toast.error("Image must be under 5MB");
            return;
        }
        if (customWallpapers.length >= 5) {
            toast.error("Maximum 5 custom wallpapers. Delete one first.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
            addCustomWallpaper(reader.result, name);
            toast.success("Wallpaper set");
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const handleSelectNone = () => {
        setWallpaperId("none");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-lg rounded-xl"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div>
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Chat Wallpaper
                        </h3>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            Choose a background for your chat
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

                {/* Tabs */}
                <div className="flex gap-1 mx-5 p-1 rounded-lg"
                     style={{ background: 'var(--bg-elevated)' }}>
                    {[
                        { id: "preloaded", label: "Preloaded" },
                        { id: "custom", label: "My Uploads" },
                    ].map((t) => (
                        <button key={t.id}
                                onClick={() => setTab(t.id)}
                                className="flex-1 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors"
                                style={{
                                    background: tab === t.id ? 'var(--bg-surface)' : 'transparent',
                                    color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                                    boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
                                }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="px-5 py-4 max-h-80 overflow-y-auto">
                    {tab === "preloaded" && (
                        <div className="space-y-3">
                            {/* None option */}
                            <button onClick={handleSelectNone}
                                    className="w-full flex items-center gap-3 rounded-lg p-3 transition-colors"
                                    style={{
                                        border: wallpaperId === "none" ? '1px solid var(--accent)' : '1px solid var(--border)',
                                        background: wallpaperId === "none" ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                                    }}>
                                <div className="h-14 w-14 rounded-md shrink-0 flex items-center justify-center"
                                     style={{ background: 'var(--bg-app)', border: '1px dashed var(--border)' }}>
                                    <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>None</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>
                                        No Wallpaper
                                    </p>
                                    <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                                        Use theme background only
                                    </p>
                                </div>
                                {wallpaperId === "none" && (
                                    <div className="h-5 w-5 flex items-center justify-center rounded-full shrink-0"
                                         style={{ background: 'var(--accent)' }}>
                                        <Check className="h-3 stroke-[3] text-white" />
                                    </div>
                                )}
                            </button>

                            {/* Preloaded wallpapers */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                                            <span className="text-[10px] font-medium mt-2 truncate w-full text-center"
                                                  style={{ color: 'var(--text-primary)' }}>
                                                {wp.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {tab === "custom" && (
                        <div className="space-y-3">
                            {/* Upload button */}
                            <input type="file" ref={fileInputRef} onChange={handleUpload}
                                   accept="image/*" className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center gap-3 rounded-lg p-3 transition-colors"
                                    style={{ border: '1px dashed var(--accent)', background: 'var(--accent-muted)' }}>
                                <div className="h-14 w-14 rounded-md shrink-0 flex items-center justify-center"
                                     style={{ background: 'var(--bg-elevated)' }}>
                                    <Upload className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>
                                        Upload Image
                                    </p>
                                    <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                                        JPG, PNG, WebP — Max 5MB
                                    </p>
                                </div>
                            </button>

                            {/* Uploaded wallpapers */}
                            {customWallpapers.length === 0 && (
                                <div className="flex flex-col items-center py-8">
                                    <ImageIcon className="h-8 w-8 mb-2" style={{ color: 'var(--text-muted)' }} />
                                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                        No custom wallpapers yet
                                    </p>
                                </div>
                            )}

                            {customWallpapers.map((wp) => {
                                const isSelected = isCustom && wp.id === customWallpaperId;
                                return (
                                    <div key={wp.id}
                                         className="flex items-center gap-3 rounded-lg p-2 transition-colors"
                                         style={{
                                             border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                                             background: isSelected ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                                         }}>
                                        <button onClick={() => selectCustomWallpaper(wp.id)}
                                                className="flex-1 flex items-center gap-3">
                                            <div className="h-14 w-14 rounded-md shrink-0 overflow-hidden"
                                                 style={{ border: '1px solid var(--border)' }}>
                                                <img src={wp.dataUrl} alt={wp.name}
                                                     className="h-full w-full object-cover" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>
                                                    {wp.name}
                                                </p>
                                                <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                                                    {isSelected ? "Active" : "Tap to use"}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <div className="h-5 w-5 flex items-center justify-center rounded-full shrink-0"
                                                     style={{ background: 'var(--accent)' }}>
                                                    <Check className="h-3 stroke-[3] text-white" />
                                                </div>
                                            )}
                                        </button>
                                        <button onClick={() => removeCustomWallpaper(wp.id)}
                                                className="h-7 w-7 flex items-center justify-center rounded-lg shrink-0 transition-colors"
                                                style={{ color: 'var(--danger)' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                title="Delete">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                );
                            })}

                            {customWallpapers.length > 0 && (
                                <p className="text-[9px] text-center" style={{ color: 'var(--text-muted)' }}>
                                    {customWallpapers.length}/5 custom wallpapers
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 flex justify-end"
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
