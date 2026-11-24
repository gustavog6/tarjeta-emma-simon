import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Sparkles } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { parseFecha } from '../utils/fechas';

/**
 * Dibuja texto centrado con salto de línea automático para evitar desbordes.
 * Devuelve la coordenada Y final después de la última línea.
 */
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return y;
    const words = String(text).split(/\s+/);
    let line = '';
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
        const testLine = line ? `${line} ${words[i]}` : words[i];
        const { width } = ctx.measureText(testLine);
        if (width > maxWidth && line) {
            ctx.fillText(line, x, currentY);
            line = words[i];
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    if (line) {
        ctx.fillText(line, x, currentY);
    }
    return currentY;
}

const StoryBannerModal = ({ isOpen, onClose }) => {
    const { config } = useConfig();
    const canvasRef = useRef(null);
    const [downloading, setDownloading] = useState(false);

    if (!isOpen) return null;

    const { novios, fecha, venues } = config;
    const venue = venues[0] || {};
    const dateObj = parseFecha(fecha) || new Date();
    const dateFormatted = dateObj.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const timeFormatted = dateObj.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    const handleDownloadStory = () => {
        setDownloading(true);
        const canvas = canvasRef.current;
        if (!canvas) {
            setDownloading(false);
            return;
        }

        const ctx = canvas.getContext('2d');
        const W = 1080;
        const H = 1920;
        const MAX_TEXT_W = W - 220; // Margen seguro dentro del marco interior (80px por lado + 30px)
        canvas.width = W;
        canvas.height = H;

        // Fondo degradado suave
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.5, '#F7FAF7');
        grad.addColorStop(1, '#EEF5EF');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Marco decorativo doble
        ctx.strokeStyle = '#7FB383';
        ctx.lineWidth = 4;
        ctx.strokeRect(60, 60, W - 120, H - 120);

        ctx.strokeStyle = 'rgba(127, 179, 131, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(80, 80, W - 160, H - 160);

        // Badge superior
        ctx.textAlign = 'center';
        ctx.fillStyle = '#7FB383';
        ctx.font = 'bold 34px Lato, sans-serif';
        if ('letterSpacing' in ctx) ctx.letterSpacing = '10px';
        ctx.fillText('¡NOS CASAMOS!', W / 2, 360);

        // IMPORTANTE: resetear letterSpacing para que no se desborden los textos siguientes
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

        // Divisor
        ctx.beginPath();
        ctx.moveTo(W / 2 - 120, 420);
        ctx.lineTo(W / 2 + 120, 420);
        ctx.strokeStyle = 'rgba(127, 179, 131, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Nombres de los novios
        ctx.font = 'italic 132px "Great Vibes", cursive, serif';
        ctx.fillStyle = '#658F68';
        ctx.fillText(`${novios.novio.nombre}`, W / 2, 660, MAX_TEXT_W);

        ctx.font = '46px Lato, sans-serif';
        ctx.fillStyle = '#7FB383';
        ctx.fillText('&', W / 2, 755);

        ctx.font = 'italic 132px "Great Vibes", cursive, serif';
        ctx.fillStyle = '#658F68';
        ctx.fillText(`${novios.novia.nombre}`, W / 2, 900, MAX_TEXT_W);

        // Contenedor de fecha
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.06)';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(W / 2 - 380, 1080, 760, 220, 40);
        } else {
            ctx.rect(W / 2 - 380, 1080, 760, 220);
        }
        ctx.fill();
        ctx.shadowColor = 'transparent';

        ctx.fillStyle = '#7FB383';
        ctx.font = 'bold 42px Lato, sans-serif';
        if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
        ctx.fillText(dateFormatted.toUpperCase(), W / 2, 1175, 700);

        ctx.fillStyle = '#666666';
        ctx.font = '34px Lato, sans-serif';
        if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
        ctx.fillText(timeFormatted.toUpperCase(), W / 2, 1245, 700);

        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

        // Lugar y dirección (con ajuste automático de línea)
        ctx.fillStyle = '#444444';
        ctx.font = 'bold 38px Lato, sans-serif';
        const afterLugarY = drawWrappedText(
            ctx,
            venue.lugar || 'Lugar del Evento',
            W / 2,
            1420,
            MAX_TEXT_W,
            48
        );

        ctx.fillStyle = '#777777';
        ctx.font = '30px Lato, sans-serif';
        drawWrappedText(
            ctx,
            venue.direccion || '',
            W / 2,
            afterLugarY + 54,
            MAX_TEXT_W,
            40
        );

        // Frase inferior con margen seguro y salto de línea automático
        ctx.fillStyle = '#7FB383';
        ctx.font = 'italic 36px Lato, sans-serif';
        drawWrappedText(
            ctx,
            '"Acompáñanos a celebrar nuestro gran día"',
            W / 2,
            1685,
            MAX_TEXT_W,
            48
        );

        // Descargar imagen
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
                            <p className="text-[8px] text-primary font-semibold mt-0.5 truncate">{venue.lugar}</p>
                        </div>

                        <p className="text-[8px] italic text-gray-400 pb-1 px-1">
                            &ldquo;Acompáñanos a celebrar nuestro gran día&rdquo;
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
