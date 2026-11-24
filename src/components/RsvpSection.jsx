import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Gift, CheckCircle2 } from 'lucide-react';
import DressCode from './DressCode';
import RsvpModal from './RsvpModal';
import GiftModal from './GiftModal';
import { evento } from '../config/evento';

const RsvpSection = ({ invitado, onUpdateInvitado }) => {
    const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);

    const isConfirmed = Boolean(invitado?.confirmed_at);
    const { textos } = evento;

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
                            {isConfirmed ? (
                                <CheckCircle2 size={32} className="text-green-600" />
                            ) : (
                                <MessageCircle size={32} />
                            )}
                        </div>
                        <h3 className="text-4xl mb-2 font-heading">{textos.rsvp.titulo}</h3>

                        {isConfirmed ? (
                            <div className="mt-8 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
                                <p className="font-semibold text-base mb-1">¡Ya confirmaste tu asistencia!</p>
                                <p className="text-xs text-green-700">
                                    Estamos felices de contar contigo. Si necesitas modificar algo, por favor comunícate directamente con los novios.
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                                {textos.rsvp.subtitulo}
                            </p>
                        )}
                    </div>

                    {!isConfirmed && (
                        <button
                            onClick={() => setIsRsvpModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-secondary transition-colors font-bold shadow-md hover:shadow-lg cursor-pointer mt-4"
                        >
                            <MessageCircle size={18} />
                            Confirmar Asistencia
                        </button>
                    )}
                </motion.div>

                {/* Mesa de Regalos */}
                <motion.div
                    className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-primary text-center group flex flex-col justify-between cursor-pointer"
                    whileHover={{ y: -5 }}
                    onClick={() => setIsGiftModalOpen(true)}
                >
                    <div>
                        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                            <Gift size={32} />
                        </div>
                        <h3 className="text-4xl mb-2 font-heading">{textos.regalos.titulo}</h3>
                        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                            {textos.regalos.subtitulo}
                        </p>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsGiftModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-secondary transition-colors font-bold shadow-md hover:shadow-lg w-fit mt-4 mx-auto cursor-pointer"
                    >
                        Ver datos bancarios
                    </button>
                </motion.div>

            </div>

            <RsvpModal
                isOpen={isRsvpModalOpen}
                onClose={() => setIsRsvpModalOpen(false)}
                invitado={invitado}
                onConfirmed={(updated) => {
                    if (onUpdateInvitado) onUpdateInvitado(updated);
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
