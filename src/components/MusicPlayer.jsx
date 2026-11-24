import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';

/**
 * MusicPlayer
 * ─────────────────────────────────────────────────────
 * Botón flotante (bottom-right) para reproducir/pausar.
 * Si autoPlayOnMount es true, inicia la reproducción automáticamente
 * al abrir la invitación.
 */
const MusicPlayer = ({ autoPlayOnMount = false }) => {
    const { config } = useConfig();
    const { src } = config.musica;
    const audioRef      = useRef(null);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        if (autoPlayOnMount && audioRef.current) {
            audioRef.current.play()
                .then(() => setPlaying(true))
                .catch(() => {
                    // Si el navegador bloquea, queda en pausa para interacción manual
                    setPlaying(false);
                });
        }
    }, [autoPlayOnMount]);

    const toggle = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (playing) {
            audio.pause();
            setPlaying(false);
        } else {
            audio.play().then(() => setPlaying(true)).catch(() => {});
        }
    };

    return (
        <>
            <audio
                ref={audioRef}
                src={src}
                loop
                preload="auto"
            />

            <motion.button
                onClick={toggle}
                className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={playing ? 'Pausar música' : 'Reproducir música'}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {playing ? (
                        <motion.span
                            key="playing"
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 90 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Ícono animado de ondas cuando reproduce */}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="2"  y="8" width="3" height="8" rx="1.5" className="animate-[musicBar_1s_ease-in-out_infinite]" />
                                <rect x="7"  y="4" width="3" height="16" rx="1.5" className="animate-[musicBar_1s_ease-in-out_0.2s_infinite]" />
                                <rect x="12" y="6" width="3" height="12" rx="1.5" className="animate-[musicBar_1s_ease-in-out_0.4s_infinite]" />
                                <rect x="17" y="9" width="3" height="6"  rx="1.5" className="animate-[musicBar_1s_ease-in-out_0.1s_infinite]" />
                            </svg>
                        </motion.span>
                    ) : (
                        <motion.span
                            key="paused"
                            initial={{ opacity: 0, rotate: 90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: -90 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Music size={20} />
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>
        </>
    );
};

export default MusicPlayer;
