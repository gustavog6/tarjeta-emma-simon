import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Image as ImageIcon, ZoomIn } from 'lucide-react';
import { evento } from '../config/evento';
import { supabase } from '../lib/supabase';
import PhotoUploadModal from './PhotoUploadModal';
import PhotoViewerModal from './PhotoViewerModal';

const Gallery = ({ invitado }) => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const puedeSubir = Boolean(invitado?.puede_subir_fotos);

    const loadPhotos = async () => {
        try {
            if (!supabase) return;
            const { data, error } = await supabase
                .from('fotos')
                .select('*, invitados(nombre, apellido)')
                .eq('estado', 'aprobada')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                const photoUrls = data.map((item) => {
                    const { data: pubData } = supabase.storage
                        .from('galeria')
                        .getPublicUrl(item.storage_path);
                    return { ...item, url: pubData.publicUrl };
                });
                setPhotos(photoUrls);
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

    if (!evento.galeria?.habilitada) return null;

    return (
        <section className="py-20 px-4 bg-secondary/5 relative overflow-hidden">
            <div className="max-w-5xl mx-auto text-center relative z-10">
                <div className="mb-10">
                    <h2 className="font-heading text-5xl text-primary mb-2">Galería de Recuerdos</h2>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                        Toca cualquier foto para verla y descargarla en alta calidad.
                    </p>

                    {puedeSubir && (
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {photos.map((photo, idx) => (
                            <motion.div
                                key={photo.id || idx}
                                onClick={() => setSelectedPhoto(photo)}
                                className="aspect-square rounded-2xl overflow-hidden shadow-md bg-white border border-primary/10 group relative cursor-pointer"
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <img
                                    src={photo.url}
                                    alt="Foto de boda"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    {/* <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold">
                                        <ZoomIn size={14} /> Ver y descargar
                                    </div> */}
                                </div>
                            </motion.div>
                        ))}
                    </div>
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

            <PhotoUploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                invitado={invitado}
                onUploaded={loadPhotos}
            />

            <PhotoViewerModal
                isOpen={Boolean(selectedPhoto)}
                onClose={() => setSelectedPhoto(null)}
                photo={selectedPhoto}
            />
        </section>
    );
};

export default Gallery;
