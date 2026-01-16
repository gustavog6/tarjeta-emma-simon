import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const QuoteSection = () => {
    return (
        <section className="py-16 px-6 bg-background relative overflow-hidden flex items-center justify-center">
            {/* Decorative background */}
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                <img src="/images/bg-texture.png" className="w-full h-full object-cover" alt="" />
            </div>

            <div className="max-w-3xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 0.6, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="text-primary/20 mb-8 flex justify-center"
                >
                    <Quote size={60} fill="currentColor" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 1 }}
                >
                    <p className="font-body text-2xl md:text-3xl lg:text-4xl text-gray-600 font-light italic leading-relaxed mb-10">
                        "Estamos muy emocionados de compartir este día contigo."
                    </p>

                    <div className="flex flex-col items-center">
                        <div className="h-[1px] w-12 bg-primary/30 mb-6"></div>
                        <p className="font-heading text-3xl md:text-4xl text-primary tracking-wide">
                            Con amor, Simón & Emma
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default QuoteSection;
