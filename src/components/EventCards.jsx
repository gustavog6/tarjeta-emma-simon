import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Church, GlassWater, MapPin } from 'lucide-react';
import MapModal from './MapModal';

const EventCards = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [currentMap, setCurrentMap] = useState({ url: '', title: '', external: '' });

    const events = [
        {
            type: 'ceremony',
            icon: <Church className="w-12 h-12 text-primary" />,
            title: 'Ceremonia y Recepción',
            place: 'La Llovizna Hotel & Casino',
            address: 'Av. Guayana, Puerto Ordaz, Bolívar',
            time: '11:30 AM',
            externalLink: 'https://www.google.com/maps/search/?api=1&query=La+Llovizna+Hotel+%26+Casino+Puerto+Ordaz',
            mapUrl: 'https://www.google.com/maps?q=La+Llovizna+Hotel+%26+Casino+Puerto+Ordaz&output=embed',
        },
        // {
        //     type: 'celebration',
        //     icon: <GlassWater className="w-12 h-12 text-primary" />,
        //     title: 'Recepción',
        //     place: "Lagar's Restobar",
        //     address: 'C.C. Costa América, Puerto Ordaz',
        //     time: '12:00 PM',
        //     externalLink: "https://www.google.com/maps/search/?api=1&query=Lagar's+Restobar+Puerto+Ordaz",
        //     mapUrl: "https://www.google.com/maps?q=Lagar's+Restobar+Puerto+Ordaz&output=embed",
        // }
    ];

    const openMap = (event) => {
        setCurrentMap({
            url: event.mapUrl,
            title: event.title,
            external: event.externalLink
        });
        setModalOpen(true);
    };

    return (
        <section className="py-20 px-4 bg-secondary/10 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            <div className="absolute top-10 right-10 opacity-20 pointer-events-none">
                <svg width="100" height="100" viewBox="0 0 100 100" fill="var(--color-primary)">
                    <path d="M50 0L61 35L98 35L68 57L79 91L50 70L21 91L32 57L2 35L39 35Z" opacity="0.1" />
                </svg>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <h2 className="font-heading text-5xl md:text-5xl mb-4">Acompáñanos</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Será un honor para nosotros contar con tu presencia en este día tan especial.
                    </p>
                </div>

                <div className={`gap-8 ${events.length === 1 ? 'flex justify-center' : 'grid md:grid-cols-2'}`}>
                    {events.map((event, idx) => (
                        <motion.div
                            key={event.type}
                            className={`bg-white p-8 rounded-2xl shadow-lg border border-primary/10 flex flex-col items-center text-center hover:shadow-xl transition-all hover:scale-[1.02] group ${events.length === 1 ? 'w-full max-w-xl' : ''}`}
                            initial={{ y: 50, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.2 }}
                        >
                            <div className="mb-6 p-4 bg-secondary/20 rounded-full group-hover:bg-primary/20 transition-colors">
                                {event.icon}
                            </div>
                            <h3 className="text-4xl mb-2">{event.title}</h3>
                            <p className="text-xl font-bold text-gray-500 mb-1">{event.place}</p>
                            <p className="text-gray-500 mb-4">{event.time}</p>

                            <div className="mt-auto flex gap-4">
                                <button
                                    onClick={() => openMap(event)}
                                    className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-full hover:bg-yellow-600 transition-colors shadow-md cursor-pointer"
                                >
                                    <MapPin size={18} />
                                    Ver Mapa
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <MapModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                locationUrl={currentMap.url}
                title={currentMap.title}
                externalLink={currentMap.external}
            />
        </section>
    );
};

export default EventCards;
