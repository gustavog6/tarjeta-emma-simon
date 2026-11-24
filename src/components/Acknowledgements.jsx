import React from 'react';
import { useConfig } from '../context/ConfigContext';
import silhouetteWhite from '../assets/silueta de pareja wh.png';

const Acknowledgements = () => {
    const { config } = useConfig();
    const { versiculo, referencia } = config.textos.footer;

    return (
        <footer className="py-20 bg-primary text-white text-center relative overflow-hidden">
            {/* Decor */}
            <div className="absolute -top-10 -left-10 w-48 h-48 opacity-50 text-[#F5E6CC] pointer-events-none transform rotate-45">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M20 20C20 20 60 20 80 50C100 80 80 120 50 120C20 120 20 80 50 80C80 80 120 120 120 160C120 200 160 200 160 200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>

            <div className="max-w-2xl mx-auto px-6 relative z-10">
                <div className="flex justify-center">
                    <img src={silhouetteWhite} alt="Silueta Pareja" className="w-32 h-auto opacity-90" />
                </div>
                <div className="mt-12">
                    <p className="text-lg md:text-xl font-light opacity-80 italic max-w-lg mx-auto leading-relaxed">
                        {versiculo}
                    </p>
                    <p className="text-xs tracking-[0.3em] uppercase opacity-60 mt-4">
                        {referencia}
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Acknowledgements;
