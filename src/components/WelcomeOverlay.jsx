import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { evento } from '../config/evento';
import goldSilhouette from '../assets/corazon-verde-solo-2.png';

/**
 * WelcomeOverlay
 * ─────────────────────────────────────────────────────
 * Pantalla de bienvenida.
 * Por defecto tiene la música activada, pero permite
 * al usuario alternar a silenciar con un botón claro.
 */
const WelcomeOverlay = ({ onEnter }) => {
    const { novia, novio } = evento.novios;
    const { boton } = evento.textos.overlay;
    const [soundEnabled, setSoundEnabled] = useState(true);

    const handleOpen = () => {
        onEnter({ soundEnabled });
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center px-6 text-center select-none"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
            >
                {/* Imagen decorativa */}
                <motion.img
                    src={goldSilhouette}
                    alt="Decoración"
                    className="w-40 md:w-48 opacity-80 mb-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.8, scale: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                />

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mb-3"
                >
                    <span className="text-xs uppercase tracking-[0.3em] text-primary font-bold border border-primary/30 px-3 py-1 rounded-full bg-white/40">
                        Nuestra Boda
                    </span>
                </motion.div>

                {/* Nombre de los novios */}
                <motion.p
                    className="font-heading text-5xl md:text-7xl text-primary mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.6 }}
                >
                    {novio.nombre} &amp; {novia.nombre}
                </motion.p>

                {/* Separador */}
                <motion.div
                    className="h-px w-16 bg-primary/30 my-4"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                />

                {/* Selector de sonido (Por defecto activado) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1 }}
                    className="mb-6"
                >
                    <button
                        type="button"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide border transition-all cursor-pointer ${
                            soundEnabled
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-gray-100 border-gray-300 text-gray-500'
                        }`}
                        title="Toca para cambiar preferencia de sonido"
                    >
                        {soundEnabled ? (
                            <>
                                <Volume2 size={16} className="text-primary animate-pulse" />
                                <span>Música: <strong>Activada</strong> (toca para silenciar)</span>
                            </>
                        ) : (
                            <>
                                <VolumeX size={16} className="text-gray-400" />
                                <span>Música: <strong>Silenciada</strong> (toca para activar)</span>
                            </>
                        )}
                    </button>
                </motion.div>

                {/* Botón de entrada principal */}
                <motion.button
                    onClick={handleOpen}
                    className="px-10 py-3.5 rounded-full bg-primary text-white font-body tracking-widest uppercase text-sm shadow-lg hover:bg-secondary transition-all duration-300 cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                >
                    {boton}
                </motion.button>
            </motion.div>
        </AnimatePresence>
    );
};

export default WelcomeOverlay;
