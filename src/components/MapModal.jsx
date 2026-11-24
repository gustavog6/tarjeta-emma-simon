import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin } from 'lucide-react';

const MapModal = ({ isOpen, onClose, locationUrl, title, externalLink }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 safe-overlay">
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/60 modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden relative z-10 flex flex-col modal-map-sheet"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    <div className="p-4 flex justify-between items-center bg-secondary/20 border-b border-primary/10 shrink-0">
                        <h3 className="font-heading text-2xl text-primary">{title}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer">
                            <X className="w-6 h-6 text-gray-600" />
                        </button>
                    </div>

                    <div className="flex-1 w-full relative min-h-[420px] md:min-h-[520px]">
                        <iframe
                            src={locationUrl}
                            className="absolute inset-0 w-full h-full"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>

                    {externalLink && (
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center shrink-0">
                            <a
                                href={externalLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-primary font-bold hover:underline text-sm"
                            >
                                <MapPin size={18} />
                                Abrir en Google Maps
                            </a>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MapModal;
