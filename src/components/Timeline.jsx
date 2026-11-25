import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useEventConfig } from '../context/EventConfigContext';
import { ICON_MAP } from '../utils/iconRegistry';
import { EVENT_LIMITS, limitList, clampText } from '../config/eventLimits';

const Timeline = () => {
    const { config } = useEventConfig();
    const schedule = limitList(config.schedule, EVENT_LIMITS.schedule.max);
    const title = clampText(config.copy?.schedule?.title || 'Itinerario', EVENT_LIMITS.schedule.sectionTitleMax);

    if (schedule.length === 0) return null;

    return (
        <section className="py-20 px-4 bg-secondary/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 md:w-48 opacity-40 pointer-events-none">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary w-full h-full transform -scale-x-100">
                    <path d="M20 20C20 20 60 20 80 50C100 80 80 120 50 120C20 120 20 80 50 80C80 80 120 120 120 160C120 200 160 200 160 200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>
            <div className="absolute bottom-0 right-0 w-32 md:w-48 opacity-40 pointer-events-none">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary w-full h-full">
                    <path d="M20 20C20 20 60 20 80 50C100 80 80 120 50 120C20 120 20 80 50 80C80 80 120 120 120 160C120 200 160 200 160 200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <h2 className="section-title-fluid text-center font-heading text-primary mb-16 break-anywhere">{title}</h2>

                <div className="relative py-12">
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-primary -translate-x-1/2 hidden md:block opacity-80" />
                    <div className="absolute left-8 top-0 bottom-0 w-1 bg-primary -translate-x-1/2 md:hidden opacity-80" />

                    <div className="space-y-12">
                        {schedule.map((item, idx) => {
                            const IconComponent = ICON_MAP[item.iconName] ?? MapPin;
                            return (
                                <motion.div
                                    key={item.id || idx}
                                    className={`relative flex flex-col md:flex-row items-center w-full ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.2 }}
                                >
                                    <div className={`w-full md:w-1/2 pl-20 md:pl-0 min-w-0 ${idx % 2 === 0 ? 'md:text-left md:pl-16' : 'md:text-right md:pr-16'} mb-4 md:mb-0`}>
                                        <span className="text-3xl sm:text-4xl font-heading text-primary block mb-1 break-anywhere">
                                            {clampText(item.timeLabel, EVENT_LIMITS.schedule.timeMax)}
                                        </span>
                                        <span className="text-lg sm:text-xl text-gray-500 tracking-wide break-anywhere">
                                            {clampText(item.title, EVENT_LIMITS.schedule.titleMax)}
                                        </span>
                                    </div>

                                    <div className="absolute left-8 md:left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-full p-2 border border-primary/20 shadow-md z-10 flex items-center justify-center w-12 h-12 md:w-14 md:h-14">
                                        <IconComponent className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                                    </div>

                                    <div className="w-0 md:w-1/2" />
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Timeline;
