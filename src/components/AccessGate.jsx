import React from 'react';
import { motion } from 'framer-motion';
import { useGuestAccess } from '../hooks/useGuestAccess';
import { useEventConfig } from '../context/EventConfigContext';
import { formatHostsNames } from '../config/eventPresets';

export default function AccessGate({ children }) {
    const { config } = useEventConfig();
    const { guest, attendees, loading, error, reload } = useGuestAccess();
    const hostsLabel = formatHostsNames(config.hosts);

    if (loading) {
        return (
            <div className="min-h-dvh-safe safe-overlay bg-background flex items-center justify-center">
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

    if (!guest) {
        return (
            <div className="min-h-dvh-safe safe-overlay bg-background flex items-center justify-center">
                <motion.div
                    className="text-center max-w-sm min-w-0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <p className="font-heading section-title-fluid text-primary mb-4 break-anywhere">
                        {hostsLabel}
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

    return <>{children(guest, attendees, reload)}</>;
}
