import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";

export function ImageViewer({ images, initialIndex = 0, isOpen, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [swipeStart, setSwipeStart] = useState(null);
    const [transitioning, setTransitioning] = useState(false);
    const imageRef = useRef(null);

    useEffect(() => {
        setCurrentIndex(initialIndex);
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, [initialIndex, isOpen]);

    const resetTransform = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);

    const goTo = useCallback((index) => {
        if (transitioning) return;
        setTransitioning(true);
        resetTransform();
        setTimeout(() => {
            setCurrentIndex(index);
            setTimeout(() => setTransitioning(false), 50);
        }, 150);
    }, [transitioning, resetTransform]);

    const goNext = useCallback(() => {
        if (currentIndex < images.length - 1) goTo(currentIndex + 1);
    }, [currentIndex, images.length, goTo]);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) goTo(currentIndex - 1);
    }, [currentIndex, goTo]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") goNext();
            if (e.key === "ArrowLeft") goPrev();
            if (e.key === "0") resetTransform();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, goNext, goPrev, resetTransform]);

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        setZoom((prev) => {
            const next = Math.min(Math.max(prev + delta, 0.5), 5);
            if (next <= 1) setPan({ x: 0, y: 0 });
            return next;
        });
    }, []);

    useEffect(() => {
        const el = imageRef.current;
        if (!el || !isOpen) return;
        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, [isOpen, handleWheel]);

    const handleMouseDown = useCallback((e) => {
        if (zoom > 1) {
            e.preventDefault();
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    }, [zoom, pan]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => setIsDragging(false), []);

    const handleTouchStart = useCallback((e) => {
        if (e.touches.length === 1) {
            setSwipeStart({ x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() });
        }
    }, []);

    const handleTouchEnd = useCallback((e) => {
        if (!swipeStart || zoom > 1) { setSwipeStart(null); return; }
        const touch = e.changedTouches[0];
        const dx = touch.clientX - swipeStart.x;
        const dy = touch.clientY - swipeStart.y;
        const dt = Date.now() - swipeStart.time;
        setSwipeStart(null);
        if (Math.abs(dx) > 50 && Math.abs(dy) < Math.abs(dx) && dt < 400) {
            if (dx < 0) goNext();
            else goPrev();
        }
    }, [swipeStart, zoom, goNext, goPrev]);

    const handleDoubleClick = useCallback(() => {
        if (zoom > 1) resetTransform();
        else setZoom(2.5);
    }, [zoom, resetTransform]);

    if (!isOpen || !images?.length) return null;

    const currentSrc = images[currentIndex];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center select-none"
             style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)" }}>

            {/* Close */}
            <button onClick={onClose}
                    className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full transition-all"
                    style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}>
                <X className="h-5 w-5" />
            </button>

            {/* Download */}
            <a href={currentSrc}
               target="_blank"
               rel="noreferrer"
               download
               className="absolute top-4 right-16 z-20 flex h-10 w-10 items-center justify-center rounded-full transition-all"
               style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" }}
               onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
               onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
               title="Download">
                <Download className="h-5 w-5" />
            </a>

            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full text-xs font-medium"
                 style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)" }}>
                {currentIndex + 1} / {images.length}
            </div>

            {/* Prev */}
            {currentIndex > 0 && (
                <button onClick={goPrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full transition-all"
                        style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}>
                    <ChevronLeft className="h-6 w-6" />
                </button>
            )}

            {/* Next */}
            {currentIndex < images.length - 1 && (
                <button onClick={goNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full transition-all"
                        style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}>
                    <ChevronRight className="h-6 w-6" />
                </button>
            )}

            {/* Image */}
            <div ref={imageRef}
                 className="flex h-full w-full items-center justify-center overflow-hidden"
                 style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
                 onMouseDown={handleMouseDown}
                 onMouseMove={handleMouseMove}
                 onMouseUp={handleMouseUp}
                 onMouseLeave={handleMouseUp}
                 onTouchStart={handleTouchStart}
                 onTouchEnd={handleTouchEnd}
                 onDoubleClick={handleDoubleClick}>
                <img key={currentIndex}
                     src={currentSrc}
                     alt={`Image ${currentIndex + 1}`}
                     draggable={false}
                     className="pointer-events-none max-h-[90vh] max-w-[90vw] object-contain"
                     style={{
                         transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                         transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.25,0.1,0.25,1), opacity 0.2s ease",
                         opacity: transitioning ? 0 : 1,
                     }} />
            </div>
        </div>
    );
}
