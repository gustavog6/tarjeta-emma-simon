import React from 'react';
import { useEventConfig } from '../context/EventConfigContext';
import { EVENT_LIMITS, clampText } from '../config/eventLimits';
import footerOrnament from '../assets/footer-ornament.png';

const Acknowledgements = () => {
    const { config } = useEventConfig();
    const note = clampText(config.copy?.footer?.note, EVENT_LIMITS.footer.noteMax);
    const reference = clampText(config.copy?.footer?.reference, EVENT_LIMITS.footer.referenceMax);

    return (
        <footer className="py-20 bg-primary text-white text-center relative overflow-x-clip">
            <div className="absolute -top-10 -left-10 w-48 h-48 opacity-50 text-[#F5E6CC] pointer-events-none transform rotate-45">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M20 20C20 20 60 20 80 50C100 80 80 120 50 120C20 120 20 80 50 80C80 80 120 120 120 160C120 200 160 200 160 200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>

            <div className="max-w-2xl mx-auto px-6 relative z-10 min-w-0">
                <div className="flex justify-center">
                    <img src={footerOrnament} alt="Emblema" className="w-32 aspect-square object-contain opacity-90" />
                </div>
                {(note || reference) && (
                    <div className="mt-10 min-w-0">
                        {note && (
                            <p className="text-base sm:text-lg md:text-xl font-light opacity-85 italic max-w-lg mx-auto leading-relaxed break-anywhere">
                                {note}
                            </p>
                        )}
                        {reference && (
                            <p className="text-xs tracking-[0.3em] uppercase opacity-70 mt-4 break-anywhere">
                                {reference}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </footer>
    );
};

export default Acknowledgements;
