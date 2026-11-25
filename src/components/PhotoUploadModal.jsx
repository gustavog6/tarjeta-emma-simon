import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabase';
import { formatDbError } from '../utils/errorMessages';
import { GALLERY_BUCKET } from './Gallery';

const PhotoUploadModal = ({ isOpen, onClose, guest, onUploaded }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        setFile(selected);
        setPreview(URL.createObjectURL(selected));
        setErrorMsg(null);
        setSuccess(false);
    };

    const handleUpload = async () => {
        if (!file || !guest) return;

        setUploading(true);
        setErrorMsg(null);

        try {
            const options = {
                maxSizeMB: 0.6,
                maxWidthOrHeight: 1200,
                useWebWorker: true,
            };
            const compressed = await imageCompression(file, options);

            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `${guest.id}_${Date.now()}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(GALLERY_BUCKET)
                .upload(filePath, compressed);

            if (uploadError) throw uploadError;

            const { error: dbError } = await supabase
                .from('gallery_photos')
                .insert({
                    guest_id: guest.id,
                    storage_path: filePath,
                    status: 'pending',
                });

            if (dbError) throw dbError;

            setSuccess(true);
            if (onUploaded) onUploaded();
            setTimeout(() => {
                onClose();
                setFile(null);
                setPreview(null);
                setSuccess(false);
            }, 2500);
        } catch (err) {
            console.error('[PhotoUploadModal] Error:', err);
            setErrorMsg(formatDbError(err));
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        if (uploading) return;
        setFile(null);
        setPreview(null);
        setErrorMsg(null);
        setSuccess(false);
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 safe-overlay">
                <motion.div
                    className="absolute inset-0 bg-black/60 modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                />

                <motion.div
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 p-6 border-2 border-primary/20 modal-sheet overflow-y-auto"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>

                    <div className="text-center mb-6">
                        <h3 className="font-heading text-4xl text-primary">Compartir Foto</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Sube un momento especial para la galería compartida
                        </p>
                    </div>

                    {success ? (
                        <div className="py-8 text-center">
                            <CheckCircle2 size={48} className="mx-auto mb-2 text-green-600" />
                            <p className="font-semibold text-gray-700 text-lg">¡Foto enviada con éxito!</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Tu foto está en revisión y aparecerá pronto en la galería 📸
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {preview ? (
                                <div className="relative rounded-xl overflow-hidden aspect-square max-h-64 mx-auto border border-gray-200">
                                    <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => {
                                            setFile(null);
                                            setPreview(null);
                                        }}
                                        className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 cursor-pointer"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-2xl p-8 hover:bg-primary/5 transition-colors cursor-pointer">
                                    <UploadCloud size={40} className="text-primary mb-2" />
                                    <span className="text-sm font-semibold text-gray-600">Toca para elegir una foto</span>
                                    <span className="text-xs text-gray-400 mt-1">JPG, PNG o WEBP</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            )}

                            {errorMsg && (
                                <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-lg">
                                    <AlertCircle size={16} />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className={`w-full py-3.5 rounded-full font-bold transition-all cursor-pointer ${
                                    file && !uploading
                                        ? 'bg-primary text-white hover:bg-secondary shadow-md'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {uploading ? 'Comprimiendo y subiendo...' : 'Subir foto'}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PhotoUploadModal;
