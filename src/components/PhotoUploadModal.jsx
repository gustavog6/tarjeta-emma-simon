import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabase';

const PhotoUploadModal = ({ isOpen, onClose, invitado, onUploaded }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;

        setFile(selected);
        setPreview(URL.createObjectURL(selected));
        setErrorMsg(null);
        setSuccess(false);
    };

    const handleUpload = async () => {
        if (!file || !invitado) return;

        setUploading(true);
        setErrorMsg(null);

        try {
            // Comprimir imagen client-side
            const options = {
                maxSizeMB: 0.6,
                maxWidthOrHeight: 1200,
                useWebWorker: true,
            };
            const compressed = await imageCompression(file, options);

            // Subir a Supabase Storage
            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `${invitado.id}_${Date.now()}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('galeria')
                .upload(filePath, compressed);

            if (uploadError) throw uploadError;

            // Registrar en tabla `fotos` en estado 'pendiente'
            const { error: dbError } = await supabase
                .from('fotos')
                .insert({
                    invitado_id: invitado.id,
                    storage_path: filePath,
                    estado: 'pendiente',
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
            setErrorMsg(err.message || 'Error al subir la imagen.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />

                <motion.div
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 glass-panel border-2 border-primary/20 p-6"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-heading text-3xl text-primary">Compartir una foto</h3>
                        <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 mb-6">
                        Sube una foto especial con los novios. Pasará por una breve revisión antes de publicarse en la galería.
                    </p>

                    {success ? (
                        <div className="py-8 text-center text-green-700">
                            <CheckCircle2 size={48} className="mx-auto mb-2 text-green-600" />
                            <h4 className="font-bold text-lg">¡Foto enviada!</h4>
                            <p className="text-xs text-gray-500 mt-1">Tu foto está en revisión y se mostrará pronto.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {preview ? (
                                <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 bg-black/5">
                                    <img src={preview} alt="Vista previa" className="w-full h-full object-contain" />
                                    <button
                                        onClick={() => { setFile(null); setPreview(null); }}
                                        className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5 hover:bg-black"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-xl p-8 cursor-pointer hover:bg-primary/5 transition-all text-center">
                                    <UploadCloud size={40} className="text-primary mb-2" />
                                    <span className="text-sm font-semibold text-gray-700">Toca para elegir una foto</span>
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
                                <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-2.5 rounded-lg border border-red-200">
                                    <AlertCircle size={16} />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2.5 rounded-full font-bold border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || uploading}
                                    className={`flex-1 py-2.5 rounded-full font-bold text-sm text-white transition-all cursor-pointer ${
                                        file && !uploading
                                            ? 'bg-primary hover:bg-secondary shadow-md'
                                            : 'bg-gray-300 cursor-not-allowed'
                                    }`}
                                >
                                    {uploading ? 'Subiendo...' : 'Enviar foto'}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PhotoUploadModal;
