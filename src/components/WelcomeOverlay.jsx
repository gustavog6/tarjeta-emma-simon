import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { useEventConfig } from '../context/EventConfigContext';
import { EVENT_LIMITS, clampText } from '../config/eventLimits';
import { formatHostsNames } from '../config/eventPresets';
import heroOrnament from '../assets/hero-ornament.png';

const WelcomeOverlay = ({ onEnter }) => {
    const { config } = useEventConfig();
    const hostsLabel = formatHostsNames({
        primary: { firstName: clampText(config.hosts?.primary?.firstName, EVENT_LIMITS.hosts.firstNameMax) },
        secondary: { firstName: clampText(config.hosts?.secondary?.firstName, EVENT_LIMITS.hosts.firstNameMax) },
    });
    const buttonLabel = clampText(
        config.copy?.welcome?.buttonLabel || 'Abrir invitación',
        EVENT_LIMITS.hero.welcomeButtonMax
    );
    const [soundEnabled, setSoundEnabled] = useState(true);

    const handleOpen = () => {
        onEnter({ soundEnabled });
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[100] min-h-dvh-safe safe-overlay bg-background flex flex-col items-center justify-center text-center select-none overflow-y-auto"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
            >
                <motion.img
                    src={heroOrnament}
                    alt="Decoración"
                    className="w-36 sm:w-40 md:w-48 aspect-square object-contain opacity-80 mb-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.8, scale: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                />

                <motion.p
                    className="font-heading text-5xl md:text-7xl text-primary mb-2 leading-tight break-anywhere max-w-xl"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.5 }}
                >
                    {hostsLabel}
                </motion.p>

                <motion.div
                    className="h-px w-16 bg-primary/30 my-6"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.7, delay: 0.9 }}
                />

                <motion.div
                    className="flex flex-col items-center gap-4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.1 }}
                >
                    <motion.button
                        onClick={handleOpen}
                        className="px-10 py-3.5 rounded-full bg-primary text-white font-body text-sm uppercase tracking-[0.25em] shadow-md hover:bg-secondary transition-colors cursor-pointer"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {buttonLabel}
                    </motion.button>

                    <button
                        type="button"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                            soundEnabled
                                ? 'bg-primary/10 border-primary/30 text-primary'
                                : 'bg-gray-100 border-gray-300 text-gray-500'
                        }`}
                    >
                        {soundEnabled ? (
                            <>
                                <Volume2 size={15} />
                                <span>Música: <strong>Activada</strong> (toca para silenciar)</span>
                            </>
                        ) : (
                            <>
                                <VolumeX size={15} />
                                <span>Música: <strong>Silenciada</strong> (toca para activar)</span>
                            </>
                        )}
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default WelcomeOverlay;
