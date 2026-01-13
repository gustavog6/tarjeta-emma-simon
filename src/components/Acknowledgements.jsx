import React from 'react';

const Acknowledgements = () => {
    return (
        <footer className="py-20 bg-primary text-white text-center relative overflow-hidden">
            {/* Decor Elements - Light Cream/Bone */}
            <div className="absolute -top-10 -left-10 w-48 h-48 opacity-50 text-[#F5E6CC] pointer-events-none transform rotate-45">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M20 20C20 20 60 20 80 50C100 80 80 120 50 120C20 120 20 80 50 80C80 80 120 120 120 160C120 200 160 200 160 200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M10 10C30 10 50 30 50 50" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 opacity-50 text-[#F5E6CC] pointer-events-none transform -rotate-135">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M20 20C20 20 60 20 80 50C100 80 80 120 50 120C20 120 20 80 50 80C80 80 120 120 120 160C120 200 160 200 160 200" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M10 10C30 10 50 30 50 50" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
            </div>

            <div className="max-w-2xl mx-auto px-6 relative z-10">
                <h2 className="font-heading text-5xl mb-6">¡Gracias!</h2>
                <p className="text-lg md:text-xl font-light opacity-90 mb-8">
                    Estamos muy emocionados de compartir este día con ustedes.
                </p>
                <p className="text-sm opacity-70">
                    Con amor, Emma & Simón
                </p>
            </div>
        </footer>
    );
};

export default Acknowledgements;
