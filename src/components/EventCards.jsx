import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Church, GlassWater, MapPin, Video, Radio, ExternalLink } from 'lucide-react';
import { useEventConfig } from '../context/EventConfigContext';
import { EVENT_LIMITS, limitList, clampText } from '../config/eventLimits';
import MapModal from './MapModal';

const ICONS = {
    main_venue: <Church     className="w-12 h-12 text-primary" />,
    reception:  <GlassWater className="w-12 h-12 text-primary" />,
    livestream: <Radio      className="w-12 h-12 text-primary" />,
    videocall:  <Video      className="w-12 h-12 text-primary" />,
};

const isVirtualLocation = (type) => type === 'livestream' || type === 'videocall';

const EventCards = () => {
    const [modalOpen,  setModalOpen]  = useState(false);
    const [currentMap, setCurrentMap] = useState({ url: '', title: '', external: '' });

    const { config } = useEventConfig();
    const locations = limitList(config.locations, EVENT_LIMITS.locations.max);
    const title = clampText(config.copy?.locations?.title || 'Acompáñanos', EVENT_LIMITS.locations.sectionTitleMax);
    const subtitle = clampText(config.copy?.locations?.subtitle, EVENT_LIMITS.locations.sectionSubtitleMax);

    if (locations.length === 0) return null;

    const openMap = (loc) => {
        setCurrentMap({ url: loc.mapUrl, title: loc.title, external: loc.externalLink });
        setModalOpen(true);
    };

    return (
        <section className="py-20 px-4 bg-secondary/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="max-w-6xl mx-auto relative z-10 min-w-0">
                <div className="text-center mb-12">
                    <h2 className="font-heading section-title-fluid mb-4 break-anywhere">{title}</h2>
                    {subtitle && <p className="text-gray-600 max-w-2xl mx-auto break-anywhere">{subtitle}</p>}
                </div>

                <div className={`gap-8 ${locations.length === 1 ? 'flex justify-center' : 'grid md:grid-cols-2'}`}>
                    {locations.map((loc, idx) => {
                        const virtual = isVirtualLocation(loc.locationType);
                        const accessLink = loc.streamUrl || loc.externalLink || '';
                        const subtitlePlace = clampText(
                            virtual ? (loc.platform || loc.venueName) : loc.venueName,
                            EVENT_LIMITS.locations.venueMax
                        );
                        const locTitle = clampText(loc.title, EVENT_LIMITS.locations.titleMax);
                        const locAddress = clampText(loc.address, EVENT_LIMITS.locations.addressMax);
                        const locCode = clampText(loc.accessCode, EVENT_LIMITS.locations.addressMax);
                        const locTime = clampText(loc.timeLabel, EVENT_LIMITS.locations.timeMax);

                        return (
                            <motion.div
                                key={loc.id || idx}
                                className={`bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-primary/10 flex flex-col items-center text-center hover:shadow-xl transition-all hover:scale-[1.02] group min-w-0 ${locations.length === 1 ? 'w-full max-w-xl' : ''}`}
                                initial={{ y: 50, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.2 }}
                            >
                                <div className="mb-6 p-4 bg-secondary/20 rounded-full group-hover:bg-primary/20 transition-colors">
                                    {ICONS[loc.locationType] ?? ICONS.main_venue}
                                </div>
                                <h3 className="text-3xl sm:text-4xl mb-2 break-anywhere">{locTitle}</h3>
                                {subtitlePlace && (
                                    <p className="text-lg sm:text-xl font-bold text-gray-500 mb-1 break-anywhere">{subtitlePlace}</p>
                                )}
                                {!virtual && locAddress && (
                                    <p className="text-gray-400 text-sm mb-1 break-anywhere">{locAddress}</p>
                                )}
                                {virtual && locCode && (
                                    <p className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full font-semibold my-1.5 break-anywhere max-w-full">
                                        {locCode}
                                    </p>
                                )}
                                {locTime && (
                                    <p className="text-gray-500 mb-6 break-anywhere">{locTime}</p>
                                )}

                                <div className="mt-auto">
                                    {virtual ? (
                                        accessLink ? (
                                            <a
                                                href={accessLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full hover:bg-secondary transition-colors shadow-md cursor-pointer text-sm font-semibold"
                                            >
                                                <ExternalLink size={16} />
                                                {loc.locationType === 'livestream' ? 'Ver Transmisión' : 'Unirse a Videollamada'}
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">
                                                Enlace disponible próximamente
                                            </span>
                                        )
                                    ) : (
                                        <button
                                            onClick={() => openMap(loc)}
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
