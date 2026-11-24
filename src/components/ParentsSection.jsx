import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';

const ParentsSection = () => {
    const { config } = useConfig();
    const { padres, padrinos } = config;

    const tienePadresNovia = Boolean(padres?.novia?.padre || padres?.novia?.madre);
    const tienePadresNovio = Boolean(padres?.novio?.padre || padres?.novio?.madre);
    const tienePadres = tienePadresNovia || tienePadresNovio;
    const tienePadrinos = Array.isArray(padrinos) && padrinos.length > 0;

    if (!tienePadres && !tienePadrinos) return null;

    const { novia, novio } = config.novios;

    return (
        <section className="py-20 px-4 bg-secondary/10 relative overflow-hidden">
            {/* Líneas decorativas SVG (mismo lenguaje visual que Timeline) */}
            <div className="absolute top-0 left-0 w-32 md:w-44 opacity-30 pointer-events-none">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary w-full h-full transform -scale-x-100">
                    <path d="M20 20C20 20 60 20 80 50C100 80 80 120 50 120C20 120 20 80 50 80C80 80 120 120 120 160C120 200 160 200 160 200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>
            <div className="absolute bottom-0 right-0 w-32 md:w-44 opacity-30 pointer-events-none">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary w-full h-full">
                    <path d="M20 20C20 20 60 20 80 50C100 80 80 120 50 120C20 120 20 80 50 80C80 80 120 120 120 160C120 200 160 200 160 200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Encabezado alineado con SaveTheDate / EventCards */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="font-heading text-5xl text-primary mb-4">Con la bendición de</h2>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-[1px] w-12 bg-primary/30" />
                        <span className="font-body text-gray-500 tracking-[0.35em] uppercase text-xs">
                            {tienePadres && tienePadrinos
                                ? 'Nuestros Padres y Padrinos'
                                : tienePadres
                                    ? 'Nuestros Padres'
                                    : 'Nuestros Padrinos'}
                        </span>
                        <div className="h-[1px] w-12 bg-primary/30" />
                    </div>
                </motion.div>

                {/* Tarjetas de Padres */}
                {tienePadres && (
                    <div className={`grid gap-8 mb-8 ${tienePadresNovia && tienePadresNovio ? 'md:grid-cols-2' : 'max-w-lg mx-auto'}`}>
                        {tienePadresNovia && (
                            <motion.div
                                className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-primary text-center flex flex-col items-center group"
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                                    <Heart size={26} />
                                </div>
                                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400 font-semibold mb-1">
                                    Padres de la Novia
                                </p>
                                <h3 className="font-heading text-3xl text-primary mb-4">{novia.nombre}</h3>
                                <div className="h-px w-12 bg-primary/20 mb-4" />
                                <div className="space-y-1 text-gray-700">
                                    {padres.novia.padre && (
                                        <p className="text-lg font-medium tracking-wide">{padres.novia.padre}</p>
                                    )}
                                    {padres.novia.padre && padres.novia.madre && (
                                        <p className="font-heading text-2xl text-primary leading-none py-0.5">&amp;</p>
                                    )}
                                    {padres.novia.madre && (
                                        <p className="text-lg font-medium tracking-wide">{padres.novia.madre}</p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {tienePadresNovio && (
                            <motion.div
                                className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-primary text-center flex flex-col items-center group"
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.15 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                                    <Heart size={26} />
                                </div>
                                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400 font-semibold mb-1">
                                    Padres del Novio
                                </p>
                                <h3 className="font-heading text-3xl text-primary mb-4">{novio.nombre}</h3>
                                <div className="h-px w-12 bg-primary/20 mb-4" />
                                <div className="space-y-1 text-gray-700">
                                    {padres.novio.padre && (
                                        <p className="text-lg font-medium tracking-wide">{padres.novio.padre}</p>
                                    )}
                                    {padres.novio.padre && padres.novio.madre && (
                                        <p className="font-heading text-2xl text-primary leading-none py-0.5">&amp;</p>
                                    )}
                                    {padres.novio.madre && (
                                        <p className="text-lg font-medium tracking-wide">{padres.novio.madre}</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Tarjeta de Padrinos */}
                {tienePadrinos && (
                    <motion.div
                        className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-primary text-center max-w-3xl mx-auto group"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.25 }}
                        whileHover={{ y: -5 }}
                    >
                        <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                            <Sparkles size={26} />
                        </div>
                        <h3 className="font-heading text-4xl text-primary mb-2">Nuestros Padrinos</h3>
                        <div className="h-px w-14 bg-primary/20 mx-auto mb-6" />

                        <div className={`grid gap-6 ${padrinos.length === 1 ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
                            {padrinos.map((p, i) => (
                                <div key={i} className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-[0.28em] text-primary/80 font-semibold">
                                        {p.rol}
                                    </p>
                                    <p className="text-lg font-medium text-gray-700 tracking-wide">
                                        {p.nombre}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default ParentsSection;
