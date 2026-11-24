import React from 'react';
import { motion } from 'framer-motion';
import { useConfig } from '../context/ConfigContext';
import goldSilhouette from '../assets/corazon-verde-solo-2.png';

const Hero = () => {
    const { config } = useConfig();
    const { novia, novio } = config.novios;
    const { badge } = config.textos.hero;

    return (
        <section className="relative h-screen w-full overflow-hidden flex items-start justify-center">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/images/bg-texture-turquesa-clean.png"
                    style={{ opacity: 0.8 }}
                    alt={`${novio.nombre} & ${novia.nombre}`}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-200 to-background" />
            </div>

            {/* Content */}
            <div className="relative z-20 text-center text-white p-4 py-52 md:py-52">
                <div className="mt-8 flex justify-center">
                    <motion.img
                        src={goldSilhouette}
                        alt="Decoración"
                        className="w-72 md:w-80 opacity-90 drop-shadow-lg"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.75, scale: 1 }}
                        transition={{ delay: 0.8, duration: 1 }}
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                >
                    <div className="mb-6">
                        <span className="inline-block py-1 px-3 border text-primary border-primary/30 rounded-full text-sm uppercase tracking-[0.2em] backdrop-blur-sm bg-white/10">
                            {badge}
                        </span>
                    </div>
                    <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl mb-6 text-primary drop-shadow-xl">
                        {novio.nombre} &amp; {novia.nombre}
                    </h1>
                </motion.div>
            </div>

            {/* Scroll arrow */}
            <motion.div
                className="absolute bottom-10 left-0 right-0 flex justify-center z-10"
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
