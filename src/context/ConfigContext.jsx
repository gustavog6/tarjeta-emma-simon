import React, { createContext, useContext, useState, useEffect } from 'react';
import { evento as defaultEvento } from '../config/evento';
import { supabase } from '../lib/supabase';

const ConfigContext = createContext({
    config: defaultEvento,
    loading: false,
    saveConfig: async () => {},
    reloadConfig: async () => {},
});

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState(defaultEvento);
    const [loading, setLoading] = useState(true);

    const loadConfigFromDB = async () => {
        try {
            if (!supabase) return;
            const { data, error } = await supabase
                .from('configuracion')
                .select('*')
                .eq('id', 'default')
                .maybeSingle();

            if (error) {
                console.warn('[ConfigContext] Could not load configuracion from DB, using fallback:', error.message);
                return;
            }

            if (data) {
                // Merging data from DB into config structure
                setConfig(prev => ({
                    ...prev,
                    novios: data.novios || prev.novios,
                    fecha: data.fecha || prev.fecha,
                    fechaLimiteRsvp: data.fecha_limite_rsvp || prev.fechaLimiteRsvp,
                    venues: data.venues || prev.venues,
                    itinerario: data.itinerario || prev.itinerario,
                    vestimenta: data.vestimenta || prev.vestimenta,
                    menu: data.menu || prev.menu,
                    datosBancarios: data.datos_bancarios || prev.datosBancarios,
                }));
            }
        } catch (err) {
            console.error('[ConfigContext] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfigFromDB();
    }, []);

    const saveConfig = async (newConfigData) => {
        try {
            const dbPayload = {
                id: 'default',
                novios: newConfigData.novios,
                fecha: newConfigData.fecha,
                fecha_limite_rsvp: newConfigData.fechaLimiteRsvp,
                venues: newConfigData.venues,
                itinerario: newConfigData.itinerario,
                vestimenta: newConfigData.vestimenta,
                menu: newConfigData.menu,
                datos_bancarios: newConfigData.datosBancarios,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('configuracion')
                .upsert([dbPayload]);

            if (error) throw error;

            setConfig(prev => ({
                ...prev,
                ...newConfigData
            }));

            return { success: true };
        } catch (err) {
            console.error('[ConfigContext] Error saving config:', err);
            return { success: false, error: err.message };
        }
    };

    return (
        <ConfigContext.Provider value={{ config, loading, saveConfig, reloadConfig: loadConfigFromDB }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);
