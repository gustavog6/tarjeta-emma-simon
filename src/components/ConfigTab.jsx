import React, { useState, useEffect } from 'react';
import {
    RefreshCw, Save, Trash2, Plus, AlertTriangle,
    ChevronDown, ChevronRight, Sparkles
} from 'lucide-react';
import { useEventConfig } from '../context/EventConfigContext';
import { ICON_NAMES, ICON_MAP } from '../utils/iconRegistry';
import {
    toDateTimeLocal,
    fromDateTimeLocal,
    toDateInput,
    fromDateInputEndOfDay,
} from '../utils/dateUtils';
import { generateUniqueId, getCanonicalId } from '../utils/menuUtils';
import { COLOR_OPTIONS, GROUP_COLORS, GROUP_ICON_OPTIONS } from '../utils/groupUtils';
import { EVENT_LIMITS } from '../config/eventLimits';
import { EVENT_TYPES, EVENT_TYPE_PRESETS, formatHostsNames } from '../config/eventPresets';

const LOCATION_TYPES = [
    { value: 'main_venue', label: 'Sede Principal (Presencial)' },
    { value: 'reception', label: 'Recepción / Salón (Presencial)' },
    { value: 'livestream', label: 'Transmisión en vivo (Enlace)' },
    { value: 'videocall', label: 'Videollamada (Enlace)' },
];

const DRESS_CODE_SUGGESTIONS = [
    'Elegante / Casual',
    'Formal',
    'Gala',
    'Ejecutivo / Cóctel',
    'Semi-formal',
    'Informal',
];

const SECTION_KEYS = [
    'hosts',
    'groups',
    'dates',
    'menu',
    'locations',
    'schedule',
    'dressCode',
    'accounts',
    'mentions',
    'copy',
];

const isVirtualLocation = (type) => type === 'livestream' || type === 'videocall';

const CollapsibleSection = ({ title, subtitle, isOpen, onToggle, children }) => (
    <section className="rounded-xl border border-gray-200 bg-gray-50/70 overflow-hidden">
        <button
            type="button"
            onClick={onToggle}
            className="w-full px-4 py-3 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between gap-3 text-left cursor-pointer border-b border-gray-100"
        >
            <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-primary shrink-0">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                <div className="min-w-0">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{title}</h3>
                    {subtitle && (
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase shrink-0">
                {isOpen ? 'Ocultar' : 'Editar'}
            </span>
        </button>
        {isOpen && <div className="p-4">{children}</div>}
    </section>
);

const ConfigTab = ({ attendees = [], guests = [] }) => {
    const { config, saveConfig, reloadConfig } = useEventConfig();
    const [form, setForm] = useState(config);
    const [saveStatus, setSaveStatus] = useState({ loading: false, msg: null, error: false });
    const [openSections, setOpenSections] = useState(() => ({
        hosts: true,
        groups: true,
        dates: false,
        menu: false,
        locations: false,
        schedule: false,
        dressCode: false,
        accounts: false,
        mentions: false,
        copy: false,
    }));

    useEffect(() => {
        setForm(config);
    }, [config]);

    const toggleSection = (key) => {
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const setAllSections = (open) => {
        const next = {};
        SECTION_KEYS.forEach((k) => { next[k] = open; });
        setOpenSections(next);
    };

    const groupsInUse = new Set(guests.map((g) => g.group_id).filter(Boolean));
    const mainCoursesInUse = new Set(
        attendees
            .map((a) => getCanonicalId(config?.menu?.mainCourses || [], a.main_course_id))
            .filter(Boolean)
    );
    const sidesInUse = new Set(
        attendees
            .flatMap((a) => (a.side_ids || []).map((id) => getCanonicalId(config?.menu?.sides || [], id)))
            .filter(Boolean)
    );

    const handleApplyPreset = () => {
        const preset = EVENT_TYPE_PRESETS[form?.eventType];
        if (!preset) {
            alert('Selecciona un tipo de evento con textos sugeridos.');
            return;
        }
        const ok = window.confirm(
            '¿Aplicar los textos y plantillas sugeridas para este tipo de evento?\n\nPodrás revisarlos y personalizarlos antes de guardar.'
        );
        if (!ok) return;

        setForm((prev) => ({
            ...prev,
            whatsappTemplate: preset.whatsappTemplate,
            featuredGroups: {
                ...prev.featuredGroups,
                sectionTitle: preset.mentionsSectionTitle,
                groupA: { ...prev.featuredGroups?.groupA, label: preset.groupALabel },
                groupB: { ...prev.featuredGroups?.groupB, label: preset.groupBLabel },
            },
            specialMentions: {
                ...prev.specialMentions,
                title: preset.specialMentionsTitle,
            },
            copy: {
                ...prev.copy,
                hero: { ...prev.copy?.hero, badge: preset.heroBadge },
                rsvp: {
                    ...prev.copy?.rsvp,
                    groupPrompt: preset.rsvpGroupPrompt,
                    whatsappIntro: preset.rsvpWhatsappIntro,
                },
                contributions: {
                    ...prev.copy?.contributions,
                    title: preset.contributionsTitle,
                    subtitle: preset.contributionsSubtitle,
                },
                sharing: {
                    ...prev.copy?.sharing,
                    calendarTitleTemplate: preset.calendarTitleTemplate,
                    calendarDescriptionTemplate: preset.calendarDescriptionTemplate,
                    storyBadge: preset.storyBadge,
                    storyFooter: preset.storyFooter,
                },
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaveStatus({ loading: true, msg: null, error: false });

        const cleaned = {
            ...form,
            publicUrl: (form.publicUrl || '').trim().replace(/\/+$/, ''),
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

    const removeMainCourse = (idx) => {
        const course = form.menu.mainCourses[idx];
        if ((form.menu.mainCourses || []).length <= 1) {
            alert('Debe existir al menos 1 plato fuerte.');
            return;
        }
        if (mainCoursesInUse.has(course.id)) {
            const ok = window.confirm(
                `Atención: "${course.name}" ya fue elegido por al menos un asistente confirmado.\n\nSi lo eliminas, en los reportes aparecerá como "(retirado del menú)". ¿Deseas continuar?`
            );
            if (!ok) return;
        }
        const next = form.menu.mainCourses.filter((_, i) => i !== idx);
        setForm({ ...form, menu: { ...form.menu, mainCourses: next } });
    };

    const removeSide = (idx) => {
        const side = form.menu.sides[idx];
        if (sidesInUse.has(side.id)) {
            const ok = window.confirm(
                `Atención: "${side.name}" ya fue elegido por al menos un asistente confirmado.\n\nSi lo eliminas, en los reportes aparecerá como "(retirado del menú)". ¿Deseas continuar?`
            );
            if (!ok) return;
        }
        const next = form.menu.sides.filter((_, i) => i !== idx);
        setForm({ ...form, menu: { ...form.menu, sides: next } });
    };

    const removeGroup = (idx) => {
        const g = (form.groups || [])[idx];
        if ((form.groups || []).length <= 1) {
            alert('Debe existir al menos un grupo de invitados.');
            return;
        }
        if (groupsInUse.has(g.id)) {
            alert(`No puedes eliminar "${g.name}" mientras tenga invitados asignados. Reasigna primero a esos invitados.`);
            return;
        }
        setForm({ ...form, groups: form.groups.filter((_, i) => i !== idx) });
    };

    const updateCopy = (section, key, value) => {
        setForm({
            ...form,
            copy: {
                ...(form.copy || {}),
                [section]: {
                    ...(form.copy?.[section] || {}),
                    [key]: value,
                },
            },
        });
    };

    return (
        <div className="w-full bg-white rounded-xl border border-gray-200 shadow-xs p-5 space-y-5">
            <div className="border-b border-gray-100 pb-3 flex flex-wrap justify-between items-center gap-3">
                <div>
                    <h2 className="text-base font-bold text-gray-900">Configuración Global del Evento</h2>
                    <p className="text-xs text-gray-500">
                        Todo lo que guardes aquí se almacena en <code>event_settings</code> y tablas relacionales en Supabase.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setAllSections(true)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"
                    >
                        Expandir todo
                    </button>
                    <button
                        type="button"
                        onClick={() => setAllSections(false)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"
                    >
                        Colapsar todo
                    </button>
                    <button
                        type="button"
                        onClick={reloadConfig}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 cursor-pointer"
                    >
                        <RefreshCw size={13} /> Recargar desde BD
                    </button>
                </div>
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

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                {/* 1. Event Type & Hosts */}
                <CollapsibleSection
                    title="1. Tipo de Evento y Anfitriones"
                    subtitle={formatHostsNames(form?.hosts)}
                    isOpen={openSections.hosts}
                    onToggle={() => toggleSection('hosts')}
                >
                    <div className="space-y-4">
                        <div className="bg-white p-3.5 rounded-lg border border-gray-200 flex flex-wrap items-end justify-between gap-3">
                            <div className="flex-1 min-w-[220px]">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                    Tipo de Evento / Tono
                                </label>
                                <select
                                    value={form?.eventType || 'wedding'}
                                    onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                >
                                    {EVENT_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            {form?.eventType !== 'custom' && (
                                <button
                                    type="button"
                                    onClick={handleApplyPreset}
                                    className="px-3.5 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Sparkles size={14} />
                                    Aplicar textos sugeridos del tono
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { key: 'primary', label: 'Anfitrión Principal / Organizador *', required: true },
                                { key: 'secondary', label: 'Co-anfitrión (opcional — déjalo vacío si es 1 solo anfitrión)', required: false },
                            ].map(({ key, label, required }) => (
                                <div key={key} className="space-y-2 bg-white p-3.5 rounded-lg border border-gray-200">
                                    <span className="text-[11px] font-bold text-gray-600 uppercase">{label}</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase">
                                                Nombre {required ? '*' : ''}
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={EVENT_LIMITS.hosts.firstNameMax}
                                                value={form?.hosts?.[key]?.firstName || ''}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        hosts: {
                                                            ...form.hosts,
                                                            [key]: { ...form.hosts?.[key], firstName: e.target.value },
                                                        },
                                                    })
                                                }
                                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                                required={required}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase">Apellido</label>
                                            <input
                                                type="text"
                                                maxLength={EVENT_LIMITS.hosts.lastNameMax}
                                                value={form?.hosts?.[key]?.lastName || ''}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        hosts: {
                                                            ...form.hosts,
                                                            [key]: { ...form.hosts?.[key], lastName: e.target.value },
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
                                            maxLength={EVENT_LIMITS.rsvp.phoneMax}
                                            value={form?.hosts?.[key]?.phone || ''}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    hosts: {
                                                        ...form.hosts,
                                                        [key]: { ...form.hosts?.[key], phone: e.target.value },
                                                    },
                                                })
                                            }
                                            className="w-full p-2 rounded-lg border border-gray-300 bg-white font-mono"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CollapsibleSection>

                {/* 2. Guest Groups */}
                <CollapsibleSection
                    title="2. Grupos / Familias / Categorías de Invitados"
                    subtitle={`${(form?.groups || []).length} grupo(s) configurado(s)`}
                    isOpen={openSections.groups}
                    onToggle={() => toggleSection('groups')}
                >
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                                Pregunta en el Paso 1 del RSVP (cuando hay más de 1 grupo)
                            </label>
                            <input
                                type="text"
                                maxLength={EVENT_LIMITS.rsvp.groupPromptMax}
                                value={form?.copy?.rsvp?.groupPrompt || ''}
                                onChange={(e) => updateCopy('rsvp', 'groupPrompt', e.target.value)}
                                placeholder="Ej: ¿De parte de quién nos acompañas?"
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            {(form?.groups || []).map((g, idx) => {
                                const inUse = groupsInUse.has(g.id);
                                const badgeCls = GROUP_COLORS[g.color]?.badge || GROUP_COLORS.gray.badge;
                                return (
                                    <div key={g.id || idx} className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${badgeCls}`}>
                                            {g.name || 'Vista'}
                                        </span>
                                        <input
                                            type="text"
                                            maxLength={EVENT_LIMITS.groups.nameMax}
                                            value={g.name || ''}
                                            onChange={(e) => {
                                                const next = [...form.groups];
                                                next[idx] = { ...next[idx], name: e.target.value };
                                                setForm({ ...form, groups: next });
                                            }}
                                            placeholder="Nombre del grupo o familia"
                                            className="flex-1 min-w-[140px] p-1.5 rounded border border-gray-300"
                                            required
                                        />
                                        <select
                                            value={g.color || 'gray'}
                                            onChange={(e) => {
                                                const next = [...form.groups];
                                                next[idx] = { ...next[idx], color: e.target.value };
                                                setForm({ ...form, groups: next });
                                            }}
                                            className="w-24 p-1.5 rounded border border-gray-300 bg-white"
                                        >
                                            {COLOR_OPTIONS.map((c) => (
                                                <option key={c.value} value={c.value}>{c.label}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={g.iconKey || 'Users'}
                                            onChange={(e) => {
                                                const next = [...form.groups];
                                                next[idx] = { ...next[idx], iconKey: e.target.value };
                                                setForm({ ...form, groups: next });
                                            }}
                                            className="w-36 p-1.5 rounded border border-gray-300 bg-white"
                                        >
                                            {GROUP_ICON_OPTIONS.map((ic) => (
                                                <option key={ic.value} value={ic.value}>{ic.label}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            maxLength={EVENT_LIMITS.rsvp.phoneMax}
                                            value={g.contactPhone || ''}
                                            onChange={(e) => {
                                                const next = [...form.groups];
                                                next[idx] = { ...next[idx], contactPhone: e.target.value };
                                                setForm({ ...form, groups: next });
                                            }}
                                            placeholder="WhatsApp (opcional)"
                                            className="w-36 p-1.5 rounded border border-gray-300 font-mono text-[11px]"
                                        />
                                        {inUse && (
                                            <span
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold shrink-0"
                                                title="Hay invitados asignados a este grupo"
                                            >
                                                <AlertTriangle size={11} /> En uso
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeGroup(idx)}
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
                                disabled={(form?.groups || []).length >= EVENT_LIMITS.groups.max}
                                onClick={() => {
                                    const list = form?.groups || [];
                                    if (list.length >= EVENT_LIMITS.groups.max) return;
                                    const name = 'Nuevo Grupo';
                                    const id = generateUniqueId(name, list);
                                    setForm({
                                        ...form,
                                        groups: [...list, { id, name, color: 'green', iconKey: 'Users', contactPhone: '' }],
                                    });
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer pt-1 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Plus size={12} /> Añadir Grupo ({(form?.groups || []).length}/{EVENT_LIMITS.groups.max})
                            </button>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* 3. Dates, Public URL & Sharing Templates */}
                <CollapsibleSection
                    title="3. Fechas, URL Pública, WhatsApp, Calendario y Banner"
                    subtitle={form?.publicUrl || 'Fechas y plantillas dinámicas'}
                    isOpen={openSections.dates}
                    onToggle={() => toggleSection('dates')}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                                    Fecha y hora del evento
                                </label>
                                <input
                                    type="datetime-local"
                                    value={toDateTimeLocal(form?.eventDate)}
                                    onChange={(e) =>
                                        setForm({ ...form, eventDate: fromDateTimeLocal(e.target.value) })
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
                                    value={toDateInput(form?.rsvpDeadline)}
                                    onChange={(e) =>
                                        setForm({ ...form, rsvpDeadline: fromDateInputEndOfDay(e.target.value) })
                                    }
                                    className="w-full p-2 rounded-lg border border-gray-300 bg-white font-mono"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                                    URL pública de la invitación
                                </label>
                                <input
                                    type="url"
                                    maxLength={200}
                                    value={form?.publicUrl || ''}
                                    onChange={(e) => setForm({ ...form, publicUrl: e.target.value })}
                                    placeholder="https://tu-invitacion.netlify.app"
                                    className="w-full p-2 rounded-lg border border-gray-300 bg-white font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                                Plantilla de invitación por WhatsApp (enviada desde el panel)
                            </label>
                            <textarea
                                rows={3}
                                maxLength={600}
                                value={form?.whatsappTemplate || ''}
                                onChange={(e) => setForm({ ...form, whatsappTemplate: e.target.value })}
                                className="w-full p-2.5 rounded-lg border border-gray-300 bg-white leading-relaxed"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">
                                Variables: <code>{'{guest_name}'}</code>, <code>{'{passes}'}</code>,{' '}
                                <code>{'{rsvp_deadline}'}</code>, <code>{'{hosts}'}</code>, <code>{'{link}'}</code>
                            </p>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                                Encabezado de confirmación por WhatsApp (enviado por el invitado al confirmar)
                            </label>
                            <input
                                type="text"
                                maxLength={EVENT_LIMITS.rsvp.whatsappIntroMax}
                                value={form?.copy?.rsvp?.whatsappIntro || ''}
                                onChange={(e) => updateCopy('rsvp', 'whatsappIntro', e.target.value)}
                                placeholder="¡Hola! Confirmo asistencia a la boda de {hosts} 💍"
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                    Título en Calendario (.ics) — soporta {'{hosts}'}
                                </label>
                                <input
                                    type="text"
                                    maxLength={EVENT_LIMITS.sharing.calendarTitleMax}
                                    value={form?.copy?.sharing?.calendarTitleTemplate || ''}
                                    onChange={(e) => updateCopy('sharing', 'calendarTitleTemplate', e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                    Descripción en Calendario (.ics) — soporta {'{venue}'}
                                </label>
                                <input
                                    type="text"
                                    maxLength={EVENT_LIMITS.sharing.calendarDescMax}
                                    value={form?.copy?.sharing?.calendarDescriptionTemplate || ''}
                                    onChange={(e) => updateCopy('sharing', 'calendarDescriptionTemplate', e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                    Encabezado del Banner 9:16 (Historias)
                                </label>
                                <input
                                    type="text"
                                    maxLength={EVENT_LIMITS.sharing.storyBadgeMax}
                                    value={form?.copy?.sharing?.storyBadge || ''}
                                    onChange={(e) => updateCopy('sharing', 'storyBadge', e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                    Frase inferior del Banner 9:16 (Historias)
                                </label>
                                <input
                                    type="text"
                                    maxLength={EVENT_LIMITS.sharing.storyFooterMax}
                                    value={form?.copy?.sharing?.storyFooter || ''}
                                    onChange={(e) => updateCopy('sharing', 'storyFooter', e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                />
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* 4. Menu */}
                <CollapsibleSection
                    title="4. Menú Gastronómico"
                    subtitle={`${(form?.menu?.mainCourses || []).length} platos fuertes · ${(form?.menu?.sides || []).length} contornos (mín. 1, máx. ${form?.menu?.maxSides ?? 2})`}
                    isOpen={openSections.menu}
                    onToggle={() => toggleSection('menu')}
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <label className="text-[11px] font-bold text-gray-700 uppercase">
                                Máximo de contornos por persona (0 = sin contornos):
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="6"
                                value={form?.menu?.maxSides ?? 2}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        menu: {
                                            ...form.menu,
                                            maxSides: Math.max(0, Math.min(6, parseInt(e.target.value, 10) || 0)),
                                        },
                                    })
                                }
                                className="w-20 p-1.5 rounded border border-gray-300 bg-white font-bold text-center"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-white p-3.5 rounded-lg border border-gray-200">
                                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-2">
                                    Platos Fuertes
                                </label>
                                <div className="space-y-1.5">
                                    {(form?.menu?.mainCourses || []).map((course, idx) => {
                                        const inUse = mainCoursesInUse.has(course.id);
                                        return (
                                            <div key={course.id || idx} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    maxLength={EVENT_LIMITS.menu.mainCourseNameMax}
                                                    value={course.name}
                                                    onChange={(e) => {
                                                        const next = [...form.menu.mainCourses];
                                                        next[idx] = { ...next[idx], name: e.target.value };
                                                        setForm({ ...form, menu: { ...form.menu, mainCourses: next } });
                                                    }}
                                                    className="flex-1 p-1.5 rounded border border-gray-300 bg-white"
                                                    required
                                                />
                                                {inUse && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                                                        <AlertTriangle size={11} /> En uso
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeMainCourse(idx)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        disabled={(form?.menu?.mainCourses || []).length >= EVENT_LIMITS.menu.mainCoursesMax}
                                        onClick={() => {
                                            const list = form?.menu?.mainCourses || [];
                                            if (list.length >= EVENT_LIMITS.menu.mainCoursesMax) return;
                                            const name = 'Nuevo Plato';
                                            const id = generateUniqueId(name, list);
                                            setForm({
                                                ...form,
                                                menu: { ...form.menu, mainCourses: [...list, { id, name }] },
                                            });
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer pt-1 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Plus size={12} /> Añadir Plato Fuerte ({(form?.menu?.mainCourses || []).length}/{EVENT_LIMITS.menu.mainCoursesMax})
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white p-3.5 rounded-lg border border-gray-200">
                                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-2">
                                    Contornos / Guarniciones
                                </label>
                                <div className="space-y-1.5">
                                    {(form?.menu?.sides || []).map((side, idx) => {
                                        const inUse = sidesInUse.has(side.id);
                                        return (
                                            <div key={side.id || idx} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    maxLength={EVENT_LIMITS.menu.sideNameMax}
                                                    value={side.name}
                                                    onChange={(e) => {
                                                        const next = [...form.menu.sides];
                                                        next[idx] = { ...next[idx], name: e.target.value };
                                                        setForm({ ...form, menu: { ...form.menu, sides: next } });
                                                    }}
                                                    className="flex-1 p-1.5 rounded border border-gray-300 bg-white"
                                                    required
                                                />
                                                {inUse && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                                                        <AlertTriangle size={11} /> En uso
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSide(idx)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        disabled={(form?.menu?.sides || []).length >= EVENT_LIMITS.menu.sidesMax}
                                        onClick={() => {
                                            const list = form?.menu?.sides || [];
                                            if (list.length >= EVENT_LIMITS.menu.sidesMax) return;
                                            const name = 'Nuevo Contorno';
                                            const id = generateUniqueId(name, list);
                                            setForm({
                                                ...form,
                                                menu: { ...form.menu, sides: [...list, { id, name }] },
                                            });
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer pt-1 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Plus size={12} /> Añadir Contorno ({(form?.menu?.sides || []).length}/{EVENT_LIMITS.menu.sidesMax})
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* 5. Locations & Virtual Access */}
                <CollapsibleSection
                    title="5. Ubicaciones y Accesos Virtuales"
                    subtitle={`${(form?.locations || []).length} ubicación(es) configurada(s)`}
                    isOpen={openSections.locations}
                    onToggle={() => toggleSection('locations')}
                >
                    <div className="space-y-3">
                        {(form?.locations || []).map((loc, idx) => {
                            const virtual = isVirtualLocation(loc.locationType);
                            return (
                                <div key={loc.id || idx} className="bg-white p-3.5 rounded-lg border border-gray-200 space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-700">
                                            Ubicación #{idx + 1}{' '}
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-500 ml-1">
                                                {virtual ? 'Virtual / Enlace' : 'Presencial / Mapa'}
                                            </span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if ((form.locations || []).length <= 1) {
                                                    alert('Debe existir al menos 1 ubicación o enlace.');
                                                    return;
                                                }
                                                setForm({ ...form, locations: form.locations.filter((_, i) => i !== idx) });
                                            }}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase">Tipo</label>
                                            <select
                                                value={loc.locationType || 'main_venue'}
                                                onChange={(e) => {
                                                    const next = [...form.locations];
                                                    next[idx] = { ...next[idx], locationType: e.target.value };
                                                    setForm({ ...form, locations: next });
                                                }}
                                                className="w-full p-1.5 rounded border border-gray-300 bg-white"
                                            >
                                                {LOCATION_TYPES.map((t) => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase">Título *</label>
                                            <input
                                                type="text"
                                                maxLength={EVENT_LIMITS.locations.titleMax}
                                                value={loc.title || ''}
                                                onChange={(e) => {
                                                    const next = [...form.locations];
                                                    next[idx] = { ...next[idx], title: e.target.value };
                                                    setForm({ ...form, locations: next });
                                                }}
                                                placeholder={virtual ? 'Ej: Transmisión en Vivo' : 'Ej: Recepción Principal'}
                                                className="w-full p-1.5 rounded border border-gray-300"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase">Hora</label>
                                            <input
                                                type="text"
                                                maxLength={EVENT_LIMITS.locations.timeMax}
                                                value={loc.timeLabel || ''}
                                                onChange={(e) => {
                                                    const next = [...form.locations];
                                                    next[idx] = { ...next[idx], timeLabel: e.target.value };
                                                    setForm({ ...form, locations: next });
                                                }}
                                                placeholder="11:30 AM"
                                                className="w-full p-1.5 rounded border border-gray-300"
                                            />
                                        </div>
                                    </div>

                                    {virtual ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase">
                                                    Plataforma (Zoom, YouTube, Meet…)
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength={EVENT_LIMITS.locations.venueMax}
                                                    value={loc.platform ?? loc.venueName ?? ''}
                                                    onChange={(e) => {
                                                        const next = [...form.locations];
                                                        next[idx] = { ...next[idx], platform: e.target.value, venueName: e.target.value };
                                                        setForm({ ...form, locations: next });
                                                    }}
                                                    placeholder="Ej: YouTube Live / Zoom"
                                                    className="w-full p-1.5 rounded border border-gray-300"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase">
                                                    Enlace de acceso / transmisión
                                                </label>
                                                <input
                                                    type="url"
                                                    value={loc.streamUrl ?? loc.externalLink ?? ''}
                                                    onChange={(e) => {
                                                        const next = [...form.locations];
                                                        next[idx] = { ...next[idx], streamUrl: e.target.value, externalLink: e.target.value };
                                                        setForm({ ...form, locations: next });
                                                    }}
                                                    placeholder="https://..."
                                                    className="w-full p-1.5 rounded border border-gray-300 font-mono text-[11px]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500 uppercase">
                                                    ID / Código de acceso (opcional)
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength={EVENT_LIMITS.locations.addressMax}
                                                    value={loc.accessCode || ''}
                                                    onChange={(e) => {
                                                        const next = [...form.locations];
                                                        next[idx] = { ...next[idx], accessCode: e.target.value };
                                                        setForm({ ...form, locations: next });
                                                    }}
                                                    placeholder="Ej: Código: EVENTO2026"
                                                    className="w-full p-1.5 rounded border border-gray-300"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 uppercase">Lugar</label>
                                                    <input
                                                        type="text"
                                                        maxLength={EVENT_LIMITS.locations.venueMax}
                                                        value={loc.venueName || ''}
                                                        onChange={(e) => {
                                                            const next = [...form.locations];
                                                            next[idx] = { ...next[idx], venueName: e.target.value };
                                                            setForm({ ...form, locations: next });
                                                        }}
                                                        className="w-full p-1.5 rounded border border-gray-300"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 uppercase">Dirección</label>
                                                    <input
                                                        type="text"
                                                        maxLength={EVENT_LIMITS.locations.addressMax}
                                                        value={loc.address || ''}
                                                        onChange={(e) => {
                                                            const next = [...form.locations];
                                                            next[idx] = { ...next[idx], address: e.target.value };
                                                            setForm({ ...form, locations: next });
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
                                                        value={loc.mapUrl || ''}
                                                        onChange={(e) => {
                                                            const next = [...form.locations];
                                                            next[idx] = { ...next[idx], mapUrl: e.target.value };
                                                            setForm({ ...form, locations: next });
                                                        }}
                                                        className="w-full p-1.5 rounded border border-gray-300 font-mono text-[11px]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 uppercase">Enlace externo Google Maps</label>
                                                    <input
                                                        type="url"
                                                        value={loc.externalLink || ''}
                                                        onChange={(e) => {
                                                            const next = [...form.locations];
                                                            next[idx] = { ...next[idx], externalLink: e.target.value };
                                                            setForm({ ...form, locations: next });
                                                        }}
                                                        className="w-full p-1.5 rounded border border-gray-300 font-mono text-[11px]"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                        <button
                            type="button"
                            disabled={(form?.locations || []).length >= EVENT_LIMITS.locations.max}
                            onClick={() => {
                                if ((form?.locations || []).length >= EVENT_LIMITS.locations.max) return;
                                setForm({
                                    ...form,
                                    locations: [
                                        ...(form.locations || []),
                                        {
                                            id: `loc-${Date.now()}`,
                                            locationType: 'reception',
                                            title: 'Recepción',
                                            venueName: '',
                                            address: '',
                                            timeLabel: '',
                                            mapUrl: '',
                                            externalLink: '',
                                        },
                                    ],
                                });
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus size={12} /> Añadir Ubicación / Acceso ({(form?.locations || []).length}/{EVENT_LIMITS.locations.max})
                        </button>
                    </div>
                </CollapsibleSection>

                {/* 6. Schedule */}
                <CollapsibleSection
                    title="6. Itinerario / Agenda"
                    subtitle={`${(form?.schedule || []).length} momento(s) en el cronograma`}
                    isOpen={openSections.schedule}
                    onToggle={() => toggleSection('schedule')}
                >
                    <div className="space-y-2">
                        {(form?.schedule || []).map((item, idx) => {
                            const IconComp = ICON_MAP[item.iconName] || ICON_MAP.MapPin;
                            return (
                                <div key={item.id || idx} className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <IconComp size={15} />
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={EVENT_LIMITS.schedule.timeMax}
                                        value={item.timeLabel || ''}
                                        onChange={(e) => {
                                            const next = [...form.schedule];
                                            next[idx] = { ...next[idx], timeLabel: e.target.value };
                                            setForm({ ...form, schedule: next });
                                        }}
                                        placeholder="12:00 M"
                                        className="w-28 p-1.5 rounded border border-gray-300"
                                        required
                                    />
                                    <input
                                        type="text"
                                        maxLength={EVENT_LIMITS.schedule.titleMax}
                                        value={item.title || ''}
                                        onChange={(e) => {
                                            const next = [...form.schedule];
                                            next[idx] = { ...next[idx], title: e.target.value };
                                            setForm({ ...form, schedule: next });
                                        }}
                                        placeholder="Actividad"
                                        className="flex-1 min-w-[160px] p-1.5 rounded border border-gray-300"
                                        required
                                    />
                                    <select
                                        value={item.iconName || 'MapPin'}
                                        onChange={(e) => {
                                            const next = [...form.schedule];
                                            next[idx] = { ...next[idx], iconName: e.target.value };
                                            setForm({ ...form, schedule: next });
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
                                            setForm({ ...form, schedule: form.schedule.filter((_, i) => i !== idx) })
                                        }
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            );
                        })}
                        <button
                            type="button"
                            disabled={(form?.schedule || []).length >= EVENT_LIMITS.schedule.max}
                            onClick={() => {
                                if ((form?.schedule || []).length >= EVENT_LIMITS.schedule.max) return;
                                setForm({
                                    ...form,
                                    schedule: [
                                        ...(form.schedule || []),
                                        { id: `sch-${Date.now()}`, timeLabel: '01:00 PM', title: 'Nueva Actividad', iconName: 'Sparkles' },
                                    ],
                                });
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer pt-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus size={12} /> Añadir Momento ({(form?.schedule || []).length}/{EVENT_LIMITS.schedule.max})
                        </button>
                    </div>
                </CollapsibleSection>

                {/* 7. Dress Code */}
                <CollapsibleSection
                    title="7. Código de Vestimenta"
                    subtitle={form?.dressCode?.label || 'Oculto (sin definir)'}
                    isOpen={openSections.dressCode}
                    onToggle={() => toggleSection('dressCode')}
                >
                    <div className="space-y-2">
                        <input
                            type="text"
                            maxLength={EVENT_LIMITS.dressCode.labelMax}
                            list="dress-code-suggestions"
                            value={form?.dressCode?.label || ''}
                            onChange={(e) =>
                                setForm({ ...form, dressCode: { ...form.dressCode, label: e.target.value } })
                            }
                            placeholder="Ej: Elegante / Casual (déjalo vacío para ocultar la tarjeta)"
                            className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                        />
                        <datalist id="dress-code-suggestions">
                            {DRESS_CODE_SUGGESTIONS.map((v) => (
                                <option key={v} value={v} />
                            ))}
                        </datalist>
                    </div>
                </CollapsibleSection>

                {/* 8. Payment / Gift Accounts */}
                <CollapsibleSection
                    title="8. Aportes, Regalos o Cuentas Bancarias"
                    subtitle={`${(form?.paymentAccounts || []).length} cuenta(s) configurada(s)`}
                    isOpen={openSections.accounts}
                    onToggle={() => toggleSection('accounts')}
                >
                    <div className="space-y-3">
                        {(form?.paymentAccounts || []).map((acc, idx) => (
                            <div key={acc.id || idx} className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-700">Cuenta #{idx + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setForm({
                                                ...form,
                                                paymentAccounts: form.paymentAccounts.filter((_, i) => i !== idx),
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
                                            value={acc.methodType || 'Pago Móvil'}
                                            onChange={(e) => {
                                                const next = [...form.paymentAccounts];
                                                next[idx] = { ...next[idx], methodType: e.target.value };
                                                setForm({ ...form, paymentAccounts: next });
                                            }}
                                            className="w-full p-1.5 rounded border border-gray-300 bg-white"
                                        >
                                            <option value="Pago Móvil">Pago Móvil</option>
                                            <option value="Binance Pay">Binance Pay</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase">Banco / Plataforma *</label>
                                        <input
                                            type="text"
                                            maxLength={EVENT_LIMITS.paymentAccounts.institutionMax}
                                            value={acc.institution || ''}
                                            onChange={(e) => {
                                                const next = [...form.paymentAccounts];
                                                next[idx] = { ...next[idx], institution: e.target.value };
                                                setForm({ ...form, paymentAccounts: next });
                                            }}
                                            className="w-full p-1.5 rounded border border-gray-300"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase">Titular *</label>
                                        <input
                                            type="text"
                                            maxLength={EVENT_LIMITS.paymentAccounts.holderMax}
                                            value={acc.accountHolder || ''}
                                            onChange={(e) => {
                                                const next = [...form.paymentAccounts];
                                                next[idx] = { ...next[idx], accountHolder: e.target.value };
                                                setForm({ ...form, paymentAccounts: next });
                                            }}
                                            className="w-full p-1.5 rounded border border-gray-300"
                                            required
                                        />
                                    </div>
                                </div>
                                {acc.methodType === 'Binance Pay' ? (
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase">Binance ID</label>
                                        <input
                                            type="text"
                                            maxLength={EVENT_LIMITS.paymentAccounts.fieldMax}
                                            value={acc.externalAccountId || ''}
                                            onChange={(e) => {
                                                const next = [...form.paymentAccounts];
                                                next[idx] = { ...next[idx], externalAccountId: e.target.value };
                                                setForm({ ...form, paymentAccounts: next });
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
                                                maxLength={EVENT_LIMITS.paymentAccounts.fieldMax}
                                                value={acc.phone || ''}
                                                onChange={(e) => {
                                                    const next = [...form.paymentAccounts];
                                                    next[idx] = { ...next[idx], phone: e.target.value };
                                                    setForm({ ...form, paymentAccounts: next });
                                                }}
                                                className="w-full p-1.5 rounded border border-gray-300 font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase">Documento / Cédula</label>
                                            <input
                                                type="text"
                                                maxLength={EVENT_LIMITS.paymentAccounts.fieldMax}
                                                value={acc.documentId || ''}
                                                onChange={(e) => {
                                                    const next = [...form.paymentAccounts];
                                                    next[idx] = { ...next[idx], documentId: e.target.value };
                                                    setForm({ ...form, paymentAccounts: next });
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
                            disabled={(form?.paymentAccounts || []).length >= EVENT_LIMITS.paymentAccounts.max}
                            onClick={() => {
                                if ((form?.paymentAccounts || []).length >= EVENT_LIMITS.paymentAccounts.max) return;
                                setForm({
                                    ...form,
                                    paymentAccounts: [
                                        ...(form.paymentAccounts || []),
                                        {
                                            id: `acc-${Date.now()}`,
                                            institution: 'Banesco',
                                            methodType: 'Pago Móvil',
                                            accountHolder: '',
                                            phone: '',
                                            documentId: '',
                                        },
                                    ],
                                });
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus size={12} /> Añadir Cuenta ({(form?.paymentAccounts || []).length}/{EVENT_LIMITS.paymentAccounts.max})
                        </button>
                    </div>
                </CollapsibleSection>

                {/* 9. Special Mentions & Featured Groups */}
                <CollapsibleSection
                    title="9. Menciones Especiales e Invitados de Honor"
                    subtitle={`${(form?.specialMentions?.items || []).length} mención(es) especial(es)`}
                    isOpen={openSections.mentions}
                    onToggle={() => toggleSection('mentions')}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                    Título de la sección
                                </label>
                                <input
                                    type="text"
                                    maxLength={EVENT_LIMITS.featuredGroups.sectionTitleMax}
                                    value={form?.featuredGroups?.sectionTitle || ''}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            featuredGroups: { ...form.featuredGroups, sectionTitle: e.target.value },
                                        })
                                    }
                                    placeholder="Ej: Con la bendición de / Organizado por"
                                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                    Título tarjeta inferior (Menciones / Padrinos / Comité)
                                </label>
                                <input
                                    type="text"
                                    maxLength={EVENT_LIMITS.specialMentions.sectionTitleMax}
                                    value={form?.specialMentions?.title || ''}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            specialMentions: { ...form.specialMentions, title: e.target.value },
                                        })
                                    }
                                    placeholder="Ej: Invitados de Honor / Nuestros Padrinos"
                                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { key: 'groupA', title: 'Tarjeta Destacada A (opcional)' },
                                { key: 'groupB', title: 'Tarjeta Destacada B (opcional)' },
                            ].map(({ key, title }) => (
                                <div key={key} className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                                    <span className="text-[11px] font-bold text-gray-600 uppercase">{title}</span>
                                    <input
                                        type="text"
                                        maxLength={EVENT_LIMITS.featuredGroups.labelMax}
                                        placeholder="Etiqueta (ej: Familia / Directiva)"
                                        value={form?.featuredGroups?.[key]?.label || ''}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                featuredGroups: {
                                                    ...form.featuredGroups,
                                                    [key]: { ...form.featuredGroups?.[key], label: e.target.value },
                                                },
                                            })
                                        }
                                        className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                    />
                                    <input
                                        type="text"
                                        maxLength={EVENT_LIMITS.featuredGroups.memberNameMax}
                                        placeholder="Persona / Entidad 1"
                                        value={form?.featuredGroups?.[key]?.member1 || ''}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                featuredGroups: {
                                                    ...form.featuredGroups,
                                                    [key]: { ...form.featuredGroups?.[key], member1: e.target.value },
                                                },
                                            })
                                        }
                                        className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                    />
                                    <input
                                        type="text"
                                        maxLength={EVENT_LIMITS.featuredGroups.memberNameMax}
                                        placeholder="Persona / Entidad 2"
                                        value={form?.featuredGroups?.[key]?.member2 || ''}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                featuredGroups: {
                                                    ...form.featuredGroups,
                                                    [key]: { ...form.featuredGroups?.[key], member2: e.target.value },
                                                },
                                            })
                                        }
                                        className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <span className="text-[11px] font-bold text-gray-600 uppercase block">
                                Lista de Menciones Especiales
                            </span>
                            {(form?.specialMentions?.items || []).map((m, idx) => (
                                <div key={m.id || idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        maxLength={EVENT_LIMITS.specialMentions.nameMax}
                                        placeholder="Nombre completo"
                                        value={m.name || ''}
                                        onChange={(e) => {
                                            const next = [...form.specialMentions.items];
                                            next[idx] = { ...next[idx], name: e.target.value };
                                            setForm({
                                                ...form,
                                                specialMentions: { ...form.specialMentions, items: next },
                                            });
                                        }}
                                        className="flex-1 p-1.5 rounded border border-gray-300 bg-white"
                                        required
                                    />
                                    <input
                                        type="text"
                                        maxLength={EVENT_LIMITS.specialMentions.roleMax}
                                        placeholder="Rol (Padrino, Ponente, Honor…)"
                                        value={m.role || ''}
                                        onChange={(e) => {
                                            const next = [...form.specialMentions.items];
                                            next[idx] = { ...next[idx], role: e.target.value };
                                            setForm({
                                                ...form,
                                                specialMentions: { ...form.specialMentions, items: next },
                                            });
                                        }}
                                        className="w-48 p-1.5 rounded border border-gray-300 bg-white"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setForm({
                                                ...form,
                                                specialMentions: {
                                                    ...form.specialMentions,
                                                    items: form.specialMentions.items.filter((_, i) => i !== idx),
                                                },
                                            })
                                        }
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                disabled={(form?.specialMentions?.items || []).length >= EVENT_LIMITS.specialMentions.max}
                                onClick={() => {
                                    const items = form?.specialMentions?.items || [];
                                    if (items.length >= EVENT_LIMITS.specialMentions.max) return;
                                    setForm({
                                        ...form,
                                        specialMentions: {
                                            ...form.specialMentions,
                                            items: [...items, { id: `men-${Date.now()}`, name: '', role: 'Mención Especial' }],
                                        },
                                    });
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Plus size={12} /> Añadir Mención Especial ({(form?.specialMentions?.items || []).length}/{EVENT_LIMITS.specialMentions.max})
                            </button>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* 10. Copy & Messages */}
                <CollapsibleSection
                    title="10. Textos y Mensajes de la Invitación"
                    subtitle="Portada, RSVP, aportes, mensaje de cierre y pie de página"
                    isOpen={openSections.copy}
                    onToggle={() => toggleSection('copy')}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Badge de Portada (Hero)</label>
                            <input
                                type="text"
                                maxLength={EVENT_LIMITS.hero.badgeMax}
                                value={form?.copy?.hero?.badge || ''}
                                onChange={(e) => updateCopy('hero', 'badge', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Día de la semana (Save the Date)</label>
                            <input
                                type="text"
                                maxLength={EVENT_LIMITS.dateSection.weekdayMax}
                                value={form?.copy?.dateSection?.weekdayLabel || ''}
                                onChange={(e) => updateCopy('dateSection', 'weekdayLabel', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Título Sección Ubicaciones</label>
                            <input
                                type="text"
                                maxLength={EVENT_LIMITS.locations.sectionTitleMax}
                                value={form?.copy?.locations?.title || ''}
                                onChange={(e) => updateCopy('locations', 'title', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Subtítulo Sección Ubicaciones</label>
                            <input
                                type="text"
                                maxLength={EVENT_LIMITS.locations.sectionSubtitleMax}
                                value={form?.copy?.locations?.subtitle || ''}
                                onChange={(e) => updateCopy('locations', 'subtitle', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] text-gray-500 uppercase">Mensaje de Confirmación (RSVP)</label>
                            <input
                                type="text"
                                maxLength={EVENT_LIMITS.rsvp.subtitleMax}
                                value={form?.copy?.rsvp?.subtitle || ''}
                                onChange={(e) => updateCopy('rsvp', 'subtitle', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Título Tarjeta Aportes / Regalos</label>
                            <input
                                type="text"
                                maxLength={EVENT_LIMITS.paymentAccounts.sectionTitleMax}
                                value={form?.copy?.contributions?.title || ''}
                                onChange={(e) => updateCopy('contributions', 'title', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Subtítulo Tarjeta Aportes / Regalos</label>
                            <input
                                type="text"
                                maxLength={EVENT_LIMITS.paymentAccounts.sectionSubtitleMax}
                                value={form?.copy?.contributions?.subtitle || ''}
                                onChange={(e) => updateCopy('contributions', 'subtitle', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Mensaje de cierre</label>
                            <input
                                type="text"
                                maxLength={EVENT_LIMITS.closing.quoteMax}
                                value={form?.copy?.closing?.quote || ''}
                                onChange={(e) => updateCopy('closing', 'quote', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Firma de cierre</label>
                            <input
                                type="text"
                                maxLength={EVENT_LIMITS.closing.signatureMax}
                                value={form?.copy?.closing?.signature || ''}
                                onChange={(e) => updateCopy('closing', 'signature', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] text-gray-500 uppercase">Nota o cita de pie de página</label>
                            <textarea
                                rows={2}
                                maxLength={EVENT_LIMITS.footer.noteMax}
                                value={form?.copy?.footer?.note || ''}
                                onChange={(e) => updateCopy('footer', 'note', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Referencia de la cita</label>
                            <input
                                type="text"
                                maxLength={EVENT_LIMITS.footer.referenceMax}
                                value={form?.copy?.footer?.reference || ''}
                                onChange={(e) => updateCopy('footer', 'reference', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase">Botón de Bienvenida</label>
                            <input
                                type="text"
                                maxLength={EVENT_LIMITS.hero.welcomeButtonMax}
                                value={form?.copy?.welcome?.buttonLabel || ''}
                                onChange={(e) => updateCopy('welcome', 'buttonLabel', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            />
                        </div>
                    </div>
                </CollapsibleSection>

                <div className="pt-3 sticky bottom-3 flex justify-end">
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
