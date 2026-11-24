import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Church, GlassWater, MapPin, Video, Radio, ExternalLink } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { INVITATION_LIMITS, limitList, clampText } from '../config/invitationLimits';
import MapModal from './MapModal';

// Mapa de tipo → icono de Lucide
const ICONS = {
    ceremony:  <Church     className="w-12 h-12 text-primary" />,
    reception: <GlassWater className="w-12 h-12 text-primary" />,
    live:      <Radio      className="w-12 h-12 text-primary" />,
    videocall: <Video      className="w-12 h-12 text-primary" />,
};

const isVirtualVenue = (tipo) => tipo === 'live' || tipo === 'videocall';

const EventCards = () => {
    const [modalOpen,  setModalOpen]  = useState(false);
    const [currentMap, setCurrentMap] = useState({ url: '', title: '', external: '' });

    const { config } = useConfig();
    const venues = limitList(config.venues, INVITATION_LIMITS.venues.max);
    const titulo = clampText(config.textos?.eventCards?.titulo || 'Acompáñanos', INVITATION_LIMITS.venues.sectionTituloMax);
    const subtitulo = clampText(config.textos?.eventCards?.subtitulo, INVITATION_LIMITS.venues.sectionSubtituloMax);

    if (venues.length === 0) return null;

    const openMap = (venue) => {
        setCurrentMap({ url: venue.mapUrl, title: venue.titulo, external: venue.externalLink });
        setModalOpen(true);
    };

    return (
        <section className="py-20 px-4 bg-secondary/10 relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="max-w-6xl mx-auto relative z-10 min-w-0">
                <div className="text-center mb-12">
                    <h2 className="font-heading section-title-fluid mb-4 break-anywhere">{titulo}</h2>
                    {subtitulo && <p className="text-gray-600 max-w-2xl mx-auto break-anywhere">{subtitulo}</p>}
                </div>

                <div className={`gap-8 ${venues.length === 1 ? 'flex justify-center' : 'grid md:grid-cols-2'}`}>
                    {venues.map((venue, idx) => {
                        const virtual = isVirtualVenue(venue.tipo);
                        const linkAcceso = venue.streamUrl || venue.externalLink || '';
                        const subtituloLugar = clampText(
                            virtual ? (venue.plataforma || venue.lugar) : venue.lugar,
                            INVITATION_LIMITS.venues.lugarMax
                        );
                        const venueTitulo = clampText(venue.titulo, INVITATION_LIMITS.venues.tituloMax);
                        const venueDireccion = clampText(venue.direccion, INVITATION_LIMITS.venues.direccionMax);
                        const venueCodigo = clampText(venue.codigoAcceso, INVITATION_LIMITS.venues.direccionMax);
                        const venueHora = clampText(venue.hora, INVITATION_LIMITS.venues.horaMax);

                        return (
                            <motion.div
                                key={venue.id || idx}
                                className={`bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-primary/10 flex flex-col items-center text-center hover:shadow-xl transition-all hover:scale-[1.02] group min-w-0 ${venues.length === 1 ? 'w-full max-w-xl' : ''}`}
                                initial={{ y: 50, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.2 }}
                            >
                                <div className="mb-6 p-4 bg-secondary/20 rounded-full group-hover:bg-primary/20 transition-colors">
                                    {ICONS[venue.tipo] ?? ICONS.ceremony}
                                </div>
                                <h3 className="text-3xl sm:text-4xl mb-2 break-anywhere">{venueTitulo}</h3>
                                {subtituloLugar && (
                                    <p className="text-lg sm:text-xl font-bold text-gray-500 mb-1 break-anywhere">{subtituloLugar}</p>
                                )}
                                {!virtual && venueDireccion && (
                                    <p className="text-gray-400 text-sm mb-1 break-anywhere">{venueDireccion}</p>
                                )}
                                {virtual && venueCodigo && (
                                    <p className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full font-semibold my-1.5 break-anywhere max-w-full">
                                        {venueCodigo}
                                    </p>
                                )}
                                {venueHora && (
                                    <p className="text-gray-500 mb-6 break-anywhere">{venueHora}</p>
                                )}

                                <div className="mt-auto">
                                    {virtual ? (
                                        linkAcceso ? (
                                            <a
                                                href={linkAcceso}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full hover:bg-secondary transition-colors shadow-md cursor-pointer text-sm font-semibold"
                                            >
                                                <ExternalLink size={16} />
                                                {venue.tipo === 'live' ? 'Ver Transmisión' : 'Unirse a Videollamada'}
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">
                                                Enlace disponible próximamente
                                            </span>
                                        )
                                    ) : (
                                        <button
                                            onClick={() => openMap(venue)}
                                            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-full hover:bg-secondary transition-colors shadow-md cursor-pointer"
                                        >
                                            <MapPin size={18} />
                                            Ver Mapa
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
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
