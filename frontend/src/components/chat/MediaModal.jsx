import { X, Download } from "lucide-react";

export function MediaModal({ mediaUrl, isOpen, onClose, isVideo = false }) {
    if (!isOpen || !mediaUrl) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
            <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl"
                 style={{ background: 'var(--bg-surface)' }}>
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                    <a href={mediaUrl}
                       target="_blank"
                       rel="noreferrer"
                       download
                       className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                       style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.8)' }}
                       title="Download">
                        <Download className="h-4 w-4" />
                    </a>
                    <button onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                            style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.8)' }}
                            title="Close">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center justify-center p-2">
                    {isVideo ? (
                        <video src={mediaUrl} controls autoPlay
                               className="max-h-[80vh] max-w-[85vw] rounded-lg" />
                    ) : (
                        <img src={mediaUrl} alt="Full preview"
                             className="max-h-[80vh] max-w-[85vw] object-contain rounded-lg" />
                    )}
                </div>
            </div>
        </div>
    );
}
