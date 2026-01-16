import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Copy } from 'lucide-react';

const GiftModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Could add toast here
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 glass-panel border-2 border-primary/20 flex flex-col max-h-[90vh]"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    {/* Header with decorative background */}
                    <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md p-6 text-center border-b border-gray-100 shadow-sm">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-600" />
                        </button>

                        <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-primary">
                            <Gift size={32} />
                        </div>
                        <h3 className="font-heading text-3xl text-primary">Mesa de Regalos</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                            Su presencia es nuestro mejor regalo, pero si desean tener un detalle con nosotros:
                        </p>
                    </div>

                    <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                        {/* Bank Account 1 */}
                        <div className="relative">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold text-gray-500 text-lg tracking-widest ">Banco Banesco</h4>
                                <span className="text-xs bg-primary text-white px-3 py-1 rounded-full font-bold shadow-sm">Pago Móvil</span>
                            </div>

                            <div className="bg-secondary/20 py-2 px-4 rounded-xl border border-primary/20 flex items-center justify-between gap-3 shadow-inner mb-4">
                                <code className="text-gray-600 font-mono text-xl md:text-2xl font-bold tracking-wider">0424-9743171</code>
                                <button
                                    onClick={() => copyToClipboard('04249743171')}
                                    className="p-2 bg-white rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                                    title="Copiar"
                                >
                                    <Copy size={20} />
                                </button>
                            </div>

                            <div className="bg-secondary/20 py-2 px-4 rounded-xl border border-primary/20 flex items-center justify-between gap-3 shadow-inner">
                                <code className="text-gray-600 font-mono text-xl md:text-2xl font-bold tracking-wider">26.513.313</code>
                                <button
                                    onClick={() => copyToClipboard('26513313')}
                                    className="p-2 bg-white rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                                    title="Copiar"
                                >
                                    <Copy size={20} />
                                </button>
                            </div>

                            <div className="mt-3 flex justify-between text-sm text-gray-500 px-2">
                                <span>Titular: <strong className="text-gray-600">Emma González</strong></span>
                            </div>
                        </div>

                        {/* Bank Account 2 */}
                        <div className="relative">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold text-gray-500 text-lg tracking-widest ">Banco Banesco</h4>
                                <span className="text-xs bg-primary text-white px-3 py-1 rounded-full font-bold shadow-sm">Pago Móvil</span>
                            </div>

                            <div className="bg-secondary/20 py-2 px-4 rounded-xl border border-primary/20 flex items-center justify-between gap-3 shadow-inner mb-4">
                                <code className="text-gray-600 font-mono text-xl md:text-2xl font-bold tracking-wider">0414-0110568</code>
                                <button
                                    onClick={() => copyToClipboard('04140110568')}
                                    className="p-2 bg-white rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                                    title="Copiar"
                                >
                                    <Copy size={20} />
                                </button>
                            </div>

                            <div className="bg-secondary/20 py-2 px-4 rounded-xl border border-primary/20 flex items-center justify-between gap-3 shadow-inner">
                                <code className="text-gray-600 font-mono text-xl md:text-2xl font-bold tracking-wider">17.047.573</code>
                                <button
                                    onClick={() => copyToClipboard('17047573')}
                                    className="p-2 bg-white rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                                    title="Copiar"
                                >
                                    <Copy size={20} />
                                </button>
                            </div>

                            <div className="mt-3 flex justify-between text-sm text-gray-500 px-2">
                                <span>Titular: <strong className="text-gray-600">Simón España</strong></span>
                            </div>
                        </div>

                        {/* Facebank / Other */}
                        {/* <div className="relative border-t border-gray-100 pt-6">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-gray-500 text-lg tracking-wider">Facebank International Bank</h4>
                                <span className="text-xs bg-primary text-white px-3 py-1 rounded-full font-bold shadow-sm">Cuenta Corriente</span>
                            </div>

                            <div className="bg-secondary/20 py-2 px-4 rounded-xl border border-primary/20 flex items-center justify-between gap-3 shadow-inner">
                                <code className="text-gray-600 font-mono text-lg md:text-xl font-bold">3271932193</code>
                                <button
                                    onClick={() => copyToClipboard('3271932193')}
                                    className="p-2 bg-white rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                                >
                                    <Copy size={20} />
                                </button>
                            </div>
                        </div> */}

                        {/* Binance / Other */}
                        <div className="relative border-t border-gray-100 pt-6">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold text-gray-500 text-xl tracking-widest">Binance</h4>
                                <span className="text-xs bg-[#FCD535] text-white px-3 py-1 rounded-full font-bold shadow-sm">Binance Pay</span>
                            </div>

                            <div className="bg-secondary/20 py-2 px-4 rounded-xl border border-primary/20 flex items-center justify-between gap-3 shadow-inner">
                                <code className="text-gray-600 font-mono text-lg md:text-xl font-bold">197734304</code>
                                <button
                                    onClick={() => copyToClipboard('197734304')}
                                    className="p-2 bg-white rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                                >
                                    <Copy size={20} />
                                </button>
                            </div>

                            <div className="mt-3 flex justify-between text-sm text-gray-500 px-2">
                                <span>Titular: <strong className="text-gray-600">Emma González</strong></span>
                            </div>
                        </div>
                        <div className="relative border-t border-gray-100 pt-6">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold text-gray-500 text-xl tracking-widest">Binance</h4>
                                <span className="text-xs bg-[#FCD535] text-white px-3 py-1 rounded-full font-bold shadow-sm">Binance Pay</span>
                            </div>

                            <div className="bg-secondary/20 py-2 px-4 rounded-xl border border-primary/20 flex items-center justify-between gap-3 shadow-inner">
                                <code className="text-gray-600 font-mono text-lg md:text-xl font-bold">1081211093</code>
                                <button
                                    onClick={() => copyToClipboard('1081211093')}
                                    className="p-2 bg-white rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                                >
                                    <Copy size={20} />
                                </button>
                            </div>

                            <div className="mt-3 flex justify-between text-sm text-gray-500 px-2">
                                <span>Titular: <strong className="text-gray-600">Simón España</strong></span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 text-center bg-gray-50 text-xs text-gray-400">
                        ¡Muchas Gracias!
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GiftModal;
