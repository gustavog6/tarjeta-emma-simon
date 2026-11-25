import React from 'react';
import { motion } from 'framer-motion';
import { useEventConfig } from '../context/EventConfigContext';
import { EVENT_LIMITS, clampText } from '../config/eventLimits';
import { formatHostsNames } from '../config/eventPresets';
import heroOrnament from '../assets/hero-ornament.png';

const Hero = () => {
    const { config } = useEventConfig();
    const badge = clampText(config.copy?.hero?.badge, EVENT_LIMITS.hero.badgeMax);
    const hostsLabel = formatHostsNames({
        primary: { firstName: clampText(config.hosts?.primary?.firstName, EVENT_LIMITS.hosts.firstNameMax) },
        secondary: { firstName: clampText(config.hosts?.secondary?.firstName, EVENT_LIMITS.hosts.firstNameMax) },
    });

    return (
        <section className="relative min-h-dvh-safe w-full overflow-x-clip flex flex-col items-center justify-center safe-overlay">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/images/bg-texture-turquesa-clean.png"
                    style={{ opacity: 0.8 }}
                    alt={hostsLabel}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-200 to-background" />
            </div>

            {/* Content */}
            <div className="relative z-20 text-center w-full max-w-4xl mx-auto px-4 pb-14 pt-6 min-w-0">
                <div className="mb-4 flex justify-center">
                    <motion.img
                        src={heroOrnament}
                        alt="Decoración"
                        className="w-56 sm:w-72 md:w-80 aspect-square object-contain opacity-90 drop-shadow-lg"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.75, scale: 1 }}
                        transition={{ delay: 0.8, duration: 1 }}
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="min-w-0"
                >
                    {badge && (
                        <div className="mb-5">
                            <span className="inline-block py-1 px-3 border text-primary border-primary/30 rounded-full text-xs sm:text-sm uppercase tracking-[0.2em] modal-backdrop bg-white/20 break-anywhere max-w-full">
                                {badge}
                            </span>
                        </div>
                    )}
                    <h1 className="font-heading hero-title-fluid mb-4 text-primary drop-shadow-xl break-anywhere">
                        {hostsLabel}
                    </h1>
                </motion.div>
            </div>

            {/* Scroll arrow */}
            <motion.div
                className="absolute safe-bottom-arrow left-0 right-0 flex justify-center z-10 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1.5, duration: 1 }}
            >
                <div className="animate-bounce text-primary">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </motion.div>
        </section>
    );
};

export default Hero;
