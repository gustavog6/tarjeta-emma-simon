import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Gift, CheckCircle2, UserPlus, Check } from 'lucide-react';
import DressCode from './DressCode';
import RsvpModal from './RsvpModal';
import ContributionsModal from './ContributionsModal';
import { useEventConfig } from '../context/EventConfigContext';
import { getAttendeeFullName } from '../utils/menuUtils';
import { EVENT_LIMITS, limitList, clampText } from '../config/eventLimits';

const RsvpSection = ({ guest, attendees = [], onReload }) => {
    const { config } = useEventConfig();
    const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
    const [isContributionsModalOpen, setIsContributionsModalOpen] = useState(false);

    const { copy } = config;
    const hasDressCode = Boolean(config.dressCode?.label?.trim());
    const paymentAccounts = limitList(config.paymentAccounts, EVENT_LIMITS.paymentAccounts.max);
    const hasContributions = paymentAccounts.length > 0;
    const totalCards = 1 + (hasDressCode ? 1 : 0) + (hasContributions ? 1 : 0);
    const gridClass =
        totalCards === 3
            ? 'max-w-6xl md:grid-cols-3'
            : totalCards === 2
                ? 'max-w-4xl md:grid-cols-2'
                : 'max-w-lg grid-cols-1';

    const extraPasses = Number(guest?.extra_passes ?? 0);
    const maxPasses = 1 + extraPasses;

    const confirmedCount =
        attendees.length > 0
            ? attendees.length
            : guest?.confirmed_at
                ? 1
                : 0;
    const remainingPasses = Math.max(0, maxPasses - confirmedCount);
    const isPartiallyConfirmed = confirmedCount > 0 && remainingPasses > 0;
    const isFullyConfirmed = confirmedCount >= maxPasses;

    const rsvpTitle = clampText(copy?.rsvp?.title || 'Confirmar Asistencia', EVENT_LIMITS.rsvp.titleMax);
    const rsvpSubtitle = clampText(copy?.rsvp?.subtitle, EVENT_LIMITS.rsvp.subtitleMax);
    const contributionsTitle = clampText(
        copy?.contributions?.title || 'Mesa de Regalos',
        EVENT_LIMITS.paymentAccounts.sectionTitleMax
    );
    const contributionsSubtitle = clampText(
        copy?.contributions?.subtitle,
        EVENT_LIMITS.paymentAccounts.sectionSubtitleMax
    );

    return (
        <section className="py-20 px-4 bg-background overflow-x-clip">
            <div className={`mx-auto grid gap-8 items-stretch ${gridClass}`}>

                {hasDressCode && <DressCode />}

                {/* RSVP Card */}
                <motion.div
                    className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border-t-4 border-primary text-center group flex flex-col justify-between min-w-0"
                    whileHover={{ y: -5 }}
                >
                    <div className="min-w-0">
                        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                            {isFullyConfirmed ? (
                                <CheckCircle2 size={32} className="text-green-600" />
                            ) : isPartiallyConfirmed ? (
                                <UserPlus size={30} className="text-primary" />
                            ) : (
                                <MessageCircle size={32} />
                            )}
                        </div>
                        <h3 className="text-3xl sm:text-4xl mb-2 font-heading break-anywhere">{rsvpTitle}</h3>

                        {isFullyConfirmed ? (
                            <div className="mt-5 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm space-y-2.5">
                                <p className="font-semibold text-base">¡Ya confirmaste tu asistencia!</p>
                                <p className="text-xs text-green-700">
                                    Completaste <strong>{confirmedCount} de {maxPasses}</strong> {maxPasses === 1 ? 'pase válido' : 'pases válidos'} para tu invitación.
                                </p>
                                {attendees.length > 0 && (
                                    <ul className="pt-2 border-t border-green-200/70 space-y-1 text-left text-xs text-green-800">
                                        {attendees.map((a) => (
                                            <li key={a.id} className="flex items-center gap-1.5">
                                                <Check size={13} className="text-green-600 shrink-0" />
                                                <span className="truncate">{getAttendeeFullName(a)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <p className="text-[11px] text-green-700/80 pt-1">
                                    Si necesitas modificar algo, comunícate directamente con los organizadores.
                                </p>
                            </div>
                        ) : isPartiallyConfirmed ? (
                            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 text-gray-700 text-sm space-y-2.5">
                                <p className="font-semibold text-primary text-sm">
                                    Has confirmado {confirmedCount} de {maxPasses} pases
                                </p>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Tu invitación aún tiene <strong>{remainingPasses} {remainingPasses === 1 ? 'pase disponible' : 'pases disponibles'}</strong> para acompañantes.
                                </p>
                                {attendees.length > 0 && (
                                    <ul className="pt-2 border-t border-primary/15 space-y-1 text-left text-xs text-gray-700">
                                        {attendees.map((a) => (
                                            <li key={a.id} className="flex items-center gap-1.5">
                                                <Check size={13} className="text-primary shrink-0" />
                                                <span className="truncate">{getAttendeeFullName(a)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-600 mb-6 text-sm leading-relaxed break-anywhere">
                                {rsvpSubtitle}
                            </p>
                        )}
                    </div>

                    {!isFullyConfirmed && (
                        <button
                            onClick={() => setIsRsvpModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-secondary transition-colors font-bold shadow-md hover:shadow-lg cursor-pointer mt-5 text-sm"
                        >
                            {isPartiallyConfirmed ? (
                                <>
                                    <UserPlus size={18} />
                                    Agregar acompañantes ({remainingPasses} disp.)
                                </>
                            ) : (
                                <>
                                    <MessageCircle size={18} />
                                    Confirmar Asistencia
                                </>
                            )}
                        </button>
                    )}
                </motion.div>

                {/* Contributions / Gifts Card */}
                {hasContributions && (
                    <motion.div
                        className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border-t-4 border-primary text-center group flex flex-col justify-between min-w-0"
                        whileHover={{ y: -5 }}
                    >
                        <div className="min-w-0">
                            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                                <Gift size={32} />
                            </div>
                            <h3 className="text-3xl sm:text-4xl mb-2 font-heading break-anywhere">{contributionsTitle}</h3>
                            <p className="text-gray-600 mb-6 text-sm leading-relaxed break-anywhere">
                                {contributionsSubtitle}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsContributionsModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-secondary transition-colors font-bold shadow-md hover:shadow-lg cursor-pointer mt-4"
                        >
                            <Gift size={18} />
                            Ver Datos Bancarios
                        </button>
                    </motion.div>
                )}

            </div>

            <RsvpModal
                isOpen={isRsvpModalOpen}
                onClose={() => setIsRsvpModalOpen(false)}
                guest={guest}
                existingAttendees={attendees}
                onConfirmed={() => {
                    if (onReload) onReload();
                }}
            />

            <ContributionsModal
                isOpen={isContributionsModalOpen}
                onClose={() => setIsContributionsModalOpen(false)}
            />
        </section>
    );
};

export default RsvpSection;
