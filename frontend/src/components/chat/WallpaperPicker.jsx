import { useState, useRef, useMemo, useCallback } from "react";
import { useWallpaperStore } from "../../store/useWallpaperStore";
import { useChatStore } from "../../store/useChatStore";
import { WALLPAPERS, CATEGORIES, DEFAULT_WALLPAPER, getWallpapersByCategory } from "../../lib/wallpapers";
import { X, Check, Upload, Trash2, RotateCcw, MessageCircle, Globe } from "lucide-react";
import toast from "react-hot-toast";

const MAX_CUSTOM_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function Thumbnail({ wallpaper, isSelected, onClick, isCustom }) {
    const style = {};
    if (wallpaper.dataUrl) {
        style.backgroundImage = `url(${wallpaper.dataUrl})`;
        style.backgroundSize = "cover";
        style.backgroundPosition = "center";
    } else if (wallpaper.value) {
        style.background = wallpaper.value;
    }
    if (wallpaper.patternSize && wallpaper.patternSize !== "auto") {
        style.backgroundSize = wallpaper.patternSize;
    }

    return (
        <button
            onClick={onClick}
            className="relative flex flex-col items-center overflow-hidden rounded-lg p-1.5 transition-all"
            style={{
                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: isSelected ? 'var(--accent-muted)' : 'var(--bg-elevated)',
            }}
            aria-pressed={isSelected}
            aria-label={`${wallpaper.name} wallpaper`}
        >
            <div className="h-16 w-full rounded-md shadow-inner relative overflow-hidden"
                 style={style}>
                {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center"
                         style={{ background: 'rgba(0,0,0,0.3)' }}>
                        <div className="h-5 w-5 flex items-center justify-center rounded-full"
                             style={{ background: 'var(--accent)' }}>
                            <Check className="h-3 stroke-[3] text-white" />
                        </div>
                    </div>
                )}
            </div>
            <span className="text-[9px] font-medium mt-1 truncate w-full text-center"
                  style={{ color: 'var(--text-muted)' }}>
                {wallpaper.name}
            </span>
        </button>
    );
}

function PreviewPane({ wallpaper, overlayOpacity }) {
    const style = {};
    if (wallpaper.dataUrl) {
        style.backgroundImage = `url(${wallpaper.dataUrl})`;
        style.backgroundSize = "cover";
        style.backgroundPosition = "center";
    } else if (wallpaper.value) {
        style.background = wallpaper.value;
    }
    if (wallpaper.patternSize && wallpaper.patternSize !== "auto") {
        style.backgroundSize = wallpaper.patternSize;
    }

    return (
        <div className="relative rounded-xl overflow-hidden h-40 sm:h-48"
             style={{ border: '1px solid var(--border)' }}>
            <div className="absolute inset-0" style={style} />
            <div className="absolute inset-0" style={{ opacity: overlayOpacity, background: 'rgba(0,0,0,0.35)' }} />
            <div className="relative z-[1] flex flex-col justify-end p-4 h-full gap-2">
                <div className="self-start max-w-[70%] px-3 py-1.5 rounded-lg rounded-bl-sm text-[10px]"
                     style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                    Hey, how are you doing?
                </div>
                <div className="self-end max-w-[70%] px-3 py-1.5 rounded-lg rounded-br-sm text-[10px]"
                     style={{ background: 'var(--accent)', color: 'white' }}>
                    I'm great, thanks!
                </div>
                <div className="self-end text-[8px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    2:30 PM
                </div>
            </div>
        </div>
    );
}

export function WallpaperPicker({ isOpen, onClose }) {
    const selectedUser = useChatStore((state) => state.selectedUser);
    const conversationId = selectedUser?._id || "";

    const globalId = useWallpaperStore((state) => state.globalId);
    const conversationMap = useWallpaperStore((state) => state.conversationMap);
    const brightness = useWallpaperStore((state) => state.brightness);
    const customWallpapers = useWallpaperStore((state) => state.customWallpapers);
    const setGlobalWallpaper = useWallpaperStore((state) => state.setGlobalWallpaper);
    const setConversationWallpaper = useWallpaperStore((state) => state.setConversationWallpaper);
    const resetConversationWallpaper = useWallpaperStore((state) => state.resetConversationWallpaper);
    const setBrightness = useWallpaperStore((state) => state.setBrightness);
    const addCustomWallpaper = useWallpaperStore((state) => state.addCustomWallpaper);
    const removeCustomWallpaper = useWallpaperStore((state) => state.removeCustomWallpaper);
    const hasConversationOverride = useWallpaperStore((state) => state.hasConversationOverride);

    const fileInputRef = useRef(null);

    const activeId = conversationMap[conversationId] || globalId;
    const [previewId, setPreviewId] = useState(activeId);
    const [previewBrightness, setPreviewBrightness] = useState(brightness);
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [applyScope, setApplyScope] = useState(conversationId ? "conversation" : "global");

    const previewWallpaper = useMemo(() => {
        if (isCustomMode) return DEFAULT_WALLPAPER;
        if (previewId === "chatter-default") return DEFAULT_WALLPAPER;
        if (previewId.startsWith("custom-")) {
            return customWallpapers.find((w) => w.id === previewId) || DEFAULT_WALLPAPER;
        }
        return WALLPAPERS.find((w) => w.id === previewId) || DEFAULT_WALLPAPER;
    }, [previewId, customWallpapers, isCustomMode]);

    const handleSelect = useCallback((id) => {
        setPreviewId(id);
        setIsCustomMode(false);
    }, []);

    const handleApply = useCallback(() => {
        if (applyScope === "conversation" && conversationId) {
            setConversationWallpaper(conversationId, previewId);
            toast.success(`Wallpaper set for this chat`);
        } else {
            setGlobalWallpaper(previewId);
            toast.success("Wallpaper set for all chats");
        }
        setBrightness(previewBrightness);
        onClose();
    }, [applyScope, conversationId, previewId, previewBrightness, setConversationWallpaper, setGlobalWallpaper, setBrightness, onClose]);

    const handleReset = useCallback(() => {
        if (applyScope === "conversation" && conversationId && hasConversationOverride(conversationId)) {
            resetConversationWallpaper(conversationId);
            setPreviewId(globalId);
            toast.success("Reset to default");
        } else {
            setPreviewId("chatter-default");
            setPreviewBrightness(40);
        }
    }, [applyScope, conversationId, globalId, hasConversationOverride, resetConversationWallpaper]);

    const handleUpload = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error("Only JPG, PNG, WebP allowed");
            return;
        }
        if (file.size > MAX_CUSTOM_SIZE) {
            toast.error("Image must be under 10MB");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
            const id = addCustomWallpaper(reader.result, name);
            setPreviewId(id);
            setIsCustomMode(false);
            toast.success("Wallpaper uploaded");
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    }, [addCustomWallpaper]);

    if (!isOpen) return null;

    const overlayOpacity = previewBrightness / 100;
    const hasConversation = Boolean(conversationId);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl max-h-[90vh] flex flex-col"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                    <div>
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Chat Wallpaper
                        </h3>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            Choose a wallpaper for your chats
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

                {/* Scope toggle — only show when a conversation is open */}
                {hasConversation && (
                    <div className="px-5 pb-3 shrink-0">
                        <div className="flex rounded-lg p-0.5"
                             style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                            <button onClick={() => setApplyScope("conversation")}
                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-[11px] font-medium transition-all"
                                    style={{
                                        background: applyScope === "conversation" ? 'var(--accent)' : 'transparent',
                                        color: applyScope === "conversation" ? 'white' : 'var(--text-muted)',
                                    }}>
                                <MessageCircle className="h-3 w-3" />
                                This chat
                            </button>
                            <button onClick={() => setApplyScope("global")}
                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-[11px] font-medium transition-all"
                                    style={{
                                        background: applyScope === "global" ? 'var(--accent)' : 'transparent',
                                        color: applyScope === "global" ? 'white' : 'var(--text-muted)',
                                    }}>
                                <Globe className="h-3 w-3" />
                                All chats
                            </button>
                        </div>
                    </div>
                )}

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">

                    {/* Preview */}
                    <PreviewPane wallpaper={previewWallpaper} overlayOpacity={overlayOpacity} />

                    {/* Default option */}
                    <button onClick={() => handleSelect("chatter-default")}
                            className="w-full flex items-center gap-3 rounded-lg p-2.5 transition-colors"
                            style={{
                                border: previewId === "chatter-default" && !isCustomMode ? '1px solid var(--accent)' : '1px solid var(--border)',
                                background: previewId === "chatter-default" && !isCustomMode ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                            }}>
                        <div className="h-10 w-10 rounded-md shrink-0"
                             style={{ background: DEFAULT_WALLPAPER.value }} />
                        <div className="flex-1 text-left">
                            <p className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>Default</p>
                            <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Chatter signature wallpaper</p>
                        </div>
                        {previewId === "chatter-default" && !isCustomMode && (
                            <Check className="h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                        )}
                    </button>

                    {/* Categories */}
                    {CATEGORIES.map((cat) => {
                        const wallpapers = getWallpapersByCategory(cat.id);
                        if (wallpapers.length === 0) return null;
                        return (
                            <div key={cat.id}>
                                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                                   style={{ color: 'var(--text-muted)' }}>
                                    {cat.name}
                                </p>
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                                    {wallpapers.map((wp) => (
                                        <Thumbnail
                                            key={wp.id}
                                            wallpaper={wp}
                                            isSelected={previewId === wp.id && !isCustomMode}
                                            onClick={() => handleSelect(wp.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Custom uploads */}
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                           style={{ color: 'var(--text-muted)' }}>
                            Custom
                        </p>
                        <input type="file" ref={fileInputRef} onChange={handleUpload}
                               accept="image/jpeg,image/png,image/webp" className="hidden" />
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                            <button onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center justify-center rounded-lg p-2 h-20 transition-colors"
                                    style={{ border: '1px dashed var(--accent)', background: 'var(--accent-muted)' }}>
                                <Upload className="h-4 w-4 mb-1" style={{ color: 'var(--accent)' }} />
                                <span className="text-[9px] font-medium" style={{ color: 'var(--accent)' }}>Upload</span>
                            </button>
                            {customWallpapers.map((wp) => (
                                <div key={wp.id} className="relative">
                                    <Thumbnail
                                        wallpaper={wp}
                                        isSelected={previewId === wp.id && !isCustomMode}
                                        onClick={() => handleSelect(wp.id)}
                                        isCustom
                                    />
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        removeCustomWallpaper(wp.id);
                                        if (previewId === wp.id) setPreviewId("chatter-default");
                                    }}
                                            className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full z-10"
                                            style={{ background: 'var(--danger)', color: 'white' }}>
                                        <X className="h-2.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <p className="text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>
                            {customWallpapers.length}/5 wallpapers
                        </p>
                    </div>

                    {/* Brightness */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider"
                               style={{ color: 'var(--text-muted)' }}>
                                Brightness
                            </p>
                            <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                                {previewBrightness}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={previewBrightness}
                            onChange={(e) => setPreviewBrightness(Number(e.target.value))}
                            className="w-full h-1 rounded-full appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, var(--accent) ${previewBrightness}%, var(--bg-elevated) ${previewBrightness}%)`,
                            }}
                        />
                        <div className="flex justify-between mt-1">
                            <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Bright</span>
                            <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Dark</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 flex items-center justify-between shrink-0"
                     style={{ borderTop: '1px solid var(--border)' }}>
                    <button onClick={handleReset}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <RotateCcw className="h-3 w-3" />
                        Reset
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose}
                                className="rounded-lg px-4 py-2 text-[11px] font-medium transition-colors"
                                style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>
                            Cancel
                        </button>
                        <button onClick={handleApply}
                                className="rounded-lg px-5 py-2 text-[11px] font-semibold text-white transition-colors"
                                style={{ background: 'var(--accent)' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}>
                            {applyScope === "conversation" ? "Set for this chat" : "Set for all chats"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
