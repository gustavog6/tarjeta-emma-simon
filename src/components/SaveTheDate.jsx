import React from 'react';
import { motion } from 'framer-motion';

const SaveTheDate = () => {
    return (
        <section className="pt-16 px-4 bg-background relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="mb-12"
                >
                    <h2 className="font-heading text-5xl text-primary/90 mb-4 italic">Save the Date</h2>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-[1px] w-12 bg-primary/20"></div>
                        <span className="font-body text-gray-500 tracking-[.5em] uppercase text-xs">Sábado</span>
                        <div className="h-[1px] w-12 bg-primary/20"></div>
                    </div>
                </motion.div>

                <motion.div
                    className="flex flex-col items-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 1 }}
                >
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-16">

                        {/* Date Big Numbers */}
                        <div className="order-1 md:order-2 flex items-center gap-4 md:gap-8">
                            <span className="font-heading text-7xl md:text-9xl text-primary leading-none">31</span>
                            <div className="flex flex-col items-start justify-center border-l-2 border-primary/20 pl-4 md:pl-8 h-16 md:h-24">
                                <span className="font-heading text-3xl md:text-5xl text-primary leading-tight tracking-widest">Enero</span>
                                <span className="font-body text-xl md:text-2xl text-gray-500 tracking-[0.2em] font-base">2026</span>
                            </div>
                        </div>

                        {/* Time */}
                        <div className="order-3">
                            <div className="flex flex-col items-center border-t md:border-t-0 md:border-b border-primary/10 pt-3 md:pt-0 md:pb-2">
                                <span className="font-body text-2xl md:text-3xl text-gray-500 tracking-widest">11:30</span>
                                <span className="font-body text-sm tracking-[0.3em] text-primary uppercase">AM</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    className="mt-16"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 1.2 }}
                >
                    {/* <p className="font-heading text-2xl md:text-3xl text-primary/60">
                        ¡Acompañanos a celebrar el amor!
                    </p> */}
                </motion.div>
            </div>
        </section>
    );
};

export default SaveTheDate;
