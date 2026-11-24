import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sparkles } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { useCountdown } from '../hooks/useCountdown';
import { downloadCalendarEvent } from '../utils/ics';
import { parseFecha } from '../utils/fechas';
import { INVITATION_LIMITS, clampText } from '../config/invitationLimits';
import StoryBannerModal from './StoryBannerModal';

const SaveTheDate = () => {
    const { config } = useConfig();
    const { fecha, textos, venues, novios } = config;
    const titulo = clampText(textos?.saveTheDate?.titulo || 'Save the Date', INVITATION_LIMITS.saveTheDate.tituloMax);
    const diaSemana = clampText(textos?.saveTheDate?.diaSemana, INVITATION_LIMITS.saveTheDate.diaSemanaMax);
    const timeLeft = useCountdown(fecha);
    const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

    const dateObj = parseFecha(fecha) || new Date();
    const dia  = dateObj.getDate();
    const mes  = dateObj.toLocaleDateString('es-ES', { month: 'long' });
    const año  = dateObj.getFullYear();
    const hora = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });

    const handleAddToCalendar = () => {
        const venue = venues[0] || {};
        downloadCalendarEvent({
            title: `Boda ${novios.novio.nombre} & ${novios.novia.nombre}`,
            description: `Acompáñanos a celebrar nuestra boda. Ceremonia y recepción en ${venue.lugar || ''}.`,
            location: `${venue.lugar || ''}, ${venue.direccion || ''}`,
            startDate: fecha,
            durationHours: 8,
        });
    };

    const unidades = [
        { label: 'días',  valor: timeLeft.días  },
        { label: 'horas', valor: timeLeft.horas  },
        { label: 'min',   valor: timeLeft.min    },
        { label: 'seg',   valor: timeLeft.seg    },
    ];

    return (
        <section className="pt-16 pb-20 px-4 bg-background relative overflow-hidden">
            {/* Decorative blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center relative z-10">

                {/* Título */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="mb-12"
                >
                    <h2 className="font-heading section-title-fluid text-primary/90 mb-4 italic break-anywhere">{titulo}</h2>
                    {diaSemana && (
                        <div className="flex items-center justify-center gap-3 sm:gap-4">
                            <div className="h-[1px] w-10 sm:w-12 bg-primary/20 shrink-0" />
                            <span className="font-body text-gray-500 tracking-[0.35em] uppercase text-xs break-anywhere">{diaSemana}</span>
                            <div className="h-[1px] w-10 sm:w-12 bg-primary/20 shrink-0" />
                        </div>
                    )}
                </motion.div>

                {/* Fecha y hora */}
                <motion.div
                    className="flex flex-col items-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 1 }}
                >
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-16">
                        {/* Número de día + mes/año */}
                        <div className="order-1 md:order-2 flex items-center gap-4 md:gap-8">
                            <span className="font-heading text-7xl md:text-9xl text-primary leading-none capitalize">{dia}</span>
                            <div className="flex flex-col items-start justify-center border-l-2 border-primary/20 pl-4 md:pl-8 h-16 md:h-24">
                                <span className="font-heading text-3xl md:text-5xl text-primary leading-tight tracking-widest capitalize">{mes}</span>
                                <span className="font-body text-xl md:text-2xl text-gray-500 tracking-[0.2em]">{año}</span>
                            </div>
                        </div>

                        {/* Hora */}
                        <div className="order-3">
                            <div className="flex flex-col items-center border-t md:border-t-0 md:border-b border-primary/10 pt-3 md:pt-0 md:pb-2">
                                <span className="font-body text-2xl md:text-3xl text-gray-500 tracking-widest uppercase">{hora}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Botones de acción (Calendario + Banner historias) */}
                <motion.div
                    className="mt-8 flex flex-wrap justify-center gap-3"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                >
                    <button
                        onClick={handleAddToCalendar}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-white transition-all text-xs md:text-sm font-semibold shadow-sm cursor-pointer bg-white"
                    >
                        <Calendar size={16} />
                        Añadir al calendario (.ics)
                    </button>
                    <button
                        onClick={() => setIsStoryModalOpen(true)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-white transition-all text-xs md:text-sm font-semibold shadow-sm cursor-pointer"
                    >
                        <Sparkles size={16} />
                        Banner para Historias 📱
                    </button>
                </motion.div>

                {/* Countdown */}
                <motion.div
                    className="mt-14"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 1 }}
                >
                    {timeLeft.terminado ? (
                        <p className="font-heading text-4xl text-primary">¡Hoy es el gran día! 🎉</p>
                    ) : (
                        <>
                            <p className="font-heading text-3xl text-primary mb-6 italic">Solo falta...</p>
                            <div className="flex justify-center gap-2 md:gap-6 px-2">
                                {unidades.map(({ label, valor }, index) => (
                                    <motion.div
                                        key={label}
                                        className="bg-white rounded-xl shadow-md p-2 md:p-4 w-16 md:w-28 flex flex-col items-center justify-center"
                                        initial={{ y: 20, opacity: 0 }}
                                        whileInView={{ y: 0, opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.6 + index * 0.1 }}
                                    >
                                        <div className="text-xl md:text-5xl font-bold text-gray-500 font-heading leading-none">
                                            {String(valor).padStart(2, '0')}
                                        </div>
                                        <div className="text-[10px] md:text-sm uppercase tracking-wider text-primary mt-1">
                                            {label}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </motion.div>

            </div>

            <StoryBannerModal
                isOpen={isStoryModalOpen}
                onClose={() => setIsStoryModalOpen(false)}
            />
        </section>
    );
};

export default SaveTheDate;
