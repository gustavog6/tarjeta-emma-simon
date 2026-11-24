import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Sparkles } from 'lucide-react';
import { evento } from '../config/evento';

const StoryBannerModal = ({ isOpen, onClose }) => {
    const canvasRef = useRef(null);
    const [downloading, setDownloading] = useState(false);

    if (!isOpen) return null;

    const { novios, fecha, venues } = evento;
    const venue = venues[0] || {};
    const dateObj = new Date(fecha);
    const dateFormatted = dateObj.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const timeFormatted = dateObj.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const handleDownloadStory = () => {
        setDownloading(true);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const W = 1080;
        const H = 1920;
        canvas.width = W;
        canvas.height = H;

        // Background
        ctx.fillStyle = '#FCFCFA';
        ctx.fillRect(0, 0, W, H);

        // Gradient overlay
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.5, '#F7FAF7');
        grad.addColorStop(1, '#EEF5EF');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Decorative borders
        ctx.strokeStyle = '#7FB383';
        ctx.lineWidth = 4;
        ctx.strokeRect(60, 60, W - 120, H - 120);

        ctx.strokeStyle = 'rgba(127, 179, 131, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(80, 80, W - 160, H - 160);

        // Top Badge
        ctx.textAlign = 'center';
        ctx.fillStyle = '#7FB383';
        ctx.font = 'bold 34px sans-serif';
        ctx.letterSpacing = '10px';
        ctx.fillText('¡NOS CASAMOS!', W / 2, 380);

        // Divider
        ctx.beginPath();
        ctx.moveTo(W / 2 - 120, 440);
        ctx.lineTo(W / 2 + 120, 440);
        ctx.strokeStyle = 'rgba(127, 179, 131, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Names
        ctx.font = 'italic 130px "Great Vibes", cursive, serif';
        ctx.fillStyle = '#658F68';
        ctx.fillText(`${novios.novio.nombre}`, W / 2, 680);

        ctx.font = '48px sans-serif';
        ctx.fillStyle = '#7FB383';
        ctx.fillText('&', W / 2, 780);

        ctx.font = 'italic 130px "Great Vibes", cursive, serif';
        ctx.fillStyle = '#658F68';
        ctx.fillText(`${novios.novia.nombre}`, W / 2, 920);

        // Date container
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.06)';
        ctx.shadowBlur = 30;
        ctx.roundRect ? ctx.roundRect(W / 2 - 380, 1120, 760, 220, 40) : ctx.rect(W / 2 - 380, 1120, 760, 220);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.fillStyle = '#7FB383';
        ctx.font = 'bold 44px sans-serif';
        ctx.fillText(dateFormatted.toUpperCase(), W / 2, 1210);

        ctx.fillStyle = '#666666';
        ctx.font = '36px sans-serif';
        ctx.fillText(`${timeFormatted.toUpperCase()}`, W / 2, 1280);

        // Venue
        ctx.fillStyle = '#444444';
        ctx.font = 'bold 38px sans-serif';
        ctx.fillText(`${venue.lugar || 'La Llovizna Hotel & Casino'}`, W / 2, 1460);

        ctx.fillStyle = '#888888';
        ctx.font = '30px sans-serif';
        ctx.fillText(`${venue.direccion || 'Puerto Ordaz, Venezuela'}`, W / 2, 1520);

        // Bottom text
        ctx.fillStyle = '#7FB383';
        ctx.font = 'italic 40px sans-serif';
        ctx.fillText('"Acompáñanos a celebrar nuestro gran día"', W / 2, 1720);

        // Trigger download
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `historia-boda-${novios.novio.nombre}-${novios.novia.nombre}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setDownloading(false);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />

                <motion.div
                    className="relative z-10 bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full p-6 text-center border-2 border-primary/20 max-h-[95vh] flex flex-col justify-between"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider">
                            <Sparkles size={14} /> Banner para Historias
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full cursor-pointer">
                            <X size={18} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Preview (9:16 Aspect ratio) */}
                    <div className="mx-auto w-[220px] aspect-[9/16] bg-gradient-to-b from-[#FCFCFA] to-[#EEF5EF] rounded-2xl border-4 border-primary/30 p-4 flex flex-col items-center justify-between shadow-inner text-center relative overflow-hidden select-none">
                        <div className="pt-2">
                            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-primary">
                                ¡Nos Casamos!
                            </span>
                            <div className="h-px w-8 bg-primary/30 mx-auto my-1.5" />
                        </div>

                        <div>
                            <p className="font-heading text-3xl text-primary leading-tight">{novios.novio.nombre}</p>
                            <span className="text-xs text-primary font-serif">&amp;</span>
                            <p className="font-heading text-3xl text-primary leading-tight">{novios.novia.nombre}</p>
                        </div>

                        <div className="bg-white/90 p-2 rounded-xl shadow-xs w-full">
                            <p className="text-[10px] font-bold text-gray-700 uppercase">{dateFormatted}</p>
                            <p className="text-[9px] text-gray-500">{timeFormatted}</p>
                            <p className="text-[8px] text-primary font-semibold mt-0.5">{venue.lugar}</p>
                        </div>

                        <p className="text-[8px] italic text-gray-400 pb-1">
                            ¡Acompáñanos a celebrar!
                        </p>
                    </div>

                    {/* Hidden Canvas used for high-res 1080x1920 export */}
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="mt-5 space-y-2">
                        <button
                            onClick={handleDownloadStory}
                            disabled={downloading}
                            className="w-full py-3 rounded-full bg-primary text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-secondary transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Download size={16} />
                            {downloading ? 'Generando imagen...' : 'Descargar para Instagram / WhatsApp'}
                        </button>
                        <p className="text-[10px] text-gray-400">
                            Descarga la imagen lista en tamaño ideal (1080x1920) para compartir en tus historias.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StoryBannerModal;
