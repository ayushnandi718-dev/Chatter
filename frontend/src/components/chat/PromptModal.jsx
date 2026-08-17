import { useState, useEffect, useRef } from "react";
import { Pencil, X } from "lucide-react";

export function PromptModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    defaultValue = "",
    placeholder = "",
    confirmText = "Save",
    cancelText = "Cancel",
    maxLength = 500,
    icon = null,
}) {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef(null);
    const overlayRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, defaultValue]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const trimmed = value.trim();
    const changed = trimmed !== defaultValue.trim();
    const isEmpty = trimmed.length === 0;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div
                className="w-full max-w-sm rounded-2xl overflow-hidden"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header icon */}
                <div className="flex justify-center pt-6 pb-2">
                    <div
                        className="h-12 w-12 rounded-full flex items-center justify-center"
                        style={{ background: "var(--accent-muted)", border: "1px solid var(--accent)" }}
                    >
                        {icon || <Pencil className="h-5 w-5" style={{ color: "var(--accent)" }} />}
                    </div>
                </div>

                {/* Title */}
                <div className="px-6 pb-3 text-center">
                    <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {title}
                    </h3>
                </div>

                {/* Input */}
                <div className="px-4 pb-2">
                    <div
                        className="rounded-xl overflow-hidden"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                    >
                        <textarea
                            ref={inputRef}
                            value={value}
                            onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
                            placeholder={placeholder}
                            rows={3}
                            className="w-full px-3 py-2.5 text-[12px] leading-relaxed resize-none outline-none"
                            style={{
                                background: "transparent",
                                color: "var(--text-primary)",
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    if (changed && !isEmpty) onConfirm(trimmed);
                                }
                            }}
                        />
                    </div>
                    <div className="flex justify-between mt-1.5 px-1">
                        <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                            Enter to save, Shift+Enter for new line
                        </p>
                        <p className="text-[9px]" style={{ color: value.length > maxLength * 0.9 ? "var(--danger)" : "var(--text-muted)" }}>
                            {value.length}/{maxLength}
                        </p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 px-4 pb-4 pt-2">
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
                        onClick={() => { if (changed && !isEmpty) onConfirm(trimmed); }}
                        disabled={!changed || isEmpty}
                        className="flex-1 rounded-xl py-2.5 text-[11px] font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: "var(--accent)" }}
                        onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = "0.85"; }}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
