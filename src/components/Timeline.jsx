import React from 'react';
import { motion } from 'framer-motion';
import { Church, Utensils, Music, MapPin } from 'lucide-react';

const Timeline = () => {
    const items = [
        {
            time: '11:30 am',
            title: 'Llegada',
            icon: <MapPin className="w-5 h-5 md:w-8 md:h-8 text-primary" />
        },
        {
            time: '12:00 m',
            title: 'Ceremonia Religiosa',
            icon: <Church className="w-5 h-5 md:w-8 md:h-8 text-primary" />
        },
        {
            time: '01:00 pm',
            title: 'Brindis & Almuerzo',
            icon: <Utensils className="w-5 h-5 md:w-8 md:h-8 text-primary" />
        },
        // {
        //     time: '08:00 PM',
        //     title: 'Comienza la Fiesta',
        //     icon: <Music className="w-5 h-5 md:w-8 md:h-8 text-primary" />
        // },
    ];

    return (
        <section className="py-20 px-4 bg-secondary/10 relative overflow-hidden">
            {/* Decor element */}
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                <img src="/images/bg-texture.png" className="w-64 rotate-180" alt="decor" />
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 md:w-48 opacity-40 pointer-events-none">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary w-full h-full transform -scale-x-100">
                    <path d="M20 20C20 20 60 20 80 50C100 80 80 120 50 120C20 120 20 80 50 80C80 80 120 120 120 160C120 200 160 200 160 200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M10 10C30 10 50 30 50 50" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
            </div>
            <div className="absolute bottom-0 right-0 w-32 md:w-48 opacity-40 pointer-events-none">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary w-full h-full">
                    <path d="M20 20C20 20 60 20 80 50C100 80 80 120 50 120C20 120 20 80 50 80C80 80 120 120 120 160C120 200 160 200 160 200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M10 10C30 10 50 30 50 50" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <h2 className="text-5xl text-center font-heading text-primary mb-16">Itinerario</h2>

                <div className="relative py-12">
                    {/* Central Line */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-primary -translate-x-1/2 hidden md:block opacity-80"></div>
                    <div className="absolute left-8 top-0 bottom-0 w-1 bg-primary -translate-x-1/2 md:hidden opacity-80"></div>

                    <div className="space-y-12">
                        {items.map((item, idx) => (
                            <motion.div
                                key={idx}
                                className={`relative flex flex-col md:flex-row items-center w-full ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.2 }}
                            >
                                {/* Text Content - occupies 50% width on desktop */}
                                <div className={`w-full md:w-1/2 pl-20 md:pl-0 ${idx % 2 === 0 ? 'md:text-left md:pl-16' : 'md:text-right md:pr-16'} mb-4 md:mb-0 box-border`}>
                                    <span className="text-4xl font-heading text-primary block mb-1">{item.time}</span>
                                    <span className="text-xl text-gray-500 font-base tracking-wide">{item.title}</span>
                                </div>

                                {/* Center Icon */}
                                <div className="absolute left-8 md:left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-full p-2 border border-primary/20 shadow-md z-10 flex items-center justify-center w-12 h-12 md:w-14 md:h-14">
                                    {item.icon}
                                </div>

                                {/* Spacer for the other side */}
                                <div className="w-0 md:w-1/2"></div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Timeline;
