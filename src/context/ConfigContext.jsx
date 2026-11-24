import React, { createContext, useContext, useState, useEffect } from 'react';
import { evento as defaultEvento } from '../config/evento';
import { supabase } from '../lib/supabase';

const isNonEmptyObj = (o) => o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).length > 0;

const mergeTextos = (base, incoming) => {
    if (!isNonEmptyObj(incoming)) return base;
    const out = { ...base };
    for (const k of Object.keys(incoming)) {
        out[k] = { ...(base[k] || {}), ...(incoming[k] || {}) };
    }
    return out;
};

const mergePadres = (base, incoming) => {
    if (!isNonEmptyObj(incoming)) return base;
    return {
        novia: { ...(base?.novia || {}), ...(incoming?.novia || {}) },
        novio: { ...(base?.novio || {}), ...(incoming?.novio || {}) },
    };
};

const ConfigContext = createContext({
    config: defaultEvento,
    loading: false,
    saveConfig: async () => ({ success: false }),
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
                setConfig((prev) => ({
                    ...prev,
                    novios: isNonEmptyObj(data.novios) ? data.novios : prev.novios,
                    fecha: data.fecha || prev.fecha,
                    fechaLimiteRsvp: data.fecha_limite_rsvp || prev.fechaLimiteRsvp,
                    venues: Array.isArray(data.venues) ? data.venues : prev.venues,
                    itinerario: Array.isArray(data.itinerario) ? data.itinerario : prev.itinerario,
                    vestimenta: isNonEmptyObj(data.vestimenta) ? data.vestimenta : prev.vestimenta,
                    menu: isNonEmptyObj(data.menu) ? data.menu : prev.menu,
                    datosBancarios: Array.isArray(data.datos_bancarios) ? data.datos_bancarios : prev.datosBancarios,
                    padres: mergePadres(prev.padres, data.padres),
                    padrinos: Array.isArray(data.padrinos) && data.padrinos.length > 0 ? data.padrinos : prev.padrinos,
                    textos: mergeTextos(prev.textos, data.textos),
                    urlPublica: data.url_publica || prev.urlPublica,
                    plantillaWhatsapp: data.plantilla_whatsapp || prev.plantillaWhatsapp,
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
                venues: newConfigData.venues || [],
                itinerario: newConfigData.itinerario || [],
                vestimenta: newConfigData.vestimenta || { tipo: 'Elegante / Casual' },
                menu: newConfigData.menu,
                datos_bancarios: newConfigData.datosBancarios || [],
                padres: newConfigData.padres || {},
                padrinos: newConfigData.padrinos || [],
                textos: newConfigData.textos || {},
                url_publica: newConfigData.urlPublica || null,
                plantilla_whatsapp: newConfigData.plantillaWhatsapp || null,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('configuracion')
                .upsert([dbPayload]);

            if (error) throw error;

            setConfig((prev) => ({
                ...prev,
                ...newConfigData,
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
