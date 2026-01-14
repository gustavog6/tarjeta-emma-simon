import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Gift, UserRound } from 'lucide-react'; // Changed icons
import GiftModal from './GiftModal';
import vestido from '../assets/vestido.png';
import camisa from '../assets/camisa.png';

const PartyInfo = () => {
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);

    return (
        <section className="py-20 px-4 bg-background">
            <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">

                {/* Dress Code */}
                <motion.div
                    className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-primary text-center group"
                    whileHover={{ y: -5 }}
                >
                    <div className="bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                        <UserRound size={32} />
                    </div>
                    <h3 className="text-4xl mb-2 font-heading">Código de Vestimenta</h3>
                    <p className="font-bold text-gray-500 mb-2">Elegante / Casual</p>

                    <div className="flex justify-center gap-8 mt-6">
                        {/* Damas - Dress */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center text-primary border border-pink-100 shadow-sm overflow-hidden">
                                <img src={vestido} alt="Vestido" className="w-10 h-10 object-contain" />
                            </div>
                            <span className="font-bold text-gray-500 text-sm">Damas</span>
                        </div>

                        {/* Caballeros - Suit */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-primary border border-blue-100 shadow-sm">
                                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-primary border border-blue-200 shadow-sm overflow-hidden">
                                    <img src={camisa} alt="Vestido" className="w-10 h-10 object-contain" />
                                </div>
                            </div>
                            <span className="font-bold text-gray-500 text-sm">Caballeros</span>
                        </div>
                    </div>
                </motion.div>

                {/* RSVP */}
                <motion.div
                    className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-primary text-center group"
                    whileHover={{ y: -5 }}
                >
                    <div className="bg-primary/10 min-w-16 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                        <MessageCircle size={32} />
                    </div>
                    <h3 className="text-4xl mb-2 font-heading">Confirmar Asistencia</h3>
                    <p className="text-gray-600 mb-6">
                        Esperamos contar contigo. Por favor confirma tu asistencia antes del 26 de Enero.
                    </p>
                    <a
                        href="https://wa.me/+584249743171?text=Hola,%20confirmo%20mi%20asistencia%20a%20la%20boda%20de%20Emma%20y%20Simón. Soy: "
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-secondary transition-colors font-bold shadow-md hover:shadow-lg"
                    >
                        Confirmar por WhatsApp
                    </a>
                </motion.div>

                {/* Gifts */}
                <motion.div
                    className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-primary text-center group cursor-pointer flex flex-col h-full justify-between"
                    whileHover={{ y: -5 }}
                    onClick={() => setIsGiftModalOpen(true)}
                >
                    <div>
                        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                            <Gift size={32} />
                        </div>
                        <h3 className="text-4xl mb-2 font-heading">Mesa de Regalos</h3>
                        <p className="text-gray-600 mb-4">
                            Su presencia es nuestro mejor regalo.
                        </p>
                    </div>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-secondary transition-colors font-bold shadow-md hover:shadow-lg w-fit mt-4 mx-auto"
                    >
                        Ver datos bancarios
                    </a>
                </motion.div>

            </div>

            <GiftModal isOpen={isGiftModalOpen} onClose={() => setIsGiftModalOpen(false)} />

        </section>
    );
};

export default PartyInfo;
