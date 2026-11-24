import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Gift, CheckCircle2, UserPlus, Check } from 'lucide-react';
import DressCode from './DressCode';
import RsvpModal from './RsvpModal';
import GiftModal from './GiftModal';
import { useConfig } from '../context/ConfigContext';
import { nombreCompletoDe } from '../utils/menu';

const RsvpSection = ({ invitado, confirmaciones = [], onReload }) => {
    const { config } = useConfig();
    const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);

    const { textos } = config;
    const rawSlots = Number(invitado?.slots_totales ?? invitado?.slots ?? 0);
    const maxSlots = 1 + rawSlots;

    const confirmadosCount =
        confirmaciones.length > 0
            ? confirmaciones.length
            : invitado?.confirmed_at
                ? 1
                : 0;
    const cuposRestantes = Math.max(0, maxSlots - confirmadosCount);
    const isPartiallyConfirmed = confirmadosCount > 0 && cuposRestantes > 0;
    const isFullyConfirmed = confirmadosCount >= maxSlots;

    return (
        <section className="py-20 px-4 bg-background">
            <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 items-stretch">

                {/* Código de vestimenta */}
                <DressCode />

                {/* Confirmar asistencia */}
                <motion.div
                    className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-primary text-center group flex flex-col justify-between"
                    whileHover={{ y: -5 }}
                >
                    <div>
                        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                            {isFullyConfirmed ? (
                                <CheckCircle2 size={32} className="text-green-600" />
                            ) : isPartiallyConfirmed ? (
                                <UserPlus size={30} className="text-primary" />
                            ) : (
                                <MessageCircle size={32} />
                            )}
                        </div>
                        <h3 className="text-4xl mb-2 font-heading">{textos.rsvp.titulo}</h3>

                        {isFullyConfirmed ? (
                            <div className="mt-5 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm space-y-2.5">
                                <p className="font-semibold text-base">¡Ya confirmaste tu asistencia!</p>
                                <p className="text-xs text-green-700">
                                    Completaste <strong>{confirmadosCount} de {maxSlots}</strong> {maxSlots === 1 ? 'pase válido' : 'pases válidos'} para tu invitación.
                                </p>
                                {confirmaciones.length > 0 && (
                                    <ul className="pt-2 border-t border-green-200/70 space-y-1 text-left text-xs text-green-800">
                                        {confirmaciones.map((c) => (
                                            <li key={c.id} className="flex items-center gap-1.5">
                                                <Check size={13} className="text-green-600 shrink-0" />
                                                <span className="truncate">{nombreCompletoDe(c)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <p className="text-[11px] text-green-700/80 pt-1">
                                    Si necesitas modificar algo, comunícate directamente con los novios.
                                </p>
                            </div>
                        ) : isPartiallyConfirmed ? (
                            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 text-gray-700 text-sm space-y-2.5">
                                <p className="font-semibold text-primary text-sm">
                                    Has confirmado {confirmadosCount} de {maxSlots} pases
                                </p>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Tu invitación aún tiene <strong>{cuposRestantes} {cuposRestantes === 1 ? 'pase disponible' : 'pases disponibles'}</strong> para acompañantes.
                                </p>
                                {confirmaciones.length > 0 && (
                                    <ul className="pt-2 border-t border-primary/15 space-y-1 text-left text-xs text-gray-700">
                                        {confirmaciones.map((c) => (
                                            <li key={c.id} className="flex items-center gap-1.5">
                                                <Check size={13} className="text-primary shrink-0" />
                                                <span className="truncate">{nombreCompletoDe(c)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                                {textos.rsvp.subtitulo}
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
                                    Agregar acompañantes ({cuposRestantes} disp.)
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

                {/* Mesa de regalos */}
                <motion.div
                    className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-primary text-center group flex flex-col justify-between"
                    whileHover={{ y: -5 }}
                >
                    <div>
                        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                            <Gift size={32} />
                        </div>
                        <h3 className="text-4xl mb-2 font-heading">{textos.regalos.titulo}</h3>
                        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                            {textos.regalos.subtitulo}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsGiftModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-secondary transition-colors font-bold shadow-md hover:shadow-lg cursor-pointer mt-4"
                    >
                        <Gift size={18} />
                        Ver Datos Bancarios
                    </button>
                </motion.div>

            </div>

            <RsvpModal
                isOpen={isRsvpModalOpen}
                onClose={() => setIsRsvpModalOpen(false)}
                invitado={invitado}
                confirmacionesPrevias={confirmaciones}
                onConfirmed={() => {
                    if (onReload) onReload();
                }}
            />

            <GiftModal
                isOpen={isGiftModalOpen}
                onClose={() => setIsGiftModalOpen(false)}
            />
        </section>
    );
};

export default RsvpSection;
