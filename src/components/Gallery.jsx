import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image as ImageIcon, Images, X } from 'lucide-react';
import { useEventConfig } from '../context/EventConfigContext';
import { EVENT_LIMITS, limitList } from '../config/eventLimits';
import { supabase } from '../lib/supabase';
import PhotoUploadModal from './PhotoUploadModal';
import PhotoViewerModal from './PhotoViewerModal';

const PREVIEW_LIMIT = EVENT_LIMITS.gallery.previewMax;
export const GALLERY_BUCKET = 'event-gallery';

/** Resolves public URL supporting `event-gallery`, legacy `galeria`, and direct seed URLs */
export function resolvePhotoPublicUrl(storagePath = '') {
    if (!storagePath) return '';
    if (/^(https?:|data:)/i.test(storagePath)) return storagePath;
    if (storagePath.startsWith('legacy:')) {
        return supabase.storage.from('galeria').getPublicUrl(storagePath.slice(7)).data.publicUrl;
    }
    return supabase.storage.from(GALLERY_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

const Gallery = ({ guest }) => {
    const { config } = useEventConfig();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isAllModalOpen, setIsAllModalOpen] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(null);

    const canUpload = Boolean(guest?.can_upload_photos);

    const loadPhotos = async () => {
        try {
            if (!supabase) return;
            const { data, error } = await supabase.rpc('get_approved_photos');
            if (error) throw error;

            if (data && data.length > 0) {
                setPhotos(
                    data.map((item) => ({
                        ...item,
                        url: resolvePhotoPublicUrl(item.storage_path),
                    }))
                );
            } else {
                setPhotos([]);
            }
        } catch (err) {
            console.error('[Gallery] Error loading photos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPhotos();
    }, []);

    if (!config.gallery?.enabled) return null;
    if (!loading && photos.length === 0 && !canUpload) return null;

    const boundedPhotos = limitList(photos, EVENT_LIMITS.gallery.totalVisibleMax);
    const visiblePhotos = boundedPhotos.slice(0, PREVIEW_LIMIT);
    const extraCount = Math.max(0, boundedPhotos.length - PREVIEW_LIMIT);

    return (
        <section className="py-20 px-4 bg-background relative overflow-x-clip">
            <div className="max-w-5xl mx-auto text-center relative z-10 min-w-0">
                <div className="mb-10">
                    <h2 className="font-heading section-title-fluid text-primary mb-2">Galería de Recuerdos</h2>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                        Toca cualquier foto para recorrer la galería y descargar tus favoritas en alta calidad.
                    </p>

                    {canUpload && (
                        <div className="mt-6">
                            <button
                                onClick={() => setIsUploadOpen(true)}
                                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full hover:bg-secondary transition-colors text-sm font-semibold shadow-md cursor-pointer"
                            >
                                <Camera size={18} />
                                Subir mi foto
                            </button>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="py-12 text-center text-gray-400 text-xs uppercase tracking-widest">
                        Cargando fotos...
                    </div>
                ) : photos.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {visiblePhotos.map((photo, idx) => {
                                const isLastWithExtra = idx === PREVIEW_LIMIT - 1 && extraCount > 0;
                                return (
                                    <motion.div
                                        key={photo.id || idx}
                                        onClick={() =>
                                            isLastWithExtra ? setIsAllModalOpen(true) : setViewerIndex(idx)
                                        }
                                        className="aspect-square rounded-2xl overflow-hidden shadow-md bg-white border border-primary/10 group relative cursor-pointer"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <img
                                            src={photo.url}
                                            alt="Fotografía del evento"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                        {isLastWithExtra ? (
                                            <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-3">
                                                <span className="font-heading text-4xl leading-none">+{extraCount}</span>
                                                <span className="text-xs uppercase tracking-widest mt-1 font-semibold">
                                                    Ver todas
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {extraCount > 0 && (
                            <div className="mt-8">
                                <button
                                    onClick={() => setIsAllModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-white transition-all text-sm font-semibold shadow-sm cursor-pointer bg-white"
                                >
                                    <Images size={17} />
                                    Ver todas las fotos ({boundedPhotos.length})
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-12 px-6 rounded-2xl border border-primary/20 bg-white/60 max-w-md mx-auto text-center">
                        <ImageIcon size={40} className="mx-auto text-primary/40 mb-3" />
                        <p className="font-heading text-2xl text-primary mb-1">¡Sé el primero en compartir!</p>
                        <p className="text-xs text-gray-500">
                            Las fotos que suban los invitados aparecerán aquí tras ser aprobadas.
                        </p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isAllModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 safe-overlay">
                        <motion.div
                            className="absolute inset-0 bg-black/70 modal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAllModalOpen(false)}
                        />
                        <motion.div
                            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-4xl modal-sheet flex flex-col overflow-hidden border-2 border-primary/20"
                            initial={{ scale: 0.94, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.94, opacity: 0 }}
                        >
                            <div className="px-6 py-4 bg-background/95 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-heading text-3xl text-primary leading-tight">
                                        Galería Completa
                                    </h3>
                                    <p className="text-xs text-gray-500">{boundedPhotos.length} recuerdos compartidos</p>
                                </div>
                                <button
                                    onClick={() => setIsAllModalOpen(false)}
                                    className="p-2 hover:bg-black/5 rounded-full text-gray-500 cursor-pointer"
                                    aria-label="Cerrar galería"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-5 overflow-y-auto custom-scrollbar grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {boundedPhotos.map((photo, idx) => (
                                    <div
                                        key={photo.id || idx}
                                        onClick={() => setViewerIndex(idx)}
                                        className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-primary/10 cursor-pointer group"
                                    >
                                        <img
                                            src={photo.url}
                                            alt="Recuerdo"
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <PhotoUploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                guest={guest}
                onUploaded={loadPhotos}
            />

            <PhotoViewerModal
                isOpen={viewerIndex !== null}
                onClose={() => setViewerIndex(null)}
                photos={boundedPhotos}
                currentIndex={viewerIndex ?? 0}
                onChangeIndex={setViewerIndex}
            />
        </section>
    );
};

export default Gallery;
