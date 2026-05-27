import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ImageModal({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const MIN_SCALE = 1;
  const MAX_SCALE = 5;

  const zoom = useCallback((delta: number, cx?: number, cy?: number) => {
    setScale((prev) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta));
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "=" || e.key === "+") zoom(0.5);
      if (e.key === "-") zoom(-0.5);
      if (e.key === "0") reset();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, zoom, reset]);

  // Wheel zoom
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoom(e.deltaY < 0 ? 0.3 : -0.3);
  };

  // Drag pan
  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  };

  const onMouseUp = () => {
    setIsDragging(false);
    dragStart.current = null;
  };

  // Touch pinch zoom
  const lastTouch = useRef<{ dist: number; scale: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouch.current = { dist: Math.hypot(dx, dy), scale };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouch.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, lastTouch.current.scale * (dist / lastTouch.current.dist)));
      setScale(next);
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Toolbar */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button
            onClick={() => zoom(0.5)}
            disabled={scale >= MAX_SCALE}
            className="p-2 rounded-lg cursor-pointer bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition backdrop-blur-sm"
            title="Zoom in (+)"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => zoom(-0.5)}
            disabled={scale <= MIN_SCALE}
            className="p-2 rounded-lg cursor-pointer bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition backdrop-blur-sm"
            title="Zoom out (-)"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={reset}
            disabled={scale === 1 && offset.x === 0 && offset.y === 0}
            className="p-2 rounded-lg cursor-pointer bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition backdrop-blur-sm"
            title="Reset (0)"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg cursor-pointer bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-sm"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Zoom level indicator */}
        {scale !== 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-xs backdrop-blur-sm pointer-events-none">
            {Math.round(scale * 100)}%
          </div>
        )}

        {/* Image container */}
        <motion.div
          key="image"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden select-none"
          style={{
            width: "90vw",
            height: "90vh",
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
          }}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onClick={() => { if (scale === 1) zoom(1); }}
        >
          <div
            style={{
              transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
              transition: isDragging ? "none" : "transform 0.15s ease",
              width: "100%",
              height: "100%",
              position: "relative",
            }}
          >
            <Image
              src={src}
              alt="preview"
              fill
              className="object-contain pointer-events-none"
              draggable={false}
              sizes="90vw"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}