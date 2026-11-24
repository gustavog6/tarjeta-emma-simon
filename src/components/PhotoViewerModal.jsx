import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, User } from 'lucide-react';

const PhotoViewerModal = ({ isOpen, onClose, photo }) => {
    if (!isOpen || !photo) return null;

    const handleDownload = async () => {
        try {
            const response = await fetch(photo.url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `boda-recuerdo-${photo.id || 'foto'}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            window.open(photo.url, '_blank');
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />

                {/* Modal Window */}
                <motion.div
                    className="relative z-10 max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-primary/20 max-h-[90vh]"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    {/* Header */}
                    <div className="p-4 px-6 bg-background/95 flex justify-between items-center border-b border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User size={16} className="text-primary" />
                            <span>
                                {photo.autor ||
                                    (photo.invitados ? `${photo.invitados.nombre} ${photo.invitados.apellido}` : 'Recuerdo de la boda')}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-black/5 rounded-full text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Image Container */}
                    <div className="flex-1 overflow-hidden bg-black/5 flex items-center justify-center p-2 min-h-[300px] max-h-[65vh]">
                        <img
                            src={photo.url}
                            alt="Foto ampliada"
                            className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
                        />
                    </div>

                    {/* Footer */}
                    <div className="p-4 px-6 bg-white border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                            {photo.created_at ? new Date(photo.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
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
