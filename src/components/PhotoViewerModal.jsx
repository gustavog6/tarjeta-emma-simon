import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, User, ChevronLeft, ChevronRight } from 'lucide-react';

const PhotoViewerModal = ({ isOpen, onClose, photos = [], currentIndex = 0, onChangeIndex, photo: singlePhoto }) => {
    const list = photos.length > 0 ? photos : singlePhoto ? [singlePhoto] : [];
    const safeIndex = Math.max(0, Math.min(currentIndex, list.length - 1));
    const photo = list[safeIndex] || null;
    const hasMultiple = list.length > 1;

    const goPrev = () => {
        if (!hasMultiple || !onChangeIndex) return;
        onChangeIndex((safeIndex - 1 + list.length) % list.length);
    };

    const goNext = () => {
        if (!hasMultiple || !onChangeIndex) return;
        onChangeIndex((safeIndex + 1) % list.length);
    };

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'ArrowRight') goNext();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, safeIndex, list.length]);

    if (!isOpen || !photo) return null;

    const handleDownload = async () => {
        try {
            const response = await fetch(photo.url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `recuerdo-evento-${photo.id || 'foto'}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            window.open(photo.url, '_blank');
        }
    };

    const authorLabel =
        photo.author_name ||
        (photo.guests ? `${photo.guests.first_name} ${photo.guests.last_name}` : 'Recuerdo del evento');

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 safe-overlay">
                <motion.div
                    className="absolute inset-0 bg-black/80 modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />

                <motion.div
                    className="relative z-10 max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-primary/20 modal-sheet"
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                >
                    <div className="p-4 px-6 bg-background/95 flex justify-between items-center border-b border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
                            <User size={16} className="text-primary shrink-0" />
                            <span className="truncate font-medium">{authorLabel}</span>
                            {hasMultiple && (
                                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-semibold shrink-0">
                                    {safeIndex + 1} / {list.length}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-black/5 rounded-full text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                            aria-label="Cerrar"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden bg-black/5 flex items-center justify-center p-2 min-h-[300px] max-h-[65vh] relative select-none">
                        {hasMultiple && (
                            <button
                                onClick={goPrev}
                                className="absolute left-3 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-primary shadow-md flex items-center justify-center transition-all cursor-pointer"
                                aria-label="Foto anterior"
                            >
                                <ChevronLeft size={22} />
                            </button>
                        )}

                        <img
                            key={photo.id || safeIndex}
                            src={photo.url}
                            alt="Foto ampliada"
                            className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
                        />

                        {hasMultiple && (
                            <button
                                onClick={goNext}
                                className="absolute right-3 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-primary shadow-md flex items-center justify-center transition-all cursor-pointer"
                                aria-label="Foto siguiente"
                            >
                                <ChevronRight size={22} />
                            </button>
                        )}
                    </div>

                    <div className="p-4 px-6 bg-white border-t border-gray-100 flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-400">
                            {photo.created_at
                                ? new Date(photo.created_at).toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                  })
                                : ''}
                        </span>
                        <button
                            onClick={handleDownload}
                            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-full hover:bg-secondary transition-colors text-xs font-semibold shadow-md cursor-pointer"
                        >
                            <Download size={14} />
                            Descargar foto
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PhotoViewerModal;
