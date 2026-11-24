import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Copy, Check } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { INVITATION_LIMITS, limitList } from '../config/invitationLimits';

const GiftModal = ({ isOpen, onClose }) => {
    const { config } = useConfig();
    const [copiedIndex, setCopiedIndex] = useState(null);

    if (!isOpen) return null;

    const copyToClipboard = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const datosBancarios = limitList(config.datosBancarios, INVITATION_LIMITS.datosBancarios.max);
    const { textos } = config;
    const { titulo, subtitulo } = textos.regalos;

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
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 glass-panel border-2 border-primary/20 flex flex-col modal-sheet"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    {/* Header */}
                    <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md p-6 text-center border-b border-gray-100 shadow-sm">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-600" />
                        </button>

                        <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-primary">
                            <Gift size={32} />
                        </div>
                        <h3 className="font-heading text-3xl text-primary">{titulo}</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                            {subtitulo}
                        </p>
                    </div>

                    <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                        {datosBancarios.map((item, index) => {
                            const isPagoMovil = item.tipo === 'Pago Móvil';
                            const isBinance = item.tipo === 'Binance Pay';

                            return (
                                <div key={index} className="relative border-b border-gray-100 last:border-b-0 pb-6 last:pb-0">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-semibold text-gray-600 text-lg tracking-wide">{item.banco}</h4>
                                        <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${
                                            isBinance ? 'bg-[#FCD535] text-gray-800' : 'bg-primary text-white'
                                        }`}>
                                            {item.tipo}
                                        </span>
                                    </div>

                                    {isPagoMovil && (
                                        <>
                                            <div className="bg-secondary/20 py-2 px-4 rounded-xl border border-primary/20 flex items-center justify-between gap-3 shadow-inner mb-3">
                                                <code className="text-gray-700 font-mono text-xl font-bold tracking-wider">{item.telefono}</code>
                                                <button
                                                    onClick={() => copyToClipboard(item.telefono.replace(/[- ]/g, ''), `tel-${index}`)}
                                                    className="p-2 bg-white rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-1"
                                                    title="Copiar"
                                                >
                                                    {copiedIndex === `tel-${index}` ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                                                </button>
                                            </div>

                                            <div className="bg-secondary/20 py-2 px-4 rounded-xl border border-primary/20 flex items-center justify-between gap-3 shadow-inner">
                                                <code className="text-gray-700 font-mono text-xl font-bold tracking-wider">{item.cedula}</code>
                                                <button
                                                    onClick={() => copyToClipboard(item.cedula.replace(/[.]/g, ''), `ci-${index}`)}
                                                    className="p-2 bg-white rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-1"
                                                    title="Copiar"
                                                >
                                                    {copiedIndex === `ci-${index}` ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {isBinance && (
                                        <div className="bg-secondary/20 py-2 px-4 rounded-xl border border-primary/20 flex items-center justify-between gap-3 shadow-inner">
                                            <code className="text-gray-700 font-mono text-xl font-bold tracking-wider">{item.id}</code>
                                            <button
                                                onClick={() => copyToClipboard(item.id, `bin-${index}`)}
                                                className="p-2 bg-white rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-1"
                                                title="Copiar"
                                            >
                                                {copiedIndex === `bin-${index}` ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                    )}

                                    <div className="mt-2 flex justify-between text-sm text-gray-500 px-2">
                                        <span>Titular: <strong className="text-gray-700">{item.titular}</strong></span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-4 text-center bg-gray-50 text-xs text-gray-400">
                        ¡Muchas Gracias por su cariño!
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GiftModal;
