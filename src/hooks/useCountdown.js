import { useState, useEffect } from 'react';

/**
 * useCountdown
 * ───────────────────────────────────────────────
 * Calcula el tiempo restante hasta una fecha objetivo.
 * Se actualiza cada segundo.
 *
 * @param {string} targetDateISO — Fecha en formato ISO 8601, ej: '2026-01-31T11:30:00'
 * @returns {{ días: number, horas: number, min: number, seg: number, terminado: boolean }}
 */
export function useCountdown(targetDateISO) {
    const targetMs = new Date(targetDateISO).getTime();

    function calculate() {
        const diff = targetMs - Date.now();
        if (diff <= 0) {
            return { días: 0, horas: 0, min: 0, seg: 0, terminado: true };
        }
        return {
            días:     Math.floor(diff / (1000 * 60 * 60 * 24)),
            horas:    Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            min:      Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seg:      Math.floor((diff % (1000 * 60)) / 1000),
            terminado: false,
        };
    }

    const [timeLeft, setTimeLeft] = useState(calculate);

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calculate()), 1000);
        return () => clearInterval(timer);
    }, [targetDateISO]);

    return timeLeft;
}
