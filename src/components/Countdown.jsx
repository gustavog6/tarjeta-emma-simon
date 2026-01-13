import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Countdown = () => {
    // Target date: July 29, 2026 14:00:00
    const targetDate = new Date('2026-01-31T10:00:00').getTime();

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference > 0) {
            return {
                días: Math.floor(difference / (1000 * 60 * 60 * 24)),
                horas: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                min: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                seg: Math.floor((difference % (1000 * 60)) / 1000),
            };
        } else {
            return { días: 0, horas: 0, min: 0, seg: 0 };
        }
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="py-16 px-4 bg-background relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-24 md:w-32 opacity-40 pointer-events-none">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary w-full h-full transform -scale-x-100">
                    <path d="M20 20C20 20 60 20 80 50C100 80 80 120 50 120C20 120 20 80 50 80C80 80 120 120 120 160C120 200 160 200 160 200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M10 10C30 10 50 30 50 50" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
            </div>
            <div className="absolute bottom-0 right-0 w-24 md:w-32 opacity-40 pointer-events-none">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary w-full h-full">
                    <path d="M20 20C20 20 60 20 80 50C100 80 80 120 50 120C20 120 20 80 50 80C80 80 120 120 120 160C120 200 160 200 160 200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M10 10C30 10 50 30 50 50" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
            </div>
            <div className="max-w-4xl mx-auto text-center">
                <motion.p
                    className="font-heading text-3xl text-primary mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    Solo falta...
                </motion.p>

                <div className="flex justify-center gap-2 md:gap-8 px-2">
                    {Object.entries(timeLeft).map(([unit, value], index) => (
                        <motion.div
                            key={unit}
                            className="bg-white rounded-lg shadow-lg p-2 md:p-4 w-16 md:w-32 flex flex-col items-center justify-center"
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="text-xl md:text-5xl font-bold text-gray-700 font-heading leading-none">
                                {String(value).padStart(2, '0')}
                            </div>
                            <div className="text-[10px] md:text-sm uppercase tracking-wider text-primary mt-1">
                                {unit}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Countdown;
