import React from 'react';
import { motion } from 'framer-motion';
import { useInvitado } from '../hooks/useInvitado';
import { evento } from '../config/evento';

/**
 * AccessGate
 * ───────────────────────────────────────────────
 * Controla el acceso a la invitación mediante el
 * token ?ref= de la URL.
 *
 * - Sin token o token inválido → pantalla neutra
 * - Token válido → renderiza children con prop `invitado`
 *
 * Uso:
 *   <AccessGate>
 *     {(invitado) => <App invitado={invitado} />}
 *   </AccessGate>
 */
export default function AccessGate({ children }) {
    const { invitado, loading, error } = useInvitado();

    // ── Cargando ──────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 text-sm tracking-widest uppercase">Cargando...</p>
                </motion.div>
            </div>
        );
    }

    // ── Token inválido / ausente ───────────────
    if (!invitado) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-6">
                <motion.div
                    className="text-center max-w-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <p className="font-heading text-5xl text-primary mb-4">
                        {evento.novios.novio.nombre} &amp; {evento.novios.novia.nombre}
                    </p>
                    <div className="h-px w-16 bg-primary/30 mx-auto mb-6" />
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Esta invitación es personal y solo puede ser accedida
                        mediante el enlace que recibiste.
                    </p>
                    {error && (
                        <p className="text-red-400 text-xs mt-4">{error}</p>
                    )}
                </motion.div>
            </div>
        );
    }

    // ── Token válido → renderiza la invitación ─
    return <>{children(invitado)}</>;
}
