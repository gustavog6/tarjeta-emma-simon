import React from 'react';
import { motion } from 'framer-motion';
import { UserRound } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { INVITATION_LIMITS, clampText } from '../config/invitationLimits';
import vestido from '../assets/vestido-verde.png';
import camisa from '../assets/camisa-verde.png';

const DressCode = () => {
    const { config } = useConfig();
    const tipo = clampText(config.vestimenta?.tipo, INVITATION_LIMITS.vestimenta.tipoMax);

    if (!tipo) return null;

    return (
        <motion.div
            className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border-t-4 border-primary text-center group min-w-0"
            whileHover={{ y: -5 }}
        >
            <div className="bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                <UserRound size={32} />
            </div>
            <h3 className="text-3xl sm:text-4xl mb-2 font-heading">Código de Vestimenta</h3>
            <p className="font-base text-gray-500 mb-2 break-anywhere">{tipo}</p>

            <div className="flex justify-center gap-8 mt-6">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center border border-pink-100 shadow-sm overflow-hidden">
                        <img src={vestido} alt="Vestido" className="w-10 h-10 object-contain" />
                    </div>
                    <span className="font-bold text-gray-500 text-sm">Damas</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 shadow-sm overflow-hidden">
                        <img src={camisa} alt="Camisa" className="w-10 h-10 object-contain" />
                    </div>
                    <span className="font-bold text-gray-500 text-sm">Caballeros</span>
                </div>
            </div>
        </motion.div>
    );
};

export default DressCode;
