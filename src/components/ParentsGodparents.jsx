import React from 'react';
import { motion } from 'framer-motion';

const ParentsGodparents = () => {
    return (
        <section className="py-20 px-4 bg-background overflow-hidden">
            <div className="max-w-4xl mx-auto text-center border-t border-b border-primary/20 py-12 relative">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4">
                        <div className="w-16 h-16 text-primary flex items-center justify-center">
                            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="w-full h-full">
                                <path d="M50 15 C 30 15 20 40 20 50 C 20 60 30 85 50 85 C 70 85 80 60 80 50 C 80 40 70 15 50 15 Z" strokeWidth="2" />
                                <path d="M50 20 V 80" strokeWidth="1" />
                                <path d="M25 50 H 75" strokeWidth="1" />
                                <circle cx="50" cy="50" r="5" fill="currentColor" />
                            </svg>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-2xl mb-6 text-primary">Con la bendición de nuestros padres</h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm uppercase tracking-widest text-gray-400 mb-1">Novia</p>
                                    <p className="text-xl font-medium">Sr. Nombre Papá Novia</p>
                                    <p className="text-xl font-medium">Sra. Nombre Mamá Novia</p>
                                </div>
                                <div>
                                    <p className="text-sm uppercase tracking-widest text-gray-400 mb-1">Novio</p>
                                    <p className="text-xl font-medium">Sr. Nombre Papá Novio</p>
                                    <p className="text-xl font-medium">Sra. Nombre Mamá Novio</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-l-0 md:border-l border-primary/20 pl-0 md:pl-12 flex flex-col justify-center h-full">
                            <h3 className="text-2xl mb-6 text-primary">Y nuestros padrinos</h3>
                            <div className="space-y-4">
                                <p className="text-xl font-medium">Sr. Nombre Padrino</p>
                                <p className="text-xl font-medium">Sra. Nombre Madrina</p>
                                <div className="mt-8 pt-6 border-t border-gray-100/50">
                                    <p className="text-gray-500 italic font-serif">"El amor es paciente, es bondadoso..."</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default ParentsGodparents;
