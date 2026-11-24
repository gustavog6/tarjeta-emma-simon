import React, { createContext, useContext, useState, useEffect } from 'react';
import { evento as defaultEvento } from '../config/evento';
import { supabase } from '../lib/supabase';
import { friendlyError } from '../utils/errores';

const ConfigContext = createContext({
    config: defaultEvento,
    loading: false,
    saveConfig: async () => ({ success: false }),
    reloadConfig: async () => {},
});

/**
 * Sincroniza una tabla hija relacional respetando triggers de min/max y FKs:
 * 1. Primero hace UPSERT de las filas actuales (evita bajar del mínimo al reemplazar)
 * 2. Luego borra únicamente las filas cuyos IDs fueron removidos
 */
async function syncRelationalTable(tableName, rows) {
    const { data: existing, error: fetchErr } = await supabase.from(tableName).select('id');
    if (fetchErr) throw fetchErr;

    const existingIds = (existing || []).map((r) => r.id);
    const nextIds = new Set(rows.map((r) => r.id));
    const toDelete = existingIds.filter((id) => !nextIds.has(id));

    if (rows.length > 0) {
        const { error: upsertErr } = await supabase.from(tableName).upsert(rows, { onConflict: 'id' });
        if (upsertErr) throw upsertErr;
    }

    for (const id of toDelete) {
        const { error: delErr } = await supabase.from(tableName).delete().eq('id', id);
        if (delErr) throw delErr;
    }
}

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState(defaultEvento);
    const [loading, setLoading] = useState(true);

    const loadConfigFromDB = async () => {
        try {
            if (!supabase) return;

            const [
                cfgRes,
                gruposRes,
                platosRes,
                contornosRes,
                venuesRes,
                itinerarioRes,
                bancariosRes,
                padrinosRes,
            ] = await Promise.all([
                supabase.from('configuracion').select('*').eq('id', 'default').maybeSingle(),
                supabase.from('grupos').select('*').order('orden', { ascending: true }),
                supabase.from('menu_platos').select('*').order('orden', { ascending: true }),
                supabase.from('menu_contornos').select('*').order('orden', { ascending: true }),
                supabase.from('venues').select('*').order('orden', { ascending: true }),
                supabase.from('itinerario_items').select('*').order('orden', { ascending: true }),
                supabase.from('datos_bancarios').select('*').order('orden', { ascending: true }),
                supabase.from('padrinos').select('*').order('orden', { ascending: true }),
            ]);

            if (cfgRes.error) {
                console.warn('[ConfigContext] Could not load configuracion, using fallback:', cfgRes.error.message);
                return;
            }

            const d = cfgRes.data;
            if (!d) return;

            // Compatibilidad automática: si aún no se aplicó 008 (sigue teniendo columnas JSONB), leerlas
            const isLegacyJsonb = d.novios !== undefined && d.novia_nombre === undefined;
            if (isLegacyJsonb) {
                setConfig((prev) => ({
                    ...prev,
                    novios: d.novios || prev.novios,
                    fecha: d.fecha || prev.fecha,
                    fechaLimiteRsvp: d.fecha_limite_rsvp || prev.fechaLimiteRsvp,
                    venues: Array.isArray(d.venues) ? d.venues : prev.venues,
                    itinerario: Array.isArray(d.itinerario) ? d.itinerario : prev.itinerario,
                    vestimenta: d.vestimenta || prev.vestimenta,
                    menu: d.menu || prev.menu,
                    datosBancarios: Array.isArray(d.datos_bancarios) ? d.datos_bancarios : prev.datosBancarios,
                    padres: d.padres || prev.padres,
                    padrinos: Array.isArray(d.padrinos) ? d.padrinos : prev.padrinos,
                    grupos: Array.isArray(d.grupos) && d.grupos.length > 0 ? d.grupos : prev.grupos,
                    textos: d.textos ? { ...prev.textos, ...d.textos } : prev.textos,
                    urlPublica: d.url_publica || prev.urlPublica,
                    plantillaWhatsapp: d.plantilla_whatsapp || prev.plantillaWhatsapp,
                }));
                return;
            }

            // Esquema normalizado relacional (008+)
            setConfig((prev) => ({
                ...prev,
                novios: {
                    novia: {
                        nombre: d.novia_nombre || prev.novios.novia.nombre,
                        apellido: d.novia_apellido ?? prev.novios.novia.apellido,
                        whatsapp: d.novia_whatsapp ?? prev.novios.novia.whatsapp,
                    },
                    novio: {
                        nombre: d.novio_nombre || prev.novios.novio.nombre,
                        apellido: d.novio_apellido ?? prev.novios.novio.apellido,
                        whatsapp: d.novio_whatsapp ?? prev.novios.novio.whatsapp,
                    },
                },
                fecha: d.fecha || prev.fecha,
                fechaLimiteRsvp: d.fecha_limite_rsvp || prev.fechaLimiteRsvp,
                vestimenta: { tipo: d.vestimenta_tipo ?? '' },
                urlPublica: d.url_publica || prev.urlPublica,
                plantillaWhatsapp: d.plantilla_whatsapp || prev.plantillaWhatsapp,
                padres: {
                    novia: {
                        padre: d.padres_novia_padre ?? '',
                        madre: d.padres_novia_madre ?? '',
                    },
                    novio: {
                        padre: d.padres_novio_padre ?? '',
                        madre: d.padres_novio_madre ?? '',
                    },
                },
                textos: {
                    hero: { badge: d.hero_badge ?? '' },
                    saveTheDate: {
                        titulo: d.save_the_date_titulo ?? prev.textos.saveTheDate.titulo,
                        diaSemana: d.save_the_date_dia_semana ?? '',
                    },
                    eventCards: {
                        titulo: d.event_cards_titulo ?? prev.textos.eventCards.titulo,
                        subtitulo: d.event_cards_subtitulo ?? '',
                    },
                    itinerario: {
                        titulo: d.itinerario_titulo ?? prev.textos.itinerario.titulo,
                    },
                    rsvp: {
                        titulo: d.rsvp_titulo ?? prev.textos.rsvp.titulo,
                        subtitulo: d.rsvp_subtitulo ?? '',
                    },
                    regalos: {
                        titulo: d.regalos_titulo ?? prev.textos.regalos.titulo,
                        subtitulo: d.regalos_subtitulo ?? '',
                    },
                    quote: {
                        texto: d.quote_texto ?? '',
                        firma: d.quote_firma ?? '',
                    },
                    footer: {
                        versiculo: d.footer_versiculo ?? '',
                        referencia: d.footer_referencia ?? '',
                    },
                    overlay: {
                        boton: d.overlay_boton ?? prev.textos.overlay.boton,
                    },
                },
                grupos:
                    !gruposRes.error && Array.isArray(gruposRes.data) && gruposRes.data.length > 0
                        ? gruposRes.data.map((g) => ({
                              id: g.id,
                              nombre: g.nombre,
                              color: g.color,
                              whatsapp: g.whatsapp || '',
                          }))
                        : prev.grupos,
                menu: {
                    platosFuertes:
                        !platosRes.error && Array.isArray(platosRes.data)
                            ? platosRes.data.map((p) => ({ id: p.id, nombre: p.nombre }))
                            : prev.menu.platosFuertes,
                    contornos:
                        !contornosRes.error && Array.isArray(contornosRes.data)
                            ? contornosRes.data.map((c) => ({ id: c.id, nombre: c.nombre }))
                            : prev.menu.contornos,
                    maxContornos: d.max_contornos ?? prev.menu.maxContornos,
                },
                venues:
                    !venuesRes.error && Array.isArray(venuesRes.data)
                        ? venuesRes.data.map((v) => ({
                              id: v.id,
                              tipo: v.tipo,
                              titulo: v.titulo,
                              lugar: v.lugar || '',
                              direccion: v.direccion || '',
                              hora: v.hora || '',
                              mapUrl: v.map_url || '',
                              externalLink: v.external_link || '',
                              plataforma: v.plataforma || '',
                              streamUrl: v.stream_url || '',
                              codigoAcceso: v.codigo_acceso || '',
                          }))
                        : prev.venues,
                itinerario:
                    !itinerarioRes.error && Array.isArray(itinerarioRes.data)
                        ? itinerarioRes.data.map((it) => ({
                              id: it.id,
                              hora: it.hora,
                              titulo: it.titulo,
                              icono: it.icono,
                          }))
                        : prev.itinerario,
                datosBancarios:
                    !bancariosRes.error && Array.isArray(bancariosRes.data)
                        ? bancariosRes.data.map((b) => ({
                              id: b.id,
                              tipo: b.tipo,
                              banco: b.banco,
                              titular: b.titular,
                              telefono: b.telefono || '',
                              cedula: b.cedula || '',
                              id_binance: b.binance_id || '',
                              // Compatibilidad con GiftModal que lee `item.id` para Binance Pay
                              ...(b.tipo === 'Binance Pay' ? { id: b.binance_id || '', rowId: b.id } : { rowId: b.id }),
                          }))
                        : prev.datosBancarios,
                padrinos:
                    !padrinosRes.error && Array.isArray(padrinosRes.data)
                        ? padrinosRes.data.map((p) => ({ id: p.id, nombre: p.nombre, rol: p.rol }))
                        : prev.padrinos,
            }));
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
            // 1. Guardar columnas escalares en `configuracion`
            const scalarPayload = {
                id: 'default',
                novia_nombre: newConfigData.novios?.novia?.nombre?.trim() || '',
                novia_apellido: newConfigData.novios?.novia?.apellido?.trim() || null,
                novia_whatsapp: newConfigData.novios?.novia?.whatsapp?.trim() || null,
                novio_nombre: newConfigData.novios?.novio?.nombre?.trim() || '',
                novio_apellido: newConfigData.novios?.novio?.apellido?.trim() || null,
                novio_whatsapp: newConfigData.novios?.novio?.whatsapp?.trim() || null,
                fecha: newConfigData.fecha,
                fecha_limite_rsvp: newConfigData.fechaLimiteRsvp,
                vestimenta_tipo: newConfigData.vestimenta?.tipo?.trim() || null,
                max_contornos: Number(newConfigData.menu?.maxContornos ?? 2),
                url_publica: newConfigData.urlPublica?.trim() || null,
                plantilla_whatsapp: newConfigData.plantillaWhatsapp || null,
                padres_novia_padre: newConfigData.padres?.novia?.padre?.trim() || null,
                padres_novia_madre: newConfigData.padres?.novia?.madre?.trim() || null,
                padres_novio_padre: newConfigData.padres?.novio?.padre?.trim() || null,
                padres_novio_madre: newConfigData.padres?.novio?.madre?.trim() || null,
                hero_badge: newConfigData.textos?.hero?.badge?.trim() || null,
                save_the_date_titulo: newConfigData.textos?.saveTheDate?.titulo?.trim() || null,
                save_the_date_dia_semana: newConfigData.textos?.saveTheDate?.diaSemana?.trim() || null,
                event_cards_titulo: newConfigData.textos?.eventCards?.titulo?.trim() || null,
                event_cards_subtitulo: newConfigData.textos?.eventCards?.subtitulo?.trim() || null,
                itinerario_titulo: newConfigData.textos?.itinerario?.titulo?.trim() || null,
                rsvp_titulo: newConfigData.textos?.rsvp?.titulo?.trim() || null,
                rsvp_subtitulo: newConfigData.textos?.rsvp?.subtitulo?.trim() || null,
                regalos_titulo: newConfigData.textos?.regalos?.titulo?.trim() || null,
                regalos_subtitulo: newConfigData.textos?.regalos?.subtitulo?.trim() || null,
                quote_texto: newConfigData.textos?.quote?.texto?.trim() || null,
                quote_firma: newConfigData.textos?.quote?.firma?.trim() || null,
                footer_versiculo: newConfigData.textos?.footer?.versiculo?.trim() || null,
                footer_referencia: newConfigData.textos?.footer?.referencia?.trim() || null,
                overlay_boton: newConfigData.textos?.overlay?.boton?.trim() || null,
                updated_at: new Date().toISOString(),
            };

            const { error: cfgErr } = await supabase.from('configuracion').upsert([scalarPayload]);
            if (cfgErr) throw cfgErr;

            // 2. Sincronizar las 7 tablas relacionales
            await syncRelationalTable(
                'grupos',
                (newConfigData.grupos || []).map((g, idx) => ({
                    id: g.id,
                    nombre: g.nombre.trim(),
                    color: g.color || 'gray',
                    whatsapp: g.whatsapp?.trim() || null,
                    orden: idx,
                }))
            );

            await syncRelationalTable(
                'menu_platos',
                (newConfigData.menu?.platosFuertes || []).map((p, idx) => ({
                    id: p.id,
                    nombre: p.nombre.trim(),
                    orden: idx,
                }))
            );

            await syncRelationalTable(
                'menu_contornos',
                (newConfigData.menu?.contornos || []).map((c, idx) => ({
                    id: c.id,
                    nombre: c.nombre.trim(),
                    orden: idx,
                }))
            );

            await syncRelationalTable(
                'venues',
                (newConfigData.venues || []).map((v, idx) => ({
                    id: v.id || `venue-${idx + 1}`,
                    tipo: v.tipo || 'ceremony',
                    titulo: v.titulo?.trim() || 'Evento',
                    lugar: v.lugar?.trim() || null,
                    direccion: v.direccion?.trim() || null,
                    hora: v.hora?.trim() || null,
                    map_url: v.mapUrl?.trim() || null,
                    external_link: v.externalLink?.trim() || null,
                    plataforma: v.plataforma?.trim() || null,
                    stream_url: v.streamUrl?.trim() || null,
                    codigo_acceso: v.codigoAcceso?.trim() || null,
                    orden: idx,
                }))
            );

            await syncRelationalTable(
                'itinerario_items',
                (newConfigData.itinerario || []).map((it, idx) => ({
                    id: it.id || `it-${idx + 1}`,
                    hora: it.hora?.trim() || '',
                    titulo: it.titulo?.trim() || '',
                    icono: it.icono || 'MapPin',
                    orden: idx,
                }))
            );

            await syncRelationalTable(
                'datos_bancarios',
                (newConfigData.datosBancarios || []).map((b, idx) => ({
                    id: b.rowId || `cta-${idx + 1}`,
                    tipo: b.tipo === 'Binance Pay' ? 'Binance Pay' : 'Pago Móvil',
                    banco: b.banco?.trim() || '',
                    titular: b.titular?.trim() || '',
                    telefono: b.tipo === 'Binance Pay' ? null : (b.telefono?.trim() || null),
                    cedula: b.tipo === 'Binance Pay' ? null : (b.cedula?.trim() || null),
                    binance_id: b.tipo === 'Binance Pay' ? (b.id?.trim() || b.id_binance?.trim() || null) : null,
                    orden: idx,
                }))
            );

            await syncRelationalTable(
                'padrinos',
                (newConfigData.padrinos || []).map((p, idx) => ({
                    id: p.id || `pad-${idx + 1}`,
                    nombre: p.nombre?.trim() || '',
                    rol: p.rol?.trim() || 'Padrino',
                    orden: idx,
                }))
            );

            await loadConfigFromDB();
            return { success: true };
        } catch (err) {
            console.error('[ConfigContext] Error saving config:', err);
            return { success: false, error: friendlyError(err) };
        }
    };

    return (
        <ConfigContext.Provider value={{ config, loading, saveConfig, reloadConfig: loadConfigFromDB }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);
