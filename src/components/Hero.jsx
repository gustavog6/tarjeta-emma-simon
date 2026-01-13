import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
    return (
        <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
            {/* Background with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/images/bg-texture.png"
                    alt="Emma & Simón"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 bg-gradient-to-b from-transparent via-black/20 to-background"></div>
            </div>

            {/* Decorative Frame */}
            <div className="absolute inset-4 md:inset-8 border border-white/30 z-10 rounded-2xl pointer-events-none"></div>
            <div className="absolute top-4 left-4 md:top-8 md:left-8 w-16 h-16 border-t-2 border-l-2 border-white/60 z-10 rounded-tl-2xl pointer-events-none"></div>
            <div className="absolute top-4 right-4 md:top-8 md:right-8 w-16 h-16 border-t-2 border-r-2 border-white/60 z-10 rounded-tr-2xl pointer-events-none"></div>
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 w-16 h-16 border-b-2 border-l-2 border-white/60 z-10 rounded-bl-2xl pointer-events-none"></div>
            <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 w-16 h-16 border-b-2 border-r-2 border-white/60 z-10 rounded-br-2xl pointer-events-none"></div>

            {/* Content */}
            <div className="relative z-20 text-center text-white p-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                >
                    <div className="mb-6">
                        <span className="inline-block py-1 px-3 border border-white/30 rounded-full text-sm uppercase tracking-[0.2em] backdrop-blur-sm bg-white/10">
                            ¡Nos casamos!
                        </span>
                    </div>
                    <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl mb-6 text-white drop-shadow-xl">
                        Emma & Simón
                    </h1>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 font-body text-lg md:text-xl tracking-widest uppercase text-white/90">
                        <span className="flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-white/60"></span>
                            Sábado
                        </span>
                        <span className="text-3xl font-bold bg-white/10 backdrop-blur-md py-2 px-6 rounded-lg border border-white/20">
                            31 . 01 . 26
                        </span>
                        <span className="flex items-center gap-2">
                            2:00 PM
                            <span className="w-8 h-[1px] bg-white/60"></span>
                        </span>
                    </div>
                </motion.div>
            </div>

            <motion.div
                className="absolute bottom-10 left-0 right-0 flex justify-center z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
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
