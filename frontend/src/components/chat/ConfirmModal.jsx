import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Trash2, Info, X } from "lucide-react";

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    icon = null,
}) {
    const overlayRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const colors = {
        danger: { accent: "var(--danger)", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
        warning: { accent: "var(--warning, #f59e0b)", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
        info: { accent: "var(--accent)", bg: "var(--accent-muted)", border: "var(--accent)" },
        primary: { accent: "var(--accent)", bg: "var(--accent-muted)", border: "var(--accent)" },
    }[variant] || { accent: "var(--accent)", bg: "var(--accent-muted)", border: "var(--accent)" };

    const defaultIcon = variant === "danger"
        ? <Trash2 className="h-5 w-5" style={{ color: colors.accent }} />
        : variant === "warning"
        ? <AlertTriangle className="h-5 w-5" style={{ color: colors.accent }} />
        : <Info className="h-5 w-5" style={{ color: colors.accent }} />;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div
                className="w-full max-w-sm rounded-2xl overflow-hidden animate-in"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header icon */}
                <div className="flex justify-center pt-6 pb-2">
                    <div
                        className="h-12 w-12 rounded-full flex items-center justify-center"
                        style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                    >
                        {icon || defaultIcon}
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-4 text-center">
                    <h3 className="text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                        {title}
                    </h3>
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {message}
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 px-4 pb-4">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl py-2.5 text-[11px] font-semibold transition-colors"
                        style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border)",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-elevated)"}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className="flex-1 rounded-xl py-2.5 text-[11px] font-semibold text-white transition-colors"
                        style={{ background: colors.accent }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
