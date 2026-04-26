import React, { useEffect } from 'react';

interface Props {
  imageUrl: string;
  onClose: () => void;
  alt?: string;
}

/** Lightbox – רק תמונה (בלי תגובות/טקסט). תגובות נפתחות רק בלחיצה על אייקון התגובה ב־PostCard. */
export default function PostDetailModal({ imageUrl, onClose, alt = 'LEGO build' }: Props) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center"
        aria-label="Close"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <div className="relative z-10 max-w-[min(100vw,1200px)] max-h-[90vh] w-full h-full flex items-center justify-center p-1">
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
}
