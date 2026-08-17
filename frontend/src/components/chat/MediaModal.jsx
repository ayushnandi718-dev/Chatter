import { X, Download } from "lucide-react";

export function MediaModal({ mediaUrl, isOpen, onClose, isVideo = false }) {
    if (!isOpen || !mediaUrl) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-neutral-900/90 shadow-2xl border border-white/10">
                {/* Header Actions */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                    <a
                        href={mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-white"
                        title="Open in new tab"
                    >
                        <Download className="h-4 w-4" />
                    </a>
                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-white"
                        title="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Media Display */}
                <div className="flex items-center justify-center p-2">
                    {isVideo ? (
                        <video src={mediaUrl} controls autoPlay className="max-h-[80vh] max-w-[85vw] rounded-xl" />
                    ) : (
                        <img
                            src={mediaUrl}
                            alt="Full preview"
                            className="max-h-[80vh] max-w-[85vw] object-contain rounded-xl"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
