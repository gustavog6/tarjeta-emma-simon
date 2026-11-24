import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';

const ParentsSection = () => {
    const { config } = useConfig();
    const { padres, padrinos } = config;

    const tienePadres = padres?.novia?.padre || padres?.novia?.madre || padres?.novio?.padre || padres?.novio?.madre;
    const tienePadrinos = padrinos && padrinos.length > 0;

    if (!tienePadres && !tienePadrinos) return null;

    const { novia, novio } = config.novios;

    return (
        <section className="py-20 px-4 bg-background relative overflow-hidden">
            {/* Background decorative circles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center border-t border-b border-primary/20 py-16 relative z-10">
                {/* Center Badge Ornament */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4">
                    <div className="w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center text-primary bg-white shadow-sm">
                        <Heart size={20} className="fill-primary/20" />
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="grid md:grid-cols-2 gap-12 items-center">

                        {/* Padres */}
                        {tienePadres && (
                            <div className="space-y-6">
                                <h3 className="text-3xl md:text-4xl text-primary font-heading mb-4">
                                    Con la bendición de nuestros padres
                                </h3>
                                <div className="space-y-6">
                                    {(padres.novia.padre || padres.novia.madre) && (
                                        <div className="bg-white/60 p-4 rounded-xl border border-primary/10 shadow-sm">
                                            <p className="text-xs uppercase tracking-[0.25em] text-primary/70 font-semibold mb-1">
                                                Padres de {novia.nombre}
                                            </p>
                                            {padres.novia.padre && <p className="text-lg font-medium text-gray-700">{padres.novia.padre}</p>}
                                            {padres.novia.madre && <p className="text-lg font-medium text-gray-700">{padres.novia.madre}</p>}
                                        </div>
                                    )}
                                    {(padres.novio.padre || padres.novio.madre) && (
                                        <div className="bg-white/60 p-4 rounded-xl border border-primary/10 shadow-sm">
                                            <p className="text-xs uppercase tracking-[0.25em] text-primary/70 font-semibold mb-1">
                                                Padres de {novio.nombre}
                                            </p>
                                            {padres.novio.padre && <p className="text-lg font-medium text-gray-700">{padres.novio.padre}</p>}
                                            {padres.novio.madre && <p className="text-lg font-medium text-gray-700">{padres.novio.madre}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Padrinos */}
                        {tienePadrinos && (
                            <div className={`${tienePadres ? 'border-t md:border-t-0 md:border-l border-primary/20 pt-8 md:pt-0 pl-0 md:pl-12' : ''} flex flex-col justify-center h-full`}>
                                <h3 className="text-3xl md:text-4xl text-primary font-heading mb-6">
                                    Y nuestros queridos padrinos
                                </h3>
                                <div className="space-y-4">
                                    {padrinos.map((p, i) => (
                                        <div key={i} className="bg-white/60 p-4 rounded-xl border border-primary/10 shadow-sm">
                                            <p className="text-xs uppercase tracking-[0.25em] text-primary/70 font-semibold mb-1">{p.rol}</p>
                                            <p className="text-lg font-medium text-gray-700">{p.nombre}</p>
                                        </div>
                                    ))}
                                    <div className="pt-4">
                                        <p className="text-gray-500 italic text-sm font-serif">
                                            "El amor no se deleita en la maldad, sino que se regocija con la verdad. Todo lo disculpa, todo lo cree, todo lo espera, todo lo soporta."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default ParentsSection;
