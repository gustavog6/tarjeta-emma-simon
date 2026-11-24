import React, { useState, useEffect } from 'react';
import { RefreshCw, Save, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { ICON_NAMES, ICON_MAP } from '../utils/iconRegistry';
import {
    toDateTimeLocal,
    fromDateTimeLocal,
    toDateInput,
    fromDateInputEndOfDay,
} from '../utils/fechas';
import { uniqueId, canonicalId } from '../utils/menu';
import { COLOR_OPTIONS, GROUP_COLORS } from '../utils/grupos';

const VENUE_TIPOS = [
    { value: 'ceremony', label: 'Ceremonia' },
    { value: 'reception', label: 'Recepción' },
    { value: 'live', label: 'Transmisión en vivo' },
    { value: 'videocall', label: 'Videollamada' },
];

const VESTIMENTA_SUGERENCIAS = [
    'Elegante / Casual',
    'Formal',
    'Gala',
    'Semi-formal',
    'Informal',
];

const ConfigTab = ({ confirmaciones = [], invitados = [] }) => {
    const { config, saveConfig, reloadConfig } = useConfig();
    const [form, setForm] = useState(config);
    const [saveStatus, setSaveStatus] = useState({ loading: false, msg: null, error: false });

    useEffect(() => {
        setForm(config);
    }, [config]);

    const gruposEnUso = new Set(invitados.map((i) => i.grupo).filter(Boolean));

    const platosEnUso = new Set(
        confirmaciones
            .map((c) => canonicalId(config?.menu?.platosFuertes || [], c.plato_fuerte))
            .filter(Boolean)
    );
    const contornosEnUso = new Set(
        confirmaciones
            .flatMap((c) => (c.contornos || []).map((id) => canonicalId(config?.menu?.contornos || [], id)))
            .filter(Boolean)
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaveStatus({ loading: true, msg: null, error: false });

        // Normalizar URL pública sin slash final
        const cleaned = {
            ...form,
            urlPublica: (form.urlPublica || '').trim().replace(/\/+$/, ''),
        };

        const res = await saveConfig(cleaned);
        if (res.success) {
            setSaveStatus({
                loading: false,
                msg: '¡Configuración guardada en Supabase! La invitación ya refleja estos cambios.',
                error: false,
            });
            setTimeout(() => setSaveStatus({ loading: false, msg: null, error: false }), 5000);
        } else {
            setSaveStatus({
                loading: false,
                msg: `Error al guardar: ${res.error}`,
                error: true,
            });
        }
    };

    const removePlato = (idx) => {
        const plato = form.menu.platosFuertes[idx];
        if (platosEnUso.has(plato.id)) {
            const ok = window.confirm(
                `Atención: "${plato.nombre}" ya fue elegido por al menos un asistente confirmado.\n\nSi lo eliminas, en los reportes aparecerá como "(retirado del menú)". ¿Deseas continuar?`
            );
            if (!ok) return;
        }
        const next = form.menu.platosFuertes.filter((_, i) => i !== idx);
        setForm({ ...form, menu: { ...form.menu, platosFuertes: next } });
    };

    const removeContorno = (idx) => {
        const c = form.menu.contornos[idx];
        if (contornosEnUso.has(c.id)) {
            const ok = window.confirm(
                `Atención: "${c.nombre}" ya fue elegido por al menos un asistente confirmado.\n\nSi lo eliminas, en los reportes aparecerá como "(retirado del menú)". ¿Deseas continuar?`
            );
            if (!ok) return;
        }
        const next = form.menu.contornos.filter((_, i) => i !== idx);
        setForm({ ...form, menu: { ...form.menu, contornos: next } });
    };

    const removeGrupo = (idx) => {
        const g = (form.grupos || [])[idx];
        if ((form.grupos || []).length <= 1) {
            alert('Debe existir al menos un grupo de invitados.');
            return;
        }
        if (gruposEnUso.has(g.id)) {
            const ok = window.confirm(
                `Atención: "${g.nombre}" ya está asignado a uno o más invitados.\n\nSi lo eliminas, esos invitados seguirán mostrando el código "${g.id}". ¿Deseas continuar?`
            );
            if (!ok) return;
        }
        setForm({ ...form, grupos: form.grupos.filter((_, i) => i !== idx) });
    };

    const updateText = (section, key, value) => {
        setForm({
            ...form,
            textos: {
                ...(form.textos || {}),
                [section]: {
                    ...(form.textos?.[section] || {}),
                    [key]: value,
                },
            },
        });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 max-w-5xl space-y-6">
            <div className="border-b border-gray-100 pb-3 flex flex-wrap justify-between items-center gap-3">
                <div>
                    <h2 className="text-base font-bold text-gray-900">Configuración Global del Evento</h2>
                    <p className="text-xs text-gray-500">
                        Todo lo que guardes aquí se almacena en la tabla <code>configuracion</code> y se refleja al instante en la invitación y en el panel.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={reloadConfig}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 cursor-pointer"
                >
                    <RefreshCw size={13} /> Recargar desde BD
                </button>
            </div>

            {saveStatus.msg && (
                <div
                    className={`p-3 rounded-lg text-xs font-bold ${
                        saveStatus.error
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-green-50 text-green-700 border border-green-200'
                    }`}
                >
                    {saveStatus.msg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-7 text-xs">
                {/* 1. Novios */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">1. Datos de los Novios</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        {[
                            { key: 'novia', label: 'La Novia' },
                            { key: 'novio', label: 'El Novio' },
                        ].map(({ key, label }) => (
                            <div key={key} className="space-y-2">
                                <span className="text-[11px] font-bold text-gray-600 uppercase">{label}</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase">Nombre *</label>
                                        <input
                                            type="text"
                                            value={form?.novios?.[key]?.nombre || ''}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    novios: {
                                                        ...form.novios,
                                                        [key]: { ...form.novios?.[key], nombre: e.target.value },
                                                    },
                                                })
                                            }
                                            className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase">Apellido</label>
                                        <input
                                            type="text"
                                            value={form?.novios?.[key]?.apellido || ''}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    novios: {
                                                        ...form.novios,
                                                        [key]: { ...form.novios?.[key], apellido: e.target.value },
                                                    },
                                                })
                                            }
                                            className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase">WhatsApp (con código país)</label>
                                    <input
                                        type="text"
                                        value={form?.novios?.[key]?.whatsapp || ''}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                novios: {
                                                    ...form.novios,
                                                    [key]: { ...form.novios?.[key], whatsapp: e.target.value },
                                                },
                                            })
                                        }
                                        className="w-full p-2 rounded-lg border border-gray-300 bg-white font-mono"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 2. Grupos de Invitados */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">2. Grupos de Invitados (Filtros y Selects)</h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <p className="text-[11px] text-gray-500">
                            Estos grupos alimentan todos los filtros de las tablas, el selector al crear invitados y el Paso 1 del formulario RSVP.
                        </p>
                        {(form?.grupos || []).map((g, idx) => {
                            const enUso = gruposEnUso.has(g.id);
                            const badgeCls = GROUP_COLORS[g.color]?.badge || GROUP_COLORS.gray.badge;
                            return (
                                <div key={g.id || idx} className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${badgeCls}`}>
                                        {g.nombre || 'Vista'}
                                    </span>
                                    <input
                                        type="text"
                                        value={g.nombre || ''}
                                        onChange={(e) => {
                                            const next = [...form.grupos];
                                            next[idx] = { ...next[idx], nombre: e.target.value };
                                            setForm({ ...form, grupos: next });
                                        }}
                                        placeholder="Nombre del grupo"
                                        className="flex-1 min-w-[140px] p-1.5 rounded border border-gray-300"
                                        required
                                    />
                                    <select
                                        value={g.color || 'gray'}
                                        onChange={(e) => {
                                            const next = [...form.grupos];
                                            next[idx] = { ...next[idx], color: e.target.value };
                                            setForm({ ...form, grupos: next });
                                        }}
                                        className="w-28 p-1.5 rounded border border-gray-300 bg-white"
                                    >
                                        {COLOR_OPTIONS.map((c) => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={g.whatsapp || ''}
                                        onChange={(e) => {
                                            const next = [...form.grupos];
                                            next[idx] = { ...next[idx], whatsapp: e.target.value };
                                            setForm({ ...form, grupos: next });
                                        }}
                                        placeholder="WhatsApp (opcional)"
                                        className="w-36 p-1.5 rounded border border-gray-300 font-mono text-[11px]"
                                    />
                                    {enUso && (
                                        <span
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold shrink-0"
                                            title="Hay invitados asignados a este grupo"
                                        >
                                            <AlertTriangle size={11} /> En uso
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeGrupo(idx)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                        title="Eliminar grupo"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => {
                                const list = form?.grupos || [];
                                const nombre = 'Nuevo Grupo';
                                const id = uniqueId(nombre, list);
                                setForm({
                                    ...form,
                                    grupos: [...list, { id, nombre, color: 'green', whatsapp: '' }],
                                });
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer pt-1"
                        >
                            <Plus size={12} /> Añadir Grupo
                        </button>
                    </div>
                </section>

                {/* 3. Fechas y Enlace Público / WhatsApp */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">3. Fechas, URL Pública y Plantilla WhatsApp</h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                                    Fecha y hora de la boda
                                </label>
                                <input
                                    type="datetime-local"
                                    value={toDateTimeLocal(form?.fecha)}
                                    onChange={(e) =>
                                        setForm({ ...form, fecha: fromDateTimeLocal(e.target.value) })
                                    }
                                    className="w-full p-2 rounded-lg border border-gray-300 bg-white font-mono"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                                    Fecha límite RSVP / menú
                                </label>
                                <input
                                    type="date"
                                    value={toDateInput(form?.fechaLimiteRsvp)}
                                    onChange={(e) =>
                                        setForm({ ...form, fechaLimiteRsvp: fromDateInputEndOfDay(e.target.value) })
                                    }
                                    className="w-full p-2 rounded-lg border border-gray-300 bg-white font-mono"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                                    URL pública de la tarjeta
                                </label>
                                <input
                                    type="url"
                                    value={form?.urlPublica || ''}
                                    onChange={(e) => setForm({ ...form, urlPublica: e.target.value })}
                                    placeholder="https://emmaysimon.netlify.app"
                                    className="w-full p-2 rounded-lg border border-gray-300 bg-white font-mono"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                    Se usa al copiar enlaces y enviar WhatsApp (evita enviar localhost).
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                                Plantilla de mensaje WhatsApp (invitación)
                            </label>
                            <textarea
                                rows={3}
                                value={form?.plantillaWhatsapp || ''}
                                onChange={(e) => setForm({ ...form, plantillaWhatsapp: e.target.value })}
                                className="w-full p-2.5 rounded-lg border border-gray-300 bg-white leading-relaxed"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">
                                Variables disponibles: <code>{'{nombre}'}</code>, <code>{'{personas}'}</code>,{' '}
                                <code>{'{fecha_limite}'}</code>, <code>{'{novios}'}</code>, <code>{'{enlace}'}</code>
                            </p>
                        </div>
                    </div>
                </section>

                {/* 3. Menú */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">3. Menú Gastronómico</h3>
                    <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3">
                            <label className="text-[11px] font-bold text-gray-700 uppercase">
                                Máximo de contornos por persona:
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="6"
                                value={form?.menu?.maxContornos ?? 2}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        menu: { ...form.menu, maxContornos: Math.max(0, parseInt(e.target.value, 10) || 0) },
                                    })
                                }
                                className="w-20 p-1.5 rounded border border-gray-300 bg-white font-bold text-center"
                            />
                        </div>

                        {/* Platos Fuertes */}
                        <div>
                            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1.5">
                                Platos Fuertes
                            </label>
                            <div className="space-y-1.5">
                                {(form?.menu?.platosFuertes || []).map((plato, idx) => {
                                    const enUso = platosEnUso.has(plato.id);
                                    return (
                                        <div key={plato.id || idx} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={plato.nombre}
                                                onChange={(e) => {
                                                    const next = [...form.menu.platosFuertes];
                                                    next[idx] = { ...next[idx], nombre: e.target.value };
                                                    setForm({ ...form, menu: { ...form.menu, platosFuertes: next } });
                                                }}
                                                className="flex-1 p-1.5 rounded border border-gray-300 bg-white"
                                                required
                                            />
                                            {enUso && (
                                                <span
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold"
                                                    title="Ya hay asistentes confirmados con este plato"
                                                >
                                                    <AlertTriangle size={11} /> En uso
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removePlato(idx)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                                title="Eliminar plato"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const list = form?.menu?.platosFuertes || [];
                                        const nombre = 'Nuevo Plato';
                                        const id = uniqueId(nombre, list);
                                        setForm({
                                            ...form,
                                            menu: { ...form.menu, platosFuertes: [...list, { id, nombre }] },
                                        });
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer pt-1"
                                >
                                    <Plus size={12} /> Añadir Plato Fuerte
                                </button>
                            </div>
                        </div>

                        {/* Contornos */}
                        <div className="pt-3 border-t border-gray-200">
                            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1.5">
                                Contornos / Guarniciones
                            </label>
                            <div className="space-y-1.5">
                                {(form?.menu?.contornos || []).map((contorno, idx) => {
                                    const enUso = contornosEnUso.has(contorno.id);
                                    return (
                                        <div key={contorno.id || idx} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={contorno.nombre}
                                                onChange={(e) => {
                                                    const next = [...form.menu.contornos];
                                                    next[idx] = { ...next[idx], nombre: e.target.value };
                                                    setForm({ ...form, menu: { ...form.menu, contornos: next } });
                                                }}
                                                className="flex-1 p-1.5 rounded border border-gray-300 bg-white"
                                                required
                                            />
                                            {enUso && (
                                                <span
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold"
                                                    title="Ya hay asistentes confirmados con este contorno"
                                                >
                                                    <AlertTriangle size={11} /> En uso
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeContorno(idx)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                                title="Eliminar contorno"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const list = form?.menu?.contornos || [];
                                        const nombre = 'Nuevo Contorno';
                                        const id = uniqueId(nombre, list);
                                        setForm({
                                            ...form,
                                            menu: { ...form.menu, contornos: [...list, { id, nombre }] },
                                        });
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer pt-1"
                                >
                                    <Plus size={12} /> Añadir Contorno
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Ubicaciones / Venues */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">4. Ubicaciones / Ceremonias</h3>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        {(form?.venues || []).map((venue, idx) => (
                            <div key={venue.id || idx} className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-700">Ubicación #{idx + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setForm({ ...form, venues: form.venues.filter((_, i) => i !== idx) })
                                        }
                                        className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                        title="Eliminar ubicación"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase">Tipo</label>
                                        <select
                                            value={venue.tipo || 'ceremony'}
                                            onChange={(e) => {
                                                const next = [...form.venues];
                                                next[idx] = { ...next[idx], tipo: e.target.value };
                                                setForm({ ...form, venues: next });
                                            }}
                                            className="w-full p-1.5 rounded border border-gray-300 bg-white"
                                        >
                                            {VENUE_TIPOS.map((t) => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase">Título</label>
                                        <input
                                            type="text"
                                            value={venue.titulo || ''}
                                            onChange={(e) => {
                                                const next = [...form.venues];
                                                next[idx] = { ...next[idx], titulo: e.target.value };
                                                setForm({ ...form, venues: next });
                                            }}
                                            className="w-full p-1.5 rounded border border-gray-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase">Hora</label>
                                        <input
                                            type="text"
                                            value={venue.hora || ''}
                                            onChange={(e) => {
                                                const next = [...form.venues];
                                                next[idx] = { ...next[idx], hora: e.target.value };
                                                setForm({ ...form, venues: next });
                                            }}
                                            placeholder="11:30 AM"
                                            className="w-full p-1.5 rounded border border-gray-300"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase">Lugar</label>
                                        <input
                                            type="text"
                                            value={venue.lugar || ''}
                                            onChange={(e) => {
                                                const next = [...form.venues];
                                                next[idx] = { ...next[idx], lugar: e.target.value };
                                                setForm({ ...form, venues: next });
                                            }}
                                            className="w-full p-1.5 rounded border border-gray-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase">Dirección</label>
                                        <input
                                            type="text"
                                            value={venue.direccion || ''}
                                            onChange={(e) => {
                                                const next = [...form.venues];
                                                next[idx] = { ...next[idx], direccion: e.target.value };
                                                setForm({ ...form, venues: next });
                                            }}
                                            className="w-full p-1.5 rounded border border-gray-300"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase">URL Mapa Embebido (iframe)</label>
                                        <input
                                            type="url"
                                            value={venue.mapUrl || ''}
                                            onChange={(e) => {
                                                const next = [...form.venues];
                                                next[idx] = { ...next[idx], mapUrl: e.target.value };
                                                setForm({ ...form, venues: next });
                                            }}
                                            className="w-full p-1.5 rounded border border-gray-300 font-mono text-[11px]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase">Enlace externo Google Maps</label>
                                        <input
                                            type="url"
                                            value={venue.externalLink || ''}
                                            onChange={(e) => {
                                                const next = [...form.venues];
                                                next[idx] = { ...next[idx], externalLink: e.target.value };
                                                setForm({ ...form, venues: next });
                                            }}
                                            className="w-full p-1.5 rounded border border-gray-300 font-mono text-[11px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() =>
                                setForm({
                                    ...form,
                                    venues: [
                                        ...(form.venues || []),
                                        {
                                            id: `venue-${Date.now()}`,
                                            tipo: 'reception',
                                            titulo: 'Recepción',
                                            lugar: '',
                                            direccion: '',
                                            hora: '',
                                            mapUrl: '',
                                            externalLink: '',
                                        },
                                    ],
                                })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                            <Plus size={12} /> Añadir Ubicación
                        </button>
                    </div>
                </section>

                {/* 5. Itinerario */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">5. Itinerario</h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        {(form?.itinerario || []).map((item, idx) => {
                            const IconComp = ICON_MAP[item.icono] || ICON_MAP.MapPin;
                            return (
                                <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <IconComp size={15} />
                                    </div>
                                    <input
                                        type="text"
                                        value={item.hora || ''}
                                        onChange={(e) => {
                                            const next = [...form.itinerario];
                                            next[idx] = { ...next[idx], hora: e.target.value };
                                            setForm({ ...form, itinerario: next });
                                        }}
                                        placeholder="12:00 M"
                                        className="w-28 p-1.5 rounded border border-gray-300"
                                    />
                                    <input
                                        type="text"
                                        value={item.titulo || ''}
                                        onChange={(e) => {
                                            const next = [...form.itinerario];
                                            next[idx] = { ...next[idx], titulo: e.target.value };
                                            setForm({ ...form, itinerario: next });
                                        }}
                                        placeholder="Actividad"
                                        className="flex-1 min-w-[160px] p-1.5 rounded border border-gray-300"
                                    />
                                    <select
                                        value={item.icono || 'MapPin'}
                                        onChange={(e) => {
                                            const next = [...form.itinerario];
                                            next[idx] = { ...next[idx], icono: e.target.value };
                                            setForm({ ...form, itinerario: next });
                                        }}
                                        className="w-32 p-1.5 rounded border border-gray-300 bg-white"
                                    >
                                        {ICON_NAMES.map((name) => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setForm({ ...form, itinerario: form.itinerario.filter((_, i) => i !== idx) })
                                        }
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                        title="Eliminar paso"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() =>
                                setForm({
                                    ...form,
                                    itinerario: [
                                        ...(form.itinerario || []),
                                        { hora: '', titulo: '', icono: 'Sparkles' },
                                    ],
                                })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer pt-1"
                        >
                            <Plus size={12} /> Añadir Momento al Itinerario
                        </button>
                    </div>
                </section>

                {/* 6. Código de Vestimenta */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">6. Código de Vestimenta</h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-wrap items-center gap-3">
                        <input
                            type="text"
                            list="vestimenta-sugerencias"
                            value={form?.vestimenta?.tipo || ''}
                            onChange={(e) =>
                                setForm({ ...form, vestimenta: { ...form.vestimenta, tipo: e.target.value } })
                            }
                            placeholder="Ej: Elegante / Casual"
                            className="flex-1 min-w-[220px] p-2 rounded-lg border border-gray-300 bg-white"
                        />
                        <datalist id="vestimenta-sugerencias">
                            {VESTIMENTA_SUGERENCIAS.map((v) => (
                                <option key={v} value={v} />
                            ))}
                        </datalist>
                    </div>
                </section>

                {/* 7. Datos Bancarios */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">7. Mesa de Regalos / Datos Bancarios</h3>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        {(form?.datosBancarios || []).map((cuenta, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-700">Cuenta #{idx + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setForm({
                                                ...form,
                                                datosBancarios: form.datosBancarios.filter((_, i) => i !== idx),
                                            })
                                        }
                                        className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase">Tipo</label>
                                        <select
                                            value={cuenta.tipo || 'Pago Móvil'}
                                            onChange={(e) => {
                                                const next = [...form.datosBancarios];
                                                next[idx] = { ...next[idx], tipo: e.target.value };
                                                setForm({ ...form, datosBancarios: next });
                                            }}
                                            className="w-full p-1.5 rounded border border-gray-300 bg-white"
                                        >
                                            <option value="Pago Móvil">Pago Móvil</option>
                                            <option value="Binance Pay">Binance Pay</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase">Banco / Plataforma</label>
                                        <input
                                            type="text"
                                            value={cuenta.banco || ''}
                                            onChange={(e) => {
                                                const next = [...form.datosBancarios];
                                                next[idx] = { ...next[idx], banco: e.target.value };
                                                setForm({ ...form, datosBancarios: next });
                                            }}
                                            className="w-full p-1.5 rounded border border-gray-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase">Titular</label>
                                        <input
                                            type="text"
                                            value={cuenta.titular || ''}
                                            onChange={(e) => {
                                                const next = [...form.datosBancarios];
                                                next[idx] = { ...next[idx], titular: e.target.value };
                                                setForm({ ...form, datosBancarios: next });
                                            }}
                                            className="w-full p-1.5 rounded border border-gray-300"
                                        />
                                    </div>
                                </div>
                                {cuenta.tipo === 'Binance Pay' ? (
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase">Binance ID</label>
                                        <input
                                            type="text"
                                            value={cuenta.id || ''}
                                            onChange={(e) => {
                                                const next = [...form.datosBancarios];
                                                next[idx] = { ...next[idx], id: e.target.value };
                                                setForm({ ...form, datosBancarios: next });
                                            }}
                                            className="w-full p-1.5 rounded border border-gray-300 font-mono"
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase">Teléfono</label>
                                            <input
                                                type="text"
                                                value={cuenta.telefono || ''}
                                                onChange={(e) => {
                                                    const next = [...form.datosBancarios];
                                                    next[idx] = { ...next[idx], telefono: e.target.value };
                                                    setForm({ ...form, datosBancarios: next });
                                                }}
                                                className="w-full p-1.5 rounded border border-gray-300 font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase">Cédula</label>
                                            <input
                                                type="text"
                                                value={cuenta.cedula || ''}
                                                onChange={(e) => {
                                                    const next = [...form.datosBancarios];
                                                    next[idx] = { ...next[idx], cedula: e.target.value };
                                                    setForm({ ...form, datosBancarios: next });
                                                }}
                                                className="w-full p-1.5 rounded border border-gray-300 font-mono"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() =>
                                setForm({
                                    ...form,
                                    datosBancarios: [
                                        ...(form.datosBancarios || []),
                                        { banco: 'Banesco', tipo: 'Pago Móvil', titular: '', telefono: '', cedula: '' },
                                    ],
                                })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                        >
                            <Plus size={12} /> Añadir Cuenta Bancaria
                        </button>
                    </div>
                </section>

                {/* 8. Padres y Padrinos */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">8. Padres y Padrinos</h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <span className="text-[11px] font-bold text-gray-600 uppercase">
                                    Padres de {form?.novios?.novia?.nombre || 'la Novia'}
                                </span>
                                <input
                                    type="text"
                                    placeholder="Padre"
                                    value={form?.padres?.novia?.padre || ''}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            padres: {
                                                ...form.padres,
                                                novia: { ...form.padres?.novia, padre: e.target.value },
                                            },
                                        })
                                    }
                                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                />
                                <input
                                    type="text"
                                    placeholder="Madre"
                                    value={form?.padres?.novia?.madre || ''}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            padres: {
                                                ...form.padres,
                                                novia: { ...form.padres?.novia, madre: e.target.value },
                                            },
                                        })
                                    }
                                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <span className="text-[11px] font-bold text-gray-600 uppercase">
                                    Padres de {form?.novios?.novio?.nombre || 'el Novio'}
                                </span>
                                <input
                                    type="text"
                                    placeholder="Padre"
                                    value={form?.padres?.novio?.padre || ''}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            padres: {
                                                ...form.padres,
                                                novio: { ...form.padres?.novio, padre: e.target.value },
                                            },
                                        })
                                    }
                                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                />
                                <input
                                    type="text"
                                    placeholder="Madre"
                                    value={form?.padres?.novio?.madre || ''}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            padres: {
                                                ...form.padres,
                                                novio: { ...form.padres?.novio, madre: e.target.value },
                                            },
                                        })
                                    }
                                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                />
                            </div>
                        </div>

                        <div className="pt-3 border-t border-gray-200 space-y-2">
                            <span className="text-[11px] font-bold text-gray-600 uppercase block">Padrinos</span>
                            {(form?.padrinos || []).map((p, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nombre"
                                        value={p.nombre || ''}
                                        onChange={(e) => {
                                            const next = [...form.padrinos];
                                            next[idx] = { ...next[idx], nombre: e.target.value };
                                            setForm({ ...form, padrinos: next });
                                        }}
                                        className="flex-1 p-1.5 rounded border border-gray-300 bg-white"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Rol (Padrino / Madrina)"
                                        value={p.rol || ''}
                                        onChange={(e) => {
                                            const next = [...form.padrinos];
                                            next[idx] = { ...next[idx], rol: e.target.value };
                                            setForm({ ...form, padrinos: next });
                                        }}
                                        className="w-40 p-1.5 rounded border border-gray-300 bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setForm({ ...form, padrinos: form.padrinos.filter((_, i) => i !== idx) })
                                        }
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() =>
                                    setForm({
                                        ...form,
                                        padrinos: [...(form.padrinos || []), { nombre: '', rol: 'Padrino' }],
                                    })
                                }
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                            >
                                <Plus size={12} /> Añadir Padrino / Madrina
                            </button>
                        </div>
                    </div>
                </section>

                {/* 9. Textos de la tarjeta */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">9. Textos y Mensajes de la Invitación</h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Badge del Hero</label>
                            <input
                                type="text"
                                value={form?.textos?.hero?.badge || ''}
                                onChange={(e) => updateText('hero', 'badge', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Día de la semana (Save the Date)</label>
                            <input
                                type="text"
                                value={form?.textos?.saveTheDate?.diaSemana || ''}
                                onChange={(e) => updateText('saveTheDate', 'diaSemana', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] text-gray-500 uppercase">Mensaje de Confirmación (RSVP)</label>
                            <input
                                type="text"
                                value={form?.textos?.rsvp?.subtitulo || ''}
                                onChange={(e) => updateText('rsvp', 'subtitulo', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] text-gray-500 uppercase">Subtítulo Mesa de Regalos</label>
                            <input
                                type="text"
                                value={form?.textos?.regalos?.subtitulo || ''}
                                onChange={(e) => updateText('regalos', 'subtitulo', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Frase de los novios</label>
                            <input
                                type="text"
                                value={form?.textos?.quote?.texto || ''}
                                onChange={(e) => updateText('quote', 'texto', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Firma</label>
                            <input
                                type="text"
                                value={form?.textos?.quote?.firma || ''}
                                onChange={(e) => updateText('quote', 'firma', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] text-gray-500 uppercase">Versículo / Reflexión (Footer)</label>
                            <textarea
                                rows={2}
                                value={form?.textos?.footer?.versiculo || ''}
                                onChange={(e) => updateText('footer', 'versiculo', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Referencia del versículo</label>
                            <input
                                type="text"
                                value={form?.textos?.footer?.referencia || ''}
                                onChange={(e) => updateText('footer', 'referencia', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                    </div>
                </section>

                <div className="pt-2 sticky bottom-3 flex justify-end">
                    <button
                        type="submit"
                        disabled={saveStatus.loading}
                        className="px-6 py-2.5 bg-primary hover:bg-secondary text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                        <Save size={15} />
                        {saveStatus.loading ? 'Guardando en Supabase...' : 'Guardar Configuración'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ConfigTab;
