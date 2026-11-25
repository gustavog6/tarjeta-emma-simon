import React from 'react';
import { motion } from 'framer-motion';
import { useEventConfig } from '../context/EventConfigContext';
import { EVENT_LIMITS, clampText } from '../config/eventLimits';
import decorativeEmblem from '../assets/decorative-emblem.png';

const QuoteSection = () => {
    const { config } = useEventConfig();
    const quote = clampText(config.copy?.closing?.quote, EVENT_LIMITS.closing.quoteMax);
    const signature = clampText(config.copy?.closing?.signature, EVENT_LIMITS.closing.signatureMax);

    if (!quote && !signature) return null;

    return (
        <section className="py-16 px-6 bg-background relative overflow-x-clip flex items-center justify-center">
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                <img src="/images/bg-texture.png" className="w-full h-full object-cover" alt="" />
            </div>

            <div className="max-w-3xl mx-auto text-center relative z-10 min-w-0">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 0.8, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="mb-8 flex justify-center"
                >
                    <img src={decorativeEmblem} alt="Decoración" className="w-40 h-40 sm:w-48 sm:h-48 aspect-square object-contain" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 1 }}
                    className="min-w-0"
                >
                    {quote && (
                        <p className="font-body text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-600 font-light italic leading-relaxed mb-10 break-anywhere">
                            {quote}
                        </p>
                    )}
                    {signature && (
                        <div className="flex flex-col items-center">
                            <div className="h-[1px] w-12 bg-primary/30 mb-6" />
                            <p className="font-heading text-3xl md:text-4xl text-primary tracking-wide break-anywhere">
                                {signature}
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </section>
    );
};

export default QuoteSection;
