import React, { useState, useEffect } from 'react';
import {
    Check, X, Shield, Users, Image as ImageIcon, RefreshCw,
    Download, FileText, MessageCircle, Edit2, Trash2, AlertTriangle, RotateCcw,
    Plus, Minus, Camera, UserPlus, Copy, Settings, LogOut, UserCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { exportConfirmacionesToXLSX } from '../utils/exportExcel';
import { exportConfirmacionesToPDF } from '../utils/exportPdf';
import { useConfig } from '../context/ConfigContext';
import { formatFechaLarga } from '../utils/fechas';
import { labelOf, canonicalId, nombreApellidoDe, nombreCompletoDe } from '../utils/menu';
import { grupoLabel, grupoBadgeClass } from '../utils/grupos';
import { friendlyError } from '../utils/errores';
import ConfigTab from './ConfigTab';

const DEFAULT_PLANTILLA_WA =
    '¡Hola {nombre}! Estamos muy felices de compartir nuestro día contigo. Esta invitación es válida para {personas}. Confírmanos tu asistencia y menú antes del {fecha_limite}. Nos vemos pronto. Con amor, {novios} ✨\n\n{enlace}';

const AdminPanel = ({ user, onLogout }) => {
    const { config } = useConfig();
    const [tab, setTab] = useState('confirmaciones'); // 'confirmaciones' | 'invitados' | 'fotos' | 'configuracion'
    const [fotoFilter, setFotoFilter] = useState('pendiente'); // 'todas' | 'pendiente' | 'aprobada' | 'rechazada'
    const [grupoFilter, setGrupoFilter] = useState('todos'); // 'todos' | 'novia' | 'novio'
    const [expandedRows, setExpandedRows] = useState({});

    const [invitados, setInvitados] = useState([]);
    const [confirmaciones, setConfirmaciones] = useState([]);
    const [fotos, setFotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bannerError, setBannerError] = useState(null);

    // Modales
    const [asistenteModal, setAsistenteModal] = useState(null);
    // { mode: 'create' | 'edit', titular, id?, es_titular, nombre, apellido, plato_fuerte, contornos: [] }
    const [guestModal, setGuestModal] = useState({ isOpen: false, mode: 'create', data: null });
    const [whatsAppModal, setWhatsAppModal] = useState({ isOpen: false, invitado: null, message: '', phone: '' });
    const [deleteItem, setDeleteItem] = useState(null);
    // { type: 'confirmacion' | 'titular' | 'reset_confirmacion', id, invitadoId?, name, extraInfo? }
    const [actionLoading, setActionLoading] = useState(false);
    const [copiedToken, setCopiedToken] = useState(null);

    const { novios, fechaLimiteRsvp, menu, urlPublica, plantillaWhatsapp, grupos = [] } = config;
    const nombreNovia = novios?.novia?.nombre || 'Novia';
    const nombreNovio = novios?.novio?.nombre || 'Novio';
    const nombresNovios = `${nombreNovio} & ${nombreNovia}`;
    const defaultGrupoId = grupos[0]?.id || 'novia';
    const platosList = menu?.platosFuertes || [];
    const contornosList = menu?.contornos || [];
    const maxContornos = menu?.maxContornos ?? 2;

    const fechaLimiteStr = formatFechaLarga(fechaLimiteRsvp);
    const publicBaseUrl = (urlPublica || window.location.origin).replace(/\/+$/, '');

    const loadData = async () => {
        if (!supabase) return;
        setLoading(true);
        setBannerError(null);

        try {
            const [invRes, confRes, fotosRes] = await Promise.all([
                supabase.from('invitados').select('*').order('created_at', { ascending: false }),
                supabase.from('confirmaciones').select('*').order('created_at', { ascending: true }),
                supabase.from('fotos').select('*, invitados(nombre, apellido)').order('created_at', { ascending: false }),
            ]);

            if (invRes.error) throw invRes.error;
            if (confRes.error) throw confRes.error;
            if (fotosRes.error) throw fotosRes.error;

            if (invRes.data) {
                setInvitados(invRes.data);
                setExpandedRows((prev) => {
                    const next = { ...prev };
                    invRes.data.forEach((inv) => {
                        if (next[inv.id] === undefined) next[inv.id] = true;
                    });
                    return next;
                });
            }
            if (confRes.data) setConfirmaciones(confRes.data);
            if (fotosRes.data) {
                const mapped = fotosRes.data.map((f) => {
                    const { data: pubData } = supabase.storage.from('galeria').getPublicUrl(f.storage_path);
                    return { ...f, url: pubData.publicUrl };
                });
                setFotos(mapped);
            }
        } catch (err) {
            console.error('[AdminPanel] Error loading data:', err);
            setBannerError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const toggleRow = (id) => {
        setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleAllRows = (expand) => {
        const next = {};
        invitados.forEach((inv) => { next[inv.id] = expand; });
        setExpandedRows(next);
    };

    const copyInviteLink = (token, id) => {
        const link = `${publicBaseUrl}/?ref=${token}`;
        navigator.clipboard.writeText(link);
        setCopiedToken(id);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    // ─── Modal de WhatsApp con Vista Previa Editable ───────────────
    const openWhatsAppModal = (invitado) => {
        const slotsVal = Number(invitado.slots_totales ?? invitado.slots ?? 0);
        const totalPases = 1 + slotsVal;
        const personasTxt = `${totalPases} persona${totalPases > 1 ? 's' : ''}`;
        const inviteLink = `${publicBaseUrl}/?ref=${invitado.token}`;

        const tpl = plantillaWhatsapp || DEFAULT_PLANTILLA_WA;
        const message = tpl
            .replace(/\{nombre\}/g, invitado.nombre || '')
            .replace(/\{personas\}/g, personasTxt)
            .replace(/\{fecha_limite\}/g, fechaLimiteStr || '')
            .replace(/\{novios\}/g, nombresNovios)
            .replace(/\{enlace\}/g, inviteLink);

        setWhatsAppModal({
            isOpen: true,
            invitado,
            phone: (invitado.telefono || '').replace(/[^0-9]/g, ''),
            message,
        });
    };

    const handleSendWhatsApp = () => {
        if (!whatsAppModal.phone) {
            alert('Por favor especifica un número de teléfono válido.');
            return;
        }
        const encoded = encodeURIComponent(whatsAppModal.message);
        window.open(`https://wa.me/${whatsAppModal.phone}?text=${encoded}`, '_blank');
        setWhatsAppModal({ isOpen: false, invitado: null, message: '', phone: '' });
    };

    // ─── Guardar / Crear Invitado Titular ──────────────────────────
    const handleSaveGuest = async (e) => {
        e.preventDefault();
        const formData = guestModal.data;

        if (!formData.nombre?.trim() || !formData.apellido?.trim() || !formData.telefono?.trim() || !formData.grupo) {
            alert('Nombre, Apellido, Teléfono y Grupo son campos estrictamente obligatorios.');
            return;
        }

        const slotsCount = Math.max(0, Number(formData.slots_totales ?? formData.slots ?? 0));

        // Validar antes de bajar slots_totales por debajo de los asistentes ya confirmados
        if (guestModal.mode === 'edit') {
            const confirmadosActuales = confirmaciones.filter((c) => c.invitado_id === formData.id).length;
            if (1 + slotsCount < confirmadosActuales) {
                alert(
                    `Este invitado ya tiene ${confirmadosActuales} persona(s) confirmada(s). No puedes reducir su capacidad a ${1 + slotsCount}. Elimina primero los asistentes sobrantes.`
                );
                return;
            }
        }

        setActionLoading(true);
        try {
            if (guestModal.mode === 'create') {
                const newRow = {
                    nombre: formData.nombre.trim(),
                    apellido: formData.apellido.trim(),
                    telefono: formData.telefono.trim(),
                    email: formData.email?.trim() || null,
                    grupo: formData.grupo,
                    slots_totales: slotsCount,
                    puede_subir_fotos: Boolean(formData.puede_subir_fotos),
                };
                const { data, error } = await supabase.from('invitados').insert([newRow]).select();
                if (error) throw error;
                if (data && data[0]) {
                    setInvitados((prev) => [data[0], ...prev]);
                    setExpandedRows((prev) => ({ ...prev, [data[0].id]: true }));
                }
            } else if (guestModal.mode === 'edit') {
                const { data, error } = await supabase
                    .from('invitados')
                    .update({
                        nombre: formData.nombre.trim(),
                        apellido: formData.apellido.trim(),
                        telefono: formData.telefono.trim(),
                        email: formData.email?.trim() || null,
                        grupo: formData.grupo,
                        slots_totales: slotsCount,
                        puede_subir_fotos: Boolean(formData.puede_subir_fotos),
                    })
                    .eq('id', formData.id)
                    .select();

                if (error) throw error;
                const updated = data?.[0];
                setInvitados((prev) =>
                    prev.map((inv) =>
                        inv.id === formData.id
                            ? updated || { ...inv, ...formData, slots_totales: slotsCount }
                            : inv
                    )
                );
            }

            setGuestModal({ isOpen: false, mode: 'create', data: null });
        } catch (err) {
            console.error('Error saving guest:', err);
            alert(friendlyError(err));
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Abrir Modal de Asistente (Crear Acompañante / Re-agregar Titular / Editar) ──
    const openCreateAsistente = (titular, esTitular = false) => {
        setAsistenteModal({
            mode: 'create',
            titular,
            es_titular: esTitular,
            nombre: esTitular ? titular.nombre : '',
            apellido: esTitular ? titular.apellido : '',
            plato_fuerte: platosList[0]?.id || '',
            contornos: [],
        });
    };

    const openEditAsistente = (titular, asistente) => {
        const { nombre, apellido } = nombreApellidoDe(asistente);
        setAsistenteModal({
            mode: 'edit',
            titular,
            id: asistente.id,
            es_titular: Boolean(asistente.es_titular),
            nombre,
            apellido,
            plato_fuerte: canonicalId(platosList, asistente.plato_fuerte) || '',
            contornos: (asistente.contornos || []).map((c) => canonicalId(contornosList, c)),
        });
    };

    const toggleModalContorno = (contornoId) => {
        setAsistenteModal((prev) => {
            if (!prev) return prev;
            const exists = prev.contornos.includes(contornoId);
            if (exists) {
                return { ...prev, contornos: prev.contornos.filter((id) => id !== contornoId) };
            }
            if (prev.contornos.length >= maxContornos) return prev;
            return { ...prev, contornos: [...prev.contornos, contornoId] };
        });
    };

    const handleSaveAsistente = async (e) => {
        e.preventDefault();
        if (!asistenteModal) return;

        const nombre = asistenteModal.nombre?.trim();
        const apellido = asistenteModal.apellido?.trim();
        if (!nombre || !apellido) {
            alert('Nombre y Apellido son obligatorios.');
            return;
        }
        if (!asistenteModal.plato_fuerte) {
            alert('Debes seleccionar un plato fuerte.');
            return;
        }
        if (maxContornos > 0 && contornosList.length > 0 && asistenteModal.contornos.length < 1) {
            alert(`Debes seleccionar al menos 1 contorno (máximo ${maxContornos}).`);
            return;
        }

        setActionLoading(true);
        try {
            const nombreCompleto = `${nombre} ${apellido}`;

            if (asistenteModal.mode === 'create') {
                const payload = {
                    invitado_id: asistenteModal.titular.id,
                    nombre,
                    apellido,
                    nombre_completo: nombreCompleto,
                    es_titular: Boolean(asistenteModal.es_titular),
                    plato_fuerte: asistenteModal.plato_fuerte,
                    contornos: asistenteModal.contornos,
                };
                const { data, error } = await supabase.from('confirmaciones').insert([payload]).select();
                if (error) throw error;

                if (data && data[0]) {
                    setConfirmaciones((prev) => [...prev, data[0]]);
                }
                if (!asistenteModal.titular.confirmed_at) {
                    const nowIso = new Date().toISOString();
                    setInvitados((prev) =>
                        prev.map((i) => (i.id === asistenteModal.titular.id ? { ...i, confirmed_at: nowIso } : i))
                    );
                }
            } else {
                const payload = {
                    nombre,
                    apellido,
                    nombre_completo: nombreCompleto,
                    plato_fuerte: asistenteModal.plato_fuerte,
                    contornos: asistenteModal.contornos,
                };
                const { data, error } = await supabase
                    .from('confirmaciones')
                    .update(payload)
                    .eq('id', asistenteModal.id)
                    .select();
                if (error) throw error;

                const updated = data?.[0];
                setConfirmaciones((prev) =>
                    prev.map((c) => (c.id === asistenteModal.id ? updated || { ...c, ...payload } : c))
                );
            }

            setAsistenteModal(null);
        } catch (err) {
            console.error('Error saving asistente:', err);
            alert(friendlyError(err));
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Eliminación / Reseteo con Integridad Garantizada ──────────
    const handleDeleteConfirm = async () => {
        if (!deleteItem) return;
        setActionLoading(true);

        try {
            if (deleteItem.type === 'confirmacion') {
                const { error } = await supabase.from('confirmaciones').delete().eq('id', deleteItem.id);
                if (error) throw error;

                const remaining = confirmaciones.filter((c) => c.id !== deleteItem.id);
                setConfirmaciones(remaining);

                // Si quedó en 0 asistentes para ese titular, limpiar confirmed_at en el estado local (el trigger lo hace en BD)
                const quedanDelTitular = remaining.some((c) => c.invitado_id === deleteItem.invitadoId);
                if (!quedanDelTitular && deleteItem.invitadoId) {
                    setInvitados((prev) =>
                        prev.map((i) => (i.id === deleteItem.invitadoId ? { ...i, confirmed_at: null } : i))
                    );
                }
            } else if (deleteItem.type === 'reset_confirmacion') {
                // RPC atómica: borra confirmaciones y limpia confirmed_at; NUNCA borra al invitado
                const { error } = await supabase.rpc('reiniciar_confirmacion', {
                    p_invitado: deleteItem.id,
                });
                if (error) throw error;

                setConfirmaciones((prev) => prev.filter((c) => c.invitado_id !== deleteItem.id));
                setInvitados((prev) => prev.map((i) => (i.id === deleteItem.id ? { ...i, confirmed_at: null } : i)));
            } else if (deleteItem.type === 'titular') {
                // Borrar primero archivos en Storage del invitado para no dejar huérfanos
                const fotosDelTitular = fotos.filter((f) => f.invitado_id === deleteItem.id);
                if (fotosDelTitular.length > 0) {
                    const paths = fotosDelTitular.map((f) => f.storage_path).filter(Boolean);
                    if (paths.length > 0) {
                        await supabase.storage.from('galeria').remove(paths);
                    }
                }

                const { error } = await supabase.from('invitados').delete().eq('id', deleteItem.id);
                if (error) throw error;

                setInvitados((prev) => prev.filter((i) => i.id !== deleteItem.id));
                setConfirmaciones((prev) => prev.filter((c) => c.invitado_id !== deleteItem.id));
                setFotos((prev) => prev.filter((f) => f.invitado_id !== deleteItem.id));
            }
            setDeleteItem(null);
        } catch (err) {
            console.error('Error handling delete:', err);
            alert(friendlyError(err));
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Gestión de Fotos ──────────────────────────────────────────
    const updateFotoEstado = async (id, estado) => {
        try {
            const { error } = await supabase.from('fotos').update({ estado }).eq('id', id);
            if (error) throw error;
            setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, estado } : f)));
        } catch (err) {
            console.error('Error updating foto:', err);
            alert(friendlyError(err));
        }
    };

    // ─── Agrupación y Cálculos de Totales ──────────────────────────
    const todosAgrupados = invitados
        .map((titular) => {
            const asistentes = confirmaciones.filter((c) => c.invitado_id === titular.id);
            const fotosSubidas = fotos.filter((f) => f.invitado_id === titular.id);
            return {
                titular,
                asistentes,
                fotosCount: fotosSubidas.length,
            };
        })
        .filter((grupo) => {
            if (grupoFilter === 'todos') return true;
            return grupo.titular.grupo === grupoFilter;
        });

    // Tab Confirmaciones: SOLO quienes ya confirmaron (o tienen asistentes registrados)
    const confirmadosAgrupados = todosAgrupados.filter(
        ({ titular, asistentes }) => Boolean(titular.confirmed_at) || asistentes.length > 0
    );

    const fotosFiltradas = fotos.filter((f) => {
        if (fotoFilter === 'todas') return true;
        return f.estado === fotoFilter;
    });

    const totalPasesConfirmados = confirmadosAgrupados.reduce((acc, g) => {
        const s = Number(g.titular.slots_totales ?? g.titular.slots ?? 0);
        return acc + 1 + s;
    }, 0);
    const totalAsistentesConfirmados = confirmadosAgrupados.reduce((acc, g) => acc + g.asistentes.length, 0);

    return (
        <div className="admin-panel min-h-screen bg-gray-50 p-3 md:p-6 font-body text-gray-800">
            <div className="max-w-7xl mx-auto">

                {/* Header Superior */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 bg-white p-4 md:p-5 rounded-xl shadow-xs border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 leading-tight">Panel de Administración</h1>
                            <p className="text-xs text-gray-500">
                                {user?.email ? `Sesión: ${user.email}` : 'Gestión de invitados, confirmaciones, fotos y configuración'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={loadData}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
                            title="Recargar datos"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <a
                            href="/"
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                        >
                            Ver Invitación
                        </a>
                        {onLogout && (
                            <button
                                onClick={onLogout}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Cerrar sesión"
                            >
                                <LogOut size={14} />
                                Salir
                            </button>
                        )}
                    </div>
                </div>

                {bannerError && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-2">
                        <span><strong>Error al cargar datos:</strong> {bannerError}</span>
                        <button onClick={() => setBannerError(null)} className="p-1 hover:bg-red-100 rounded cursor-pointer">
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Tabs Principales */}
                <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-2">
                    <button
                        onClick={() => setTab('confirmaciones')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
                            tab === 'confirmaciones' ? 'bg-primary text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Users size={15} />
                        Confirmaciones ({totalAsistentesConfirmados})
                    </button>

                    <button
                        onClick={() => setTab('invitados')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
                            tab === 'invitados' ? 'bg-primary text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <UserPlus size={15} />
                        Gestión de Invitados ({invitados.length})
                    </button>

                    <button
                        onClick={() => setTab('fotos')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
                            tab === 'fotos' ? 'bg-primary text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <ImageIcon size={15} />
                        Fotos ({fotos.filter((f) => f.estado === 'pendiente').length} pendientes)
                    </button>

                    <button
                        onClick={() => setTab('configuracion')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
                            tab === 'configuracion' ? 'bg-primary text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Settings size={15} />
                        Configuración
                    </button>
                </div>

                {/* ════════════════════════════════════════════════════════════
                    TAB 1: CONFIRMACIONES EN ÁRBOL (NESTED ROWS)
                ════════════════════════════════════════════════════════════ */}
                {tab === 'confirmaciones' && (
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Grupo:</span>
                                <div className="flex flex-wrap gap-1">
                                    {[
                                        { id: 'todos', nombre: 'Todos' },
                                        ...grupos,
                                    ].map((g) => (
                                        <button
                                            key={g.id}
                                            onClick={() => setGrupoFilter(g.id)}
                                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                                                grupoFilter === g.id
                                                    ? 'bg-gray-800 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {g.nombre}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => toggleAllRows(true)}
                                    className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded border border-gray-200 cursor-pointer"
                                >
                                    Expandir todo
                                </button>
                                <button
                                    onClick={() => toggleAllRows(false)}
                                    className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded border border-gray-200 cursor-pointer"
                                >
                                    Colapsar
                                </button>
                                <button
                                    onClick={() => exportConfirmacionesToXLSX(confirmadosAgrupados, config, grupoFilter)}
                                    disabled={confirmadosAgrupados.length === 0}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                                >
                                    <Download size={13} />
                                    Excel (.xlsx)
                                </button>
                                <button
                                    onClick={() => exportConfirmacionesToPDF(confirmadosAgrupados, config, grupoFilter)}
                                    disabled={confirmadosAgrupados.length === 0}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                                >
                                    <FileText size={13} />
                                    PDF (.pdf)
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-gray-50/90 text-gray-500 uppercase font-semibold text-[11px] border-b border-gray-200">
                                        <tr>
                                            <th className="w-10 px-3 py-2.5 text-center"></th>
                                            <th className="px-3 py-2.5">Titular</th>
                                            <th className="px-3 py-2.5">Grupo</th>
                                            <th className="px-3 py-2.5">Teléfono</th>
                                            <th className="px-3 py-2.5">Pases Totales</th>
                                            <th className="px-3 py-2.5">Confirmados</th>
                                            <th className="px-3 py-2.5">Fotos</th>
                                            <th className="px-3 py-2.5">Estado</th>
                                            <th className="px-3 py-2.5 text-right">Acción</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {confirmadosAgrupados.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                                                    Aún no hay confirmaciones registradas bajo este filtro.
                                                </td>
                                            </tr>
                                        ) : (
                                            confirmadosAgrupados.map(({ titular, asistentes, fotosCount }) => {
                                                const slotsCount = Number(titular.slots_totales ?? titular.slots ?? 0);
                                                const totalPases = 1 + slotsCount;
                                                const hasAsistentes = asistentes.length > 0;
                                                const hasTitularRow = asistentes.some((a) => a.es_titular);
                                                const cupoLleno = asistentes.length >= totalPases;
                                                // Si slots_totales === 0 y solo es 1 persona, NO necesita nested table
                                                const usaNested = slotsCount > 0 || asistentes.length > 1;
                                                const isExpanded = usaNested && Boolean(expandedRows[titular.id]);
                                                const unicoAsistente = !usaNested ? asistentes[0] : null;

                                                return (
                                                    <React.Fragment key={titular.id}>
                                                        <tr className={`hover:bg-gray-50/80 transition-colors ${isExpanded ? 'bg-gray-50/40' : ''}`}>
                                                            <td className="px-3 py-2 text-center align-middle">
                                                                {usaNested ? (
                                                                    <button
                                                                        onClick={() => toggleRow(titular.id)}
                                                                        className="w-5 h-5 inline-flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:border-primary hover:text-primary transition-colors cursor-pointer bg-white"
                                                                        title={isExpanded ? 'Colapsar acompañantes' : 'Ver acompañantes'}
                                                                    >
                                                                        {isExpanded ? <Minus size={11} /> : <Plus size={11} />}
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-gray-300 text-xs" title="Invitado individual (sin acompañantes)">•</span>
                                                                )}
                                                            </td>

                                                            <td className="px-3 py-2 align-middle">
                                                                <div className="font-semibold text-gray-900 whitespace-nowrap">
                                                                    {titular.nombre} {titular.apellido}
                                                                </div>
                                                                {unicoAsistente && (
                                                                    <div className="text-[10px] text-gray-500 mt-0.5">
                                                                        <span className="font-medium text-gray-700">
                                                                            {labelOf(platosList, unicoAsistente.plato_fuerte)}
                                                                        </span>
                                                                        {(unicoAsistente.contornos || []).length > 0 && (
                                                                            <> · {(unicoAsistente.contornos || []).map((id) => labelOf(contornosList, id)).join(', ')}</>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>

                                                            <td className="px-3 py-2 align-middle">
                                                                <span
                                                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${grupoBadgeClass(grupos, titular.grupo)}`}
                                                                >
                                                                    {grupoLabel(grupos, titular.grupo)}
                                                                </span>
                                                            </td>

                                                            <td className="px-3 py-2 text-gray-600 font-mono text-[11px] align-middle">
                                                                {titular.telefono || '—'}
                                                            </td>

                                                            <td className="px-3 py-2 font-medium text-gray-700 align-middle">
                                                                <span className="font-bold text-gray-900">{totalPases} pases</span>
                                                                <span className="text-gray-400 text-[10px] block">
                                                                    (Titular + {slotsCount})
                                                                </span>
                                                            </td>

                                                            <td className="px-3 py-2 align-middle">
                                                                <span
                                                                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                                                        asistentes.length > 0
                                                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                                                            : 'bg-gray-100 text-gray-400'
                                                                    }`}
                                                                >
                                                                    {asistentes.length} / {totalPases}
                                                                </span>
                                                            </td>

                                                            <td className="px-3 py-2 text-gray-600 align-middle">
                                                                {fotosCount > 0 ? (
                                                                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                                                                        <Camera size={12} /> {fotosCount}
                                                                    </span>
                                                                ) : titular.puede_subir_fotos ? (
                                                                    <span className="text-gray-400 text-[11px]">Permitido</span>
                                                                ) : (
                                                                    <span className="text-gray-300 text-[11px]">No</span>
                                                                )}
                                                            </td>

                                                            <td className="px-3 py-2 align-middle">
                                                                <span
                                                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                        titular.confirmed_at
                                                                            ? 'bg-green-100 text-green-700'
                                                                            : 'bg-gray-100 text-gray-500'
                                                                    }`}
                                                                >
                                                                    {titular.confirmed_at ? 'Confirmó' : 'Pendiente'}
                                                                </span>
                                                            </td>

                                                            <td className="px-3 py-2 text-right whitespace-nowrap align-middle">
                                                                <div className="inline-flex items-center gap-1.5 justify-end">
                                                                    {unicoAsistente && (
                                                                        <button
                                                                            onClick={() => openEditAsistente(titular, unicoAsistente)}
                                                                            className="p-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                                                            title="Editar menú del asistente"
                                                                        >
                                                                            <Edit2 size={13} />
                                                                        </button>
                                                                    )}
                                                                    {titular.confirmed_at || hasAsistentes ? (
                                                                        <button
                                                                            onClick={() =>
                                                                                setDeleteItem({
                                                                                    type: 'reset_confirmacion',
                                                                                    id: titular.id,
                                                                                    name: `${titular.nombre} ${titular.apellido}`,
                                                                                })
                                                                            }
                                                                            className="inline-flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors cursor-pointer text-[10px] font-semibold border border-gray-200"
                                                                            title="Reiniciar confirmación sin borrar al invitado"
                                                                        >
                                                                            <RotateCcw size={12} />
                                                                            Reiniciar
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-gray-300 text-[10px] italic">Sin confirmar</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {/* FILA ANIDADA */}
                                                        {isExpanded && (
                                                            <tr className="bg-gray-50/70 border-b border-gray-100">
                                                                <td colSpan={9} className="p-0">
                                                                    <div className="py-2.5 pl-11 pr-4 space-y-2">
                                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                                                                Asistentes ({asistentes.length} / {totalPases})
                                                                            </span>

                                                                            <div className="flex items-center gap-2">
                                                                                {!hasTitularRow && !cupoLleno && (
                                                                                    <button
                                                                                        onClick={() => openCreateAsistente(titular, true)}
                                                                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-800 text-white hover:bg-gray-700 rounded text-[10px] font-bold transition-all cursor-pointer"
                                                                                    >
                                                                                        <UserCheck size={12} />
                                                                                        Agregar Titular
                                                                                    </button>
                                                                                )}

                                                                                <button
                                                                                    onClick={() => openCreateAsistente(titular, false)}
                                                                                    disabled={cupoLleno}
                                                                                    title={cupoLleno ? `Cupo lleno (${totalPases}/${totalPases})` : 'Agregar acompañante'}
                                                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold transition-all border ${
                                                                                        cupoLleno
                                                                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                                                            : 'bg-primary/10 text-primary hover:bg-primary hover:text-white border-primary/20 cursor-pointer'
                                                                                    }`}
                                                                                >
                                                                                    <Plus size={12} />
                                                                                    {cupoLleno ? 'Cupo lleno' : 'Agregar Acompañante'}
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {!hasAsistentes ? (
                                                                            <div className="py-2 text-[11px] text-gray-400 italic">
                                                                                No ha confirmado asistentes todavía.
                                                                            </div>
                                                                        ) : (
                                                                            <div className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
                                                                                <table className="w-full text-left text-[11px]">
                                                                                    <thead className="bg-gray-100/70 text-gray-500 font-semibold uppercase text-[10px] border-b border-gray-200">
                                                                                        <tr>
                                                                                            <th className="py-1.5 px-3 w-8">#</th>
                                                                                            <th className="py-1.5 px-3">Asistente</th>
                                                                                            <th className="py-1.5 px-3">Rol</th>
                                                                                            <th className="py-1.5 px-3">Plato Fuerte</th>
                                                                                            <th className="py-1.5 px-3">Contornos</th>
                                                                                            <th className="py-1.5 px-3 text-right">Acción</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody className="divide-y divide-gray-100">
                                                                                        {asistentes.map((asistente, idx) => (
                                                                                            <tr key={asistente.id} className="hover:bg-primary/5 transition-colors">
                                                                                                <td className="py-1.5 px-3 text-gray-400 font-mono">
                                                                                                    {idx + 1}
                                                                                                </td>
                                                                                                <td className="py-1.5 px-3 font-semibold text-gray-800">
                                                                                                    {nombreCompletoDe(asistente)}
                                                                                                </td>
                                                                                                <td className="py-1.5 px-3">
                                                                                                    <span
                                                                                                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                                                                            asistente.es_titular
                                                                                                                ? 'bg-gray-800 text-white'
                                                                                                                : 'bg-gray-100 text-gray-600'
                                                                                                        }`}
                                                                                                    >
                                                                                                        {asistente.es_titular ? 'Titular' : `Acomp. de ${titular.nombre}`}
                                                                                                    </span>
                                                                                                </td>
                                                                                                <td className="py-1.5 px-3 text-gray-700">
                                                                                                    {labelOf(platosList, asistente.plato_fuerte)}
                                                                                                </td>
                                                                                                <td className="py-1.5 px-3 text-gray-600">
                                                                                                    {(asistente.contornos || [])
                                                                                                        .map((id) => labelOf(contornosList, id))
                                                                                                        .join(', ') || '—'}
                                                                                                </td>
                                                                                                <td className="py-1.5 px-3 text-right whitespace-nowrap">
                                                                                                    <div className="inline-flex items-center gap-1">
                                                                                                        <button
                                                                                                            onClick={() => openEditAsistente(titular, asistente)}
                                                                                                            className="p-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded cursor-pointer"
                                                                                                            title="Editar asistente"
                                                                                                        >
                                                                                                            <Edit2 size={13} />
                                                                                                        </button>
                                                                                                        <button
                                                                                                            onClick={() =>
                                                                                                                setDeleteItem({
                                                                                                                    type: 'confirmacion',
                                                                                                                    id: asistente.id,
                                                                                                                    invitadoId: titular.id,
                                                                                                                    name: nombreCompletoDe(asistente),
                                                                                                                })
                                                                                                            }
                                                                                                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                                                                                            title="Eliminar este asistente"
                                                                                                        >
                                                                                                            <Trash2 size={13} />
                                                                                                        </button>
                                                                                                    </div>
                                                                                                </td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })
                                        )}
                                    </tbody>

                                    {confirmadosAgrupados.length > 0 && (
                                        <tfoot className="bg-gray-100/90 font-bold text-gray-800 border-t-2 border-gray-300">
                                            <tr>
                                                <td className="px-3 py-2.5 text-center">∑</td>
                                                <td className="px-3 py-2.5 font-bold">
                                                    {confirmadosAgrupados.length} Familias confirmadas
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-gray-500 font-normal">
                                                        Filtro: {grupoFilter === 'todos' ? 'Todos' : grupoLabel(grupos, grupoFilter)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5 text-gray-400 font-normal">—</td>
                                                <td className="px-3 py-2.5 text-gray-900 font-bold">
                                                    {totalPasesConfirmados} pases asignados
                                                </td>
                                                <td className="px-3 py-2.5 text-green-700 font-bold">
                                                    {totalAsistentesConfirmados} asistentes
                                                </td>
                                                <td className="px-3 py-2.5 text-gray-400 font-normal">—</td>
                                                <td className="px-3 py-2.5 text-gray-400 font-normal">—</td>
                                                <td className="px-3 py-2.5 text-right text-gray-400 font-normal">—</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    TAB 2: GESTIÓN DE INVITADOS
                ════════════════════════════════════════════════════════════ */}
                {tab === 'invitados' && (
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Grupo:</span>
                                <div className="flex flex-wrap gap-1">
                                    {[
                                        { id: 'todos', nombre: 'Todos' },
                                        ...grupos,
                                    ].map((g) => (
                                        <button
                                            key={g.id}
                                            onClick={() => setGrupoFilter(g.id)}
                                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                                                grupoFilter === g.id
                                                    ? 'bg-gray-800 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {g.nombre}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() =>
                                    setGuestModal({
                                        isOpen: true,
                                        mode: 'create',
                                        data: {
                                            nombre: '',
                                            apellido: '',
                                            telefono: '',
                                            email: '',
                                            grupo: defaultGrupoId,
                                            slots_totales: 0,
                                            puede_subir_fotos: true,
                                        },
                                    })
                                }
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-secondary text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                            >
                                <Plus size={14} />
                                Nuevo Invitado
                            </button>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-gray-50/90 text-gray-500 uppercase font-semibold text-[11px] border-b border-gray-200">
                                        <tr>
                                            <th className="px-3 py-2.5">Invitado Titular</th>
                                            <th className="px-3 py-2.5">Grupo</th>
                                            <th className="px-3 py-2.5">Teléfono</th>
                                            <th className="px-3 py-2.5">Email</th>
                                            <th className="px-3 py-2.5">Pases Totales</th>
                                            <th className="px-3 py-2.5">Fotos</th>
                                            <th className="px-3 py-2.5">Enlace Invitación</th>
                                            <th className="px-3 py-2.5">Confirmó</th>
                                            <th className="px-3 py-2.5 text-right">Acciones</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {todosAgrupados.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                                                    No hay invitados registrados en este grupo.
                                                </td>
                                            </tr>
                                        ) : (
                                            todosAgrupados.map(({ titular, asistentes, fotosCount }) => {
                                                const slotsCount = Number(titular.slots_totales ?? titular.slots ?? 0);
                                                const totalPases = 1 + slotsCount;
                                                const isCopied = copiedToken === titular.id;

                                                return (
                                                    <tr key={titular.id} className="hover:bg-gray-50/80 transition-colors">
                                                        <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                                                            {titular.nombre} {titular.apellido}
                                                        </td>

                                                        <td className="px-3 py-2">
                                                            <span
                                                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${grupoBadgeClass(grupos, titular.grupo)}`}
                                                            >
                                                                {grupoLabel(grupos, titular.grupo)}
                                                            </span>
                                                        </td>

                                                        <td className="px-3 py-2 text-gray-600 font-mono text-[11px]">
                                                            {titular.telefono || '—'}
                                                        </td>

                                                        <td className="px-3 py-2 text-gray-500">
                                                            {titular.email || '—'}
                                                        </td>

                                                        <td className="px-3 py-2 font-medium">
                                                            <span className="font-bold text-gray-900">{totalPases} pases</span>{' '}
                                                            <span className="text-[10px] text-gray-400">(1 + {slotsCount})</span>
                                                        </td>

                                                        <td className="px-3 py-2">
                                                            <span className={`text-[11px] font-semibold ${titular.puede_subir_fotos ? 'text-primary' : 'text-gray-400'}`}>
                                                                {titular.puede_subir_fotos ? 'Sí' : 'No'}
                                                            </span>
                                                        </td>

                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                            <button
                                                                onClick={() => copyInviteLink(titular.token, titular.id)}
                                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer border ${
                                                                    isCopied
                                                                        ? 'bg-green-50 border-green-300 text-green-700'
                                                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                                                }`}
                                                                title={`Copiar enlace (${publicBaseUrl}/?ref=...)`}
                                                            >
                                                                {isCopied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                                                {isCopied ? '¡Copiado!' : 'Copiar enlace'}
                                                            </button>
                                                        </td>

                                                        <td className="px-3 py-2">
                                                            <span
                                                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                    titular.confirmed_at
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-gray-100 text-gray-500'
                                                                }`}
                                                            >
                                                                {titular.confirmed_at ? 'Sí' : 'No'}
                                                            </span>
                                                        </td>

                                                        <td className="px-3 py-2 text-right whitespace-nowrap">
                                                            <div className="inline-flex items-center gap-1">
                                                                <button
                                                                    onClick={() => openWhatsAppModal(titular)}
                                                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer"
                                                                    title="Enviar invitación por WhatsApp"
                                                                >
                                                                    <MessageCircle size={15} />
                                                                </button>

                                                                <button
                                                                    onClick={() =>
                                                                        setGuestModal({
                                                                            isOpen: true,
                                                                            mode: 'edit',
                                                                            data: { ...titular, slots_totales: slotsCount },
                                                                        })
                                                                    }
                                                                    className="p-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                                                    title="Editar invitado"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>

                                                                <button
                                                                    onClick={() =>
                                                                        setDeleteItem({
                                                                            type: 'titular',
                                                                            id: titular.id,
                                                                            name: `${titular.nombre} ${titular.apellido}`,
                                                                            extraInfo: `Se borrarán también ${asistentes.length} confirmación(es) y ${fotosCount} foto(s) asociadas.`,
                                                                        })
                                                                    }
                                                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                                                    title="Eliminar invitado de la base de datos"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    TAB 3: FOTOS Y MODERACIÓN
                ════════════════════════════════════════════════════════════ */}
                {tab === 'fotos' && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-1.5 bg-white p-2.5 rounded-xl border border-gray-200">
                            {[
                                { id: 'todas', label: 'Todas', count: fotos.length },
                                { id: 'pendiente', label: 'Pendientes', count: fotos.filter((f) => f.estado === 'pendiente').length },
                                { id: 'aprobada', label: 'Aprobadas', count: fotos.filter((f) => f.estado === 'aprobada').length },
                                { id: 'rechazada', label: 'Rechazadas', count: fotos.filter((f) => f.estado === 'rechazada').length },
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setFotoFilter(filter.id)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        fotoFilter === filter.id
                                            ? 'bg-primary text-white shadow-xs'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {filter.label} ({filter.count})
                                </button>
                            ))}
                        </div>

                        {fotosFiltradas.length === 0 ? (
                            <p className="text-sm text-gray-400 py-12 text-center bg-white rounded-xl border border-gray-200">
                                No hay fotos bajo este filtro.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {fotosFiltradas.map((f) => (
                                    <div key={f.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-xs flex flex-col text-xs">
                                        <div className="aspect-square bg-gray-100 relative">
                                            <img src={f.url} alt="Foto subida" className="w-full h-full object-cover" />
                                            <span
                                                className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    f.estado === 'aprobada'
                                                        ? 'bg-green-600 text-white'
                                                        : f.estado === 'rechazada'
                                                            ? 'bg-red-600 text-white'
                                                            : 'bg-yellow-500 text-white'
                                                }`}
                                            >
                                                {f.estado}
                                            </span>
                                        </div>
                                        <div className="p-2.5 flex-1 flex flex-col justify-between">
                                            <p className="text-gray-600 mb-2 truncate">
                                                De: <strong>{f.invitados ? `${f.invitados.nombre} ${f.invitados.apellido}` : 'Invitado'}</strong>
                                            </p>
                                            <div className="flex gap-1.5 pt-2 border-t border-gray-100">
                                                <button
                                                    onClick={() => updateFotoEstado(f.id, 'aprobada')}
                                                    className="flex-1 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 font-bold flex items-center justify-center gap-1 cursor-pointer text-[11px]"
                                                >
                                                    <Check size={13} /> Aprobar
                                                </button>
                                                <button
                                                    onClick={() => updateFotoEstado(f.id, 'rechazada')}
                                                    className="flex-1 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 font-bold flex items-center justify-center gap-1 cursor-pointer text-[11px]"
                                                >
                                                    <X size={13} /> Rechazar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    TAB 4: CONFIGURACIÓN DINÁMICA DEL EVENTO
                ════════════════════════════════════════════════════════════ */}
                {tab === 'configuracion' && <ConfigTab confirmaciones={confirmaciones} invitados={invitados} />}
            </div>

            {/* ════════════════════════════════════════════════════════════
                MODAL: CREAR / EDITAR ASISTENTE (NOMBRE, APELLIDO, PLATO Y CONTORNOS)
            ════════════════════════════════════════════════════════════ */}
            {asistenteModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">
                                    {asistenteModal.mode === 'edit'
                                        ? 'Editar Asistente'
                                        : asistenteModal.es_titular
                                            ? 'Agregar Confirmación del Titular'
                                            : 'Agregar Acompañante'}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Titular: <strong>{asistenteModal.titular.nombre} {asistenteModal.titular.apellido}</strong>
                                </p>
                            </div>
                            <button
                                onClick={() => setAsistenteModal(null)}
                                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAsistente} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        value={asistenteModal.nombre}
                                        onChange={(e) => setAsistenteModal({ ...asistenteModal, nombre: e.target.value })}
                                        placeholder="Ej: María"
                                        className="w-full p-2 rounded-lg border border-gray-300 text-xs focus:border-primary focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Apellido *</label>
                                    <input
                                        type="text"
                                        value={asistenteModal.apellido}
                                        onChange={(e) => setAsistenteModal({ ...asistenteModal, apellido: e.target.value })}
                                        placeholder="Ej: Pérez"
                                        className="w-full p-2 rounded-lg border border-gray-300 text-xs focus:border-primary focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Plato Fuerte *</label>
                                <select
                                    value={asistenteModal.plato_fuerte || ''}
                                    onChange={(e) => setAsistenteModal({ ...asistenteModal, plato_fuerte: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-gray-300 text-xs focus:border-primary focus:outline-none bg-white"
                                    required
                                >
                                    <option value="">Selecciona un plato</option>
                                    {platosList.map((p) => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {maxContornos > 0 && contornosList.length > 0 && (
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                                        Contornos * (mín. 1, máx. {maxContornos} — {asistenteModal.contornos.length} selec.)
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {contornosList.map((c) => {
                                            const selected = asistenteModal.contornos.includes(c.id);
                                            const disabled = !selected && asistenteModal.contornos.length >= maxContornos;
                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => toggleModalContorno(c.id)}
                                                    disabled={disabled}
                                                    className={`p-2 rounded-lg border text-xs font-medium text-left flex items-center justify-between transition-all ${
                                                        selected
                                                            ? 'border-primary bg-primary/10 text-gray-900 cursor-pointer'
                                                            : disabled
                                                                ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                                                                : 'border-gray-200 hover:border-primary/50 text-gray-700 cursor-pointer'
                                                    }`}
                                                >
                                                    <span>{c.nombre}</span>
                                                    {selected && <Check size={13} className="text-primary shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAsistenteModal(null)}
                                    className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-secondary transition-colors cursor-pointer"
                                >
                                    {actionLoading
                                        ? 'Guardando...'
                                        : asistenteModal.mode === 'edit'
                                            ? 'Guardar Cambios'
                                            : 'Guardar Asistente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                MODAL: VISTA PREVIA Y ENVÍO DE WHATSAPP EDITABLE
            ════════════════════════════════════════════════════════════ */}
            {whatsAppModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2 text-green-600 font-bold text-base">
                                <MessageCircle size={20} />
                                <h3>Enviar Invitación por WhatsApp</h3>
                            </div>
                            <button
                                onClick={() => setWhatsAppModal({ isOpen: false, invitado: null, message: '', phone: '' })}
                                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 mb-4">
                            Puedes modificar el texto libremente antes de enviar el mensaje:
                        </p>

                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                                    Número de Teléfono destino:
                                </label>
                                <input
                                    type="text"
                                    value={whatsAppModal.phone}
                                    onChange={(e) => setWhatsAppModal({ ...whatsAppModal, phone: e.target.value })}
                                    placeholder="+58414..."
                                    className="w-full p-2 rounded-lg border border-gray-300 text-xs font-mono focus:border-green-600 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                                    Mensaje a enviar:
                                </label>
                                <textarea
                                    rows={8}
                                    value={whatsAppModal.message}
                                    onChange={(e) => setWhatsAppModal({ ...whatsAppModal, message: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-gray-300 text-xs text-gray-800 leading-relaxed focus:border-green-600 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setWhatsAppModal({ isOpen: false, invitado: null, message: '', phone: '' })}
                                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSendWhatsApp}
                                className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                                <MessageCircle size={15} />
                                Abrir en WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                MODAL: CREAR / EDITAR INVITADO TITULAR
            ════════════════════════════════════════════════════════════ */}
            {guestModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-bold text-gray-900">
                                {guestModal.mode === 'create' ? 'Nuevo Invitado Titular' : 'Editar Invitado Titular'}
                            </h3>
                            <button
                                onClick={() => setGuestModal({ isOpen: false, mode: 'create', data: null })}
                                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveGuest} className="space-y-3.5">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        value={guestModal.data?.nombre || ''}
                                        onChange={(e) =>
                                            setGuestModal({ ...guestModal, data: { ...guestModal.data, nombre: e.target.value } })
                                        }
                                        className="w-full p-2 rounded-lg border border-gray-300 text-xs focus:border-primary focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Apellido *</label>
                                    <input
                                        type="text"
                                        value={guestModal.data?.apellido || ''}
                                        onChange={(e) =>
                                            setGuestModal({ ...guestModal, data: { ...guestModal.data, apellido: e.target.value } })
                                        }
                                        className="w-full p-2 rounded-lg border border-gray-300 text-xs focus:border-primary focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Teléfono *</label>
                                    <input
                                        type="text"
                                        value={guestModal.data?.telefono || ''}
                                        placeholder="+58414..."
                                        onChange={(e) =>
                                            setGuestModal({ ...guestModal, data: { ...guestModal.data, telefono: e.target.value } })
                                        }
                                        className="w-full p-2 rounded-lg border border-gray-300 text-xs font-mono focus:border-primary focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Grupo *</label>
                                    <select
                                        value={guestModal.data?.grupo || defaultGrupoId}
                                        onChange={(e) =>
                                            setGuestModal({ ...guestModal, data: { ...guestModal.data, grupo: e.target.value } })
                                        }
                                        className="w-full p-2 rounded-lg border border-gray-300 text-xs focus:border-primary focus:outline-none bg-white"
                                        required
                                    >
                                        {grupos.map((g) => (
                                            <option key={g.id} value={g.id}>{g.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Email (opcional)</label>
                                <input
                                    type="email"
                                    value={guestModal.data?.email || ''}
                                    onChange={(e) =>
                                        setGuestModal({ ...guestModal, data: { ...guestModal.data, email: e.target.value } })
                                    }
                                    className="w-full p-2 rounded-lg border border-gray-300 text-xs focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-0.5">
                                        Acompañantes adicionales permitidos (+N):
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="0"
                                            max="20"
                                            value={guestModal.data?.slots_totales ?? guestModal.data?.slots ?? 0}
                                            onChange={(e) => {
                                                const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                                                setGuestModal({
                                                    ...guestModal,
                                                    data: { ...guestModal.data, slots_totales: v, slots: v },
                                                });
                                            }}
                                            className="w-24 p-2 rounded-lg border border-gray-300 text-xs font-bold focus:border-primary focus:outline-none"
                                            required
                                        />
                                        <span className="text-xs text-gray-600">
                                            = Total:{' '}
                                            <strong>{1 + (Number(guestModal.data?.slots_totales ?? guestModal.data?.slots) || 0)} personas</strong>{' '}
                                            (Titular + {guestModal.data?.slots_totales ?? guestModal.data?.slots ?? 0})
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-200">
                                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={guestModal.data?.puede_subir_fotos ?? true}
                                            onChange={(e) =>
                                                setGuestModal({
                                                    ...guestModal,
                                                    data: { ...guestModal.data, puede_subir_fotos: e.target.checked },
                                                })
                                            }
                                            className="rounded text-primary focus:ring-primary"
                                        />
                                        <span>Permitirle subir fotos a la galería</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setGuestModal({ isOpen: false, mode: 'create', data: null })}
                                    className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-secondary transition-colors cursor-pointer shadow-xs"
                                >
                                    {actionLoading ? 'Guardando...' : guestModal.mode === 'create' ? 'Crear Invitado' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                MODAL: CONFIRMAR ACCIONES DESTRUCTIVAS O REINICIO
            ════════════════════════════════════════════════════════════ */}
            {deleteItem && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                                deleteItem.type === 'reset_confirmacion'
                                    ? 'bg-amber-100 text-amber-600'
                                    : 'bg-red-100 text-red-600'
                            }`}
                        >
                            {deleteItem.type === 'reset_confirmacion' ? <RotateCcw size={24} /> : <AlertTriangle size={24} />}
                        </div>

                        <h3 className="text-base font-bold text-gray-900 mb-1">
                            {deleteItem.type === 'reset_confirmacion' ? '¿Reiniciar confirmación?' : '¿Estás seguro de eliminar?'}
                        </h3>

                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                            {deleteItem.type === 'reset_confirmacion' ? (
                                <>
                                    Se borrarán las respuestas de asistencia y menú de <strong>{deleteItem.name}</strong> y sus acompañantes.
                                    <br />
                                    <strong className="text-green-600">El invitado permanecerá intacto en la lista de invitados</strong> para que pueda volver a confirmar.
                                </>
                            ) : deleteItem.type === 'titular' ? (
                                <>
                                    Estás a punto de borrar al invitado <strong>{deleteItem.name}</strong> definitivamente de la base de datos.
                                    {deleteItem.extraInfo && (
                                        <>
                                            <br />
                                            <span className="text-gray-700 font-medium">{deleteItem.extraInfo}</span>
                                        </>
                                    )}
                                    <br />
                                    <span className="text-red-500 font-semibold">Esta acción no tiene vuelta atrás.</span>
                                </>
                            ) : (
                                <>
                                    Estás a punto de eliminar a <strong>{deleteItem.name}</strong> de los asistentes confirmados.
                                    <br />
                                    <span className="text-red-500 font-semibold">Esta acción no tiene vuelta atrás.</span>
                                </>
                            )}
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setDeleteItem(null)}
                                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={actionLoading}
                                className={`flex-1 py-2 rounded-lg text-white text-xs font-bold transition-colors cursor-pointer ${
                                    deleteItem.type === 'reset_confirmacion'
                                        ? 'bg-amber-600 hover:bg-amber-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                {actionLoading
                                    ? 'Procesando...'
                                    : deleteItem.type === 'reset_confirmacion'
                                        ? 'Sí, reiniciar'
                                        : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
