import React, { useState, useEffect } from 'react';
import {
    Check, X, Shield, Users, Image as ImageIcon, RefreshCw,
    Download, MessageCircle, Edit2, Trash2, AlertTriangle, RotateCcw,
    Plus, Minus, Camera, Phone, User, UserPlus, Copy, ExternalLink, Link, Settings, Save
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { exportConfirmacionesToCSV } from '../utils/exportExcel';
import { useConfig } from '../context/ConfigContext';

const AdminPanel = () => {
    const { config, saveConfig, reloadConfig } = useConfig();
    const [tab, setTab] = useState('confirmaciones'); // 'confirmaciones' | 'invitados' | 'fotos' | 'configuracion'
    const [fotoFilter, setFotoFilter] = useState('pendiente'); // 'todas' | 'pendiente' | 'aprobada' | 'rechazada'
    const [grupoFilter, setGrupoFilter] = useState('todos'); // 'todos' | 'novia' | 'novio'
    const [expandedRows, setExpandedRows] = useState({}); // { [titularId]: boolean }

    const [invitados, setInvitados] = useState([]);
    const [confirmaciones, setConfirmaciones] = useState([]);
    const [fotos, setFotos] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modales de acción
    const [editAsistenteItem, setEditAsistenteItem] = useState(null);
    const [addAsistenteTitular, setAddAsistenteTitular] = useState(null); // Titular objeto al que se agrega acompañante
    const [guestModal, setGuestModal] = useState({ isOpen: false, mode: 'create', data: null });
    const [whatsAppModal, setWhatsAppModal] = useState({ isOpen: false, invitado: null, message: '', phone: '' });
    const [deleteItem, setDeleteItem] = useState(null); // { type: 'confirmacion' | 'titular' | 'reset_confirmacion', id, name }
    const [actionLoading, setActionLoading] = useState(false);
    const [copiedToken, setCopiedToken] = useState(null);

    // Estado local para formulario de configuración (Tab 4)
    const [configForm, setConfigForm] = useState(config);
    const [configSaveStatus, setConfigSaveStatus] = useState({ loading: false, msg: null, error: false });

    // Sincronizar formulario si config cambia externamente
    useEffect(() => {
        setConfigForm(config);
    }, [config]);

    const { novios, fechaLimiteRsvp, menu } = config;
    const nombreNovia = novios?.novia?.nombre || 'Novia';
    const nombreNovio = novios?.novio?.nombre || 'Novio';
    const nombresNovios = `${nombreNovio} & ${nombreNovia}`;

    // Fecha límite formateada
    const fechaLimiteStr = new Date(fechaLimiteRsvp || Date.now()).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const loadData = async () => {
        if (!supabase) return;
        setLoading(true);

        try {
            // 1. Invitados
            const { data: invData } = await supabase
                .from('invitados')
                .select('*')
                .order('created_at', { ascending: false });

            if (invData) {
                setInvitados(invData);
                // Expandir por defecto las filas
                const initialExpanded = {};
                invData.forEach(inv => { initialExpanded[inv.id] = true; });
                setExpandedRows(initialExpanded);
            }

            // 2. Confirmaciones
            const { data: confData } = await supabase
                .from('confirmaciones')
                .select('*')
                .order('created_at', { ascending: true });

            if (confData) setConfirmaciones(confData);

            // 3. Fotos
            const { data: fotosData } = await supabase
                .from('fotos')
                .select('*, invitados(nombre, apellido)')
                .order('created_at', { ascending: false });

            if (fotosData) {
                const mapped = fotosData.map(f => {
                    const { data: pubData } = supabase.storage.from('galeria').getPublicUrl(f.storage_path);
                    return { ...f, url: pubData.publicUrl };
                });
                setFotos(mapped);
            }
        } catch (err) {
            console.error('[AdminPanel] Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const toggleRow = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleAllRows = (expand) => {
        const next = {};
        invitados.forEach(inv => { next[inv.id] = expand; });
        setExpandedRows(next);
    };

    const copyInviteLink = (token, id) => {
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/?ref=${token}`;
        navigator.clipboard.writeText(link);
        setCopiedToken(id);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    // ─── Modal de WhatsApp con Vista Previa Editable ───────────────
    const openWhatsAppModal = (invitado) => {
        const slotsVal = Number(invitado.slots_totales ?? invitado.slots ?? 0);
        const totalPases = 1 + slotsVal;
        const baseUrl = window.location.origin;
        const inviteLink = `${baseUrl}/?ref=${invitado.token}`;

        const template = `¡Hola ${invitado.nombre}! Estamos muy felices de compartir nuestro día contigo. Esta invitación es válida para ${totalPases} persona${totalPases > 1 ? 's' : ''}. Confírmanos tu asistencia y menú antes del ${fechaLimiteStr}. Nos vemos pronto. Con amor, ${nombresNovios} ✨\n\n${inviteLink}`;

        setWhatsAppModal({
            isOpen: true,
            invitado,
            phone: (invitado.telefono || '').replace(/[^0-9]/g, ''),
            message: template
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

    // ─── Guardar / Crear Invitado (con validación de campos obligatorios) ─────
    const handleSaveGuest = async (e) => {
        e.preventDefault();
        const formData = guestModal.data;

        // Validación estricta: nombre, apellido, teléfono y grupo son obligatorios
        if (!formData.nombre?.trim() || !formData.apellido?.trim() || !formData.telefono?.trim() || !formData.grupo) {
            alert('Nombre, Apellido, Teléfono y Grupo son campos estrictamente obligatorios.');
            return;
        }

        setActionLoading(true);

        try {
            const slotsCount = Number(formData.slots_totales ?? formData.slots ?? 0);
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
                    setInvitados(prev => [data[0], ...prev]);
                }
            } else if (guestModal.mode === 'edit') {
                const { error } = await supabase.from('invitados').update({
                    nombre: formData.nombre.trim(),
                    apellido: formData.apellido.trim(),
                    telefono: formData.telefono.trim(),
                    email: formData.email?.trim() || null,
                    grupo: formData.grupo,
                    slots_totales: slotsCount,
                    puede_subir_fotos: Boolean(formData.puede_subir_fotos),
                }).eq('id', formData.id);

                if (error) throw error;
                setInvitados(prev => prev.map(inv => inv.id === formData.id ? {
                    ...inv,
                    ...formData,
                    slots_totales: slotsCount,
                    slots: slotsCount
                } : inv));
            }

            setGuestModal({ isOpen: false, mode: 'create', data: null });
        } catch (err) {
            console.error('Error saving guest:', err);
            alert('Error al guardar el invitado: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Edición de Asistente de Confirmación ──────────────────────────────
    const handleSaveAsistenteEdit = async (e) => {
        e.preventDefault();
        if (!editAsistenteItem) return;
        if (!editAsistenteItem.nombre_completo?.trim()) {
            alert('El nombre del asistente es obligatorio.');
            return;
        }
        setActionLoading(true);

        try {
            await supabase.from('confirmaciones').update({
                nombre_completo: editAsistenteItem.nombre_completo.trim(),
                plato_fuerte: editAsistenteItem.plato_fuerte,
                contornos: editAsistenteItem.contornos
            }).eq('id', editAsistenteItem.id);

            setConfirmaciones(prev => prev.map(c => c.id === editAsistenteItem.id ? editAsistenteItem : c));
            setEditAsistenteItem(null);
        } catch (err) {
            console.error('Error updating confirmacion:', err);
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Agregar Acompañante Manual a un Titular ───────────────────
    const handleAddAsistenteManual = async (e) => {
        e.preventDefault();
        if (!addAsistenteTitular) return;
        const nombre = addAsistenteTitular.nombreNuevo?.trim();
        if (!nombre) {
            alert('El nombre del acompañante es obligatorio.');
            return;
        }

        setActionLoading(true);
        try {
            const newAsistente = {
                invitado_id: addAsistenteTitular.id,
                nombre_completo: nombre,
                es_titular: false,
                plato_fuerte: addAsistenteTitular.plato_fuerte || null,
                contornos: addAsistenteTitular.contornos || []
            };

            const { data, error } = await supabase.from('confirmaciones').insert([newAsistente]).select();
            if (error) throw error;

            if (data && data[0]) {
                setConfirmaciones(prev => [...prev, data[0]]);
            }

            // Si el titular no tenía confirmed_at, marcarlo como confirmado
            if (!addAsistenteTitular.confirmed_at) {
                const nowIso = new Date().toISOString();
                await supabase.from('invitados').update({ confirmed_at: nowIso }).eq('id', addAsistenteTitular.id);
                setInvitados(prev => prev.map(i => i.id === addAsistenteTitular.id ? { ...i, confirmed_at: nowIso } : i));
            }

            setAddAsistenteTitular(null);
        } catch (err) {
            console.error('Error adding asistente:', err);
            alert('Error al agregar acompañante: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Eliminación / Reseteo con Integridad Garantizada ─────────────
    const handleDeleteConfirm = async () => {
        if (!deleteItem) return;
        setActionLoading(true);

        try {
            if (deleteItem.type === 'confirmacion') {
                // Borrar solo una confirmación individual (un acompañante)
                await supabase.from('confirmaciones').delete().eq('id', deleteItem.id);
                setConfirmaciones(prev => prev.filter(c => c.id !== deleteItem.id));
            } else if (deleteItem.type === 'reset_confirmacion') {
                // INTEGRIDAD ESTRICTA: Borrar confirmaciones de este titular y limpiar confirmed_at,
                // PERO NUNCA BORRAR EL INVITADO DE LA TABLA INVITADOS.
                await supabase.from('confirmaciones').delete().eq('invitado_id', deleteItem.id);
                await supabase.from('invitados').update({ confirmed_at: null }).eq('id', deleteItem.id);

                setConfirmaciones(prev => prev.filter(c => c.invitado_id !== deleteItem.id));
                setInvitados(prev => prev.map(i => i.id === deleteItem.id ? { ...i, confirmed_at: null } : i));
            } else if (deleteItem.type === 'titular') {
                // Borrado maestro de la lista de invitados (desde la tab de invitados)
                await supabase.from('invitados').delete().eq('id', deleteItem.id);
                setInvitados(prev => prev.filter(i => i.id !== deleteItem.id));
                setConfirmaciones(prev => prev.filter(c => c.invitado_id !== deleteItem.id));
            }
            setDeleteItem(null);
        } catch (err) {
            console.error('Error handling delete:', err);
            alert('Error al procesar la acción: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Gestión de Fotos ──────────────────────────────────────────
    const updateFotoEstado = async (id, estado) => {
        try {
            await supabase.from('fotos').update({ estado }).eq('id', id);
            setFotos(prev => prev.map(f => f.id === id ? { ...f, estado } : f));
        } catch (err) {
            console.error('Error updating foto:', err);
        }
    };

    // ─── Guardar Configuración Dinámica ────────────────────────────
    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setConfigSaveStatus({ loading: true, msg: null, error: false });
        const res = await saveConfig(configForm);
        if (res.success) {
            setConfigSaveStatus({ loading: false, msg: '¡Configuración guardada exitosamente en Supabase!', error: false });
            setTimeout(() => setConfigSaveStatus({ loading: false, msg: null, error: false }), 4000);
        } else {
            setConfigSaveStatus({ loading: false, msg: 'Error al guardar: ' + res.error, error: true });
        }
    };

    // ─── Agrupación y Cálculos de Totales ──────────────────────────
    const titularesAgrupados = invitados.map(titular => {
        const asistentes = confirmaciones.filter(c => c.invitado_id === titular.id);
        const fotosSubidas = fotos.filter(f => f.invitado_id === titular.id);
        return {
            titular,
            asistentes,
            fotosCount: fotosSubidas.length
        };
    }).filter(grupo => {
        if (grupoFilter === 'todos') return true;
        return grupo.titular.grupo === grupoFilter;
    });

    const fotosFiltradas = fotos.filter(f => {
        if (fotoFilter === 'todas') return true;
        return f.estado === fotoFilter;
    });

    // Totales calculados con precisión (1 titular + slots_totales)
    const totalPasesPotenciales = titularesAgrupados.reduce((acc, g) => {
        const s = Number(g.titular.slots_totales ?? g.titular.slots ?? 0);
        return acc + 1 + s;
    }, 0);
    const totalAsistentesConfirmados = titularesAgrupados.reduce((acc, g) => acc + g.asistentes.length, 0);

    return (
        <div className="min-h-screen bg-gray-50 p-3 md:p-6 font-body text-gray-800">
            <div className="max-w-7xl mx-auto">

                {/* Header Superior */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 bg-white p-4 md:p-5 rounded-xl shadow-xs border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 leading-tight">Panel de Administración</h1>
                            <p className="text-xs text-gray-500">Gestión de invitados, confirmaciones, fotos y configuración dinámica</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
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
                    </div>
                </div>

                {/* Tabs Principales */}
                <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-2">
                    <button
                        onClick={() => setTab('confirmaciones')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
                            tab === 'confirmaciones' ? 'bg-primary text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Users size={15} />
                        Confirmaciones ({totalAsistentesConfirmados} confirmados)
                    </button>

                    <button
                        onClick={() => setTab('invitados')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
                            tab === 'invitados' ? 'bg-primary text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <UserPlus size={15} />
                        Gestión de Invitados ({invitados.length} familias)
                    </button>

                    <button
                        onClick={() => setTab('fotos')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
                            tab === 'fotos' ? 'bg-primary text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <ImageIcon size={15} />
                        Fotos ({fotos.filter(f => f.estado === 'pendiente').length} pendientes)
                    </button>

                    <button
                        onClick={() => setTab('configuracion')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
                            tab === 'configuracion' ? 'bg-primary text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Settings size={15} />
                        ⚙️ Configuración del Evento
                    </button>
                </div>

                {/* ════════════════════════════════════════════════════════════
                    TAB 1: CONFIRMACIONES EN ÁRBOL (NESTED ROWS CON PROTECCIÓN)
                ════════════════════════════════════════════════════════════ */}
                {tab === 'confirmaciones' && (
                    <div className="space-y-3">
                        {/* Barra de Filtros, Acciones y Exportar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
                            {/* Filtro por Grupo Dinámico */}
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Grupo:</span>
                                <div className="flex gap-1">
                                    {[
                                        { id: 'todos', label: 'Todos' },
                                        { id: 'novia', label: nombreNovia },
                                        { id: 'novio', label: nombreNovio }
                                    ].map(g => (
                                        <button
                                            key={g.id}
                                            onClick={() => setGrupoFilter(g.id)}
                                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                                                grupoFilter === g.id
                                                    ? 'bg-gray-800 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Controles de Vista y Exportación */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleAllRows(true)}
                                    className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded border border-gray-200 cursor-pointer"
                                    title="Desplegar todos los acompañantes"
                                >
                                    Expandir todo
                                </button>
                                <button
                                    onClick={() => toggleAllRows(false)}
                                    className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded border border-gray-200 cursor-pointer"
                                    title="Colapsar todos los acompañantes"
                                >
                                    Colapsar
                                </button>

                                <button
                                    onClick={() => exportConfirmacionesToCSV(titularesAgrupados)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-bold transition-colors cursor-pointer ml-1"
                                >
                                    <Download size={13} />
                                    Exportar (.csv)
                                </button>
                            </div>
                        </div>

                        {/* TABLA PRINCIPAL CON NESTED ROWS Y FOOTER DE SUMATORIA */}
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
                                        {titularesAgrupados.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                                                    No se encontraron registros bajo este filtro.
                                                </td>
                                            </tr>
                                        ) : (
                                            titularesAgrupados.map(({ titular, asistentes, fotosCount }) => {
                                                const isExpanded = Boolean(expandedRows[titular.id]);
                                                const hasAsistentes = asistentes.length > 0;
                                                const slotsCount = Number(titular.slots_totales ?? titular.slots ?? 0);
                                                const totalPases = 1 + slotsCount;

                                                return (
                                                    <React.Fragment key={titular.id}>
                                                        {/* FILA PRINCIPAL (TITULAR) */}
                                                        <tr className={`hover:bg-gray-50/80 transition-colors ${isExpanded ? 'bg-gray-50/40' : ''}`}>
                                                            {/* Botón Expandir/Colapsar */}
                                                            <td className="px-3 py-2 text-center align-middle">
                                                                <button
                                                                    onClick={() => toggleRow(titular.id)}
                                                                    className="w-5 h-5 inline-flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:border-primary hover:text-primary transition-colors cursor-pointer bg-white"
                                                                    title={isExpanded ? 'Colapsar acompañantes' : 'Ver acompañantes'}
                                                                >
                                                                    {isExpanded ? <Minus size={11} /> : <Plus size={11} />}
                                                                </button>
                                                            </td>

                                                            {/* Nombre Titular */}
                                                            <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap align-middle">
                                                                {titular.nombre} {titular.apellido}
                                                            </td>

                                                            {/* Badge de Grupo */}
                                                            <td className="px-3 py-2 align-middle">
                                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                                    titular.grupo === 'novia'
                                                                        ? 'bg-pink-100 text-pink-700'
                                                                        : 'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                    {titular.grupo === 'novia' ? nombreNovia : nombreNovio}
                                                                </span>
                                                            </td>

                                                            {/* Teléfono */}
                                                            <td className="px-3 py-2 text-gray-600 font-mono text-[11px] align-middle">
                                                                {titular.telefono || '—'}
                                                            </td>

                                                            {/* Pases Totales Representados (1 titular + slots_totales) */}
                                                            <td className="px-3 py-2 font-medium text-gray-700 align-middle">
                                                                <span className="font-bold text-gray-900">{totalPases} pases</span>
                                                                <span className="text-gray-400 text-[10px] block">
                                                                    (Titular + {slotsCount})
                                                                </span>
                                                            </td>

                                                            {/* Asistentes Confirmados */}
                                                            <td className="px-3 py-2 align-middle">
                                                                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                                                    asistentes.length > 0
                                                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                                                        : 'bg-gray-100 text-gray-400'
                                                                }`}>
                                                                    {asistentes.length} / {totalPases} {asistentes.length === 1 ? 'persona' : 'personas'}
                                                                </span>
                                                            </td>

                                                            {/* Estado de Fotos */}
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

                                                            {/* Estado de confirmación */}
                                                            <td className="px-3 py-2 align-middle">
                                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                    titular.confirmed_at
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-gray-100 text-gray-500'
                                                                }`}>
                                                                    {titular.confirmed_at ? 'Confirmó' : 'Pendiente'}
                                                                </span>
                                                            </td>

                                                            {/* Acciones: INTEGRIDAD ESTRICTA (Reiniciar Confirmación, NUNCA borrar titular aquí) */}
                                                            <td className="px-3 py-2 text-right whitespace-nowrap align-middle">
                                                                {titular.confirmed_at ? (
                                                                    <button
                                                                        onClick={() => setDeleteItem({
                                                                            type: 'reset_confirmacion',
                                                                            id: titular.id,
                                                                            name: `${titular.nombre} ${titular.apellido}`
                                                                        })}
                                                                        className="inline-flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors cursor-pointer text-[10px] font-semibold border border-gray-200"
                                                                        title="Reiniciar datos de confirmación sin borrar el invitado"
                                                                    >
                                                                        <RotateCcw size={12} />
                                                                        Reiniciar
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-gray-300 text-[10px] italic">Sin confirmar</span>
                                                                )}
                                                            </td>
                                                        </tr>

                                                        {/* FILA ANIDADA (NESTED ROW) */}
                                                        {isExpanded && (
                                                            <tr className="bg-gray-50/70 border-b border-gray-100">
                                                                <td colSpan={9} className="p-0">
                                                                    <div className="py-2.5 pl-11 pr-4 space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                                                                Acompañantes y Asistencia ({asistentes.length} registrados)
                                                                            </span>
                                                                            {/* Botón para agregar acompañante faltante */}
                                                                            <button
                                                                                onClick={() => setAddAsistenteTitular({
                                                                                    ...titular,
                                                                                    nombreNuevo: '',
                                                                                    plato_fuerte: menu?.platosFuertes?.[0]?.nombre || '',
                                                                                    contornos: []
                                                                                })}
                                                                                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded text-[10px] font-bold transition-all cursor-pointer border border-primary/20"
                                                                            >
                                                                                <Plus size={12} />
                                                                                + Agregar Acompañante
                                                                            </button>
                                                                        </div>

                                                                        {!hasAsistentes ? (
                                                                            <div className="py-2 text-[11px] text-gray-400 italic">
                                                                                No ha confirmado asistentes todavía. Puedes agregar acompañantes manualmente con el botón de arriba.
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
                                                                                                    {asistente.nombre_completo}
                                                                                                </td>
                                                                                                <td className="py-1.5 px-3">
                                                                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                                                                        asistente.es_titular
                                                                                                            ? 'bg-gray-800 text-white'
                                                                                                            : 'bg-gray-100 text-gray-600'
                                                                                                    }`}>
                                                                                                        {asistente.es_titular ? 'Titular' : `Acomp. de ${titular.nombre}`}
                                                                                                    </span>
                                                                                                </td>
                                                                                                <td className="py-1.5 px-3 text-gray-700">
                                                                                                    {asistente.plato_fuerte || '—'}
                                                                                                </td>
                                                                                                <td className="py-1.5 px-3 text-gray-600">
                                                                                                    {(asistente.contornos || []).join(', ') || '—'}
                                                                                                </td>
                                                                                                <td className="py-1.5 px-3 text-right whitespace-nowrap">
                                                                                                    <div className="inline-flex items-center gap-1">
                                                                                                        <button
                                                                                                            onClick={() => setEditAsistenteItem(asistente)}
                                                                                                            className="p-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded cursor-pointer"
                                                                                                            title="Editar asistente"
                                                                                                        >
                                                                                                            <Edit2 size={13} />
                                                                                                        </button>
                                                                                                        <button
                                                                                                            onClick={() => setDeleteItem({
                                                                                                                type: 'confirmacion',
                                                                                                                id: asistente.id,
                                                                                                                name: asistente.nombre_completo
                                                                                                            })}
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

                                    {/* FOOTER CON SUMATORIA TOTAL */}
                                    {titularesAgrupados.length > 0 && (
                                        <tfoot className="bg-gray-100/90 font-bold text-gray-800 border-t-2 border-gray-300">
                                            <tr>
                                                <td className="px-3 py-2.5 text-center">∑</td>
                                                <td className="px-3 py-2.5 font-bold">
                                                    {titularesAgrupados.length} Familias / Titulares
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-gray-500 font-normal">Filtro: {grupoFilter}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-gray-400 font-normal">—</td>
                                                <td className="px-3 py-2.5 text-gray-900 font-bold">
                                                    {totalPasesPotenciales} pases en total
                                                </td>
                                                <td className="px-3 py-2.5 text-green-700 font-bold">
                                                    {totalAsistentesConfirmados} confirmados
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
                    TAB 2: GESTIÓN DE INVITADOS (CRUD + WHATSAPP CON PREVIEW)
                ════════════════════════════════════════════════════════════ */}
                {tab === 'invitados' && (
                    <div className="space-y-3">
                        {/* Barra de Filtros y Botón Nuevo Invitado */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Grupo:</span>
                                <div className="flex gap-1">
                                    {[
                                        { id: 'todos', label: 'Todos' },
                                        { id: 'novia', label: nombreNovia },
                                        { id: 'novio', label: nombreNovio }
                                    ].map(g => (
                                        <button
                                            key={g.id}
                                            onClick={() => setGrupoFilter(g.id)}
                                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                                                grupoFilter === g.id
                                                    ? 'bg-gray-800 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setGuestModal({
                                    isOpen: true,
                                    mode: 'create',
                                    data: {
                                        nombre: '',
                                        apellido: '',
                                        telefono: '',
                                        email: '',
                                        grupo: 'novia',
                                        slots_totales: 0,
                                        puede_subir_fotos: true,
                                    }
                                })}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-secondary text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                            >
                                <Plus size={14} />
                                Nuevo Invitado
                            </button>
                        </div>

                        {/* Tabla de Invitados */}
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
                                        {titularesAgrupados.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                                                    No hay invitados registrados en este grupo.
                                                </td>
                                            </tr>
                                        ) : (
                                            titularesAgrupados.map(({ titular }) => {
                                                const slotsCount = Number(titular.slots_totales ?? titular.slots ?? 0);
                                                const totalPases = 1 + slotsCount;
                                                const isCopied = copiedToken === titular.id;

                                                return (
                                                    <tr key={titular.id} className="hover:bg-gray-50/80 transition-colors">
                                                        <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                                                            {titular.nombre} {titular.apellido}
                                                        </td>

                                                        <td className="px-3 py-2">
                                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                                titular.grupo === 'novia'
                                                                    ? 'bg-pink-100 text-pink-700'
                                                                    : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {titular.grupo === 'novia' ? nombreNovia : nombreNovio}
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
                                                            <span className="text-[10px] text-gray-400">
                                                                (1 + {slotsCount})
                                                            </span>
                                                        </td>

                                                        <td className="px-3 py-2">
                                                            <span className={`text-[11px] font-semibold ${titular.puede_subir_fotos ? 'text-primary' : 'text-gray-400'}`}>
                                                                {titular.puede_subir_fotos ? 'Sí' : 'No'}
                                                            </span>
                                                        </td>

                                                        {/* Copiar Enlace con feedback */}
                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                            <button
                                                                onClick={() => copyInviteLink(titular.token, titular.id)}
                                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer border ${
                                                                    isCopied
                                                                        ? 'bg-green-50 border-green-300 text-green-700'
                                                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                                                }`}
                                                                title="Copiar enlace con token"
                                                            >
                                                                {isCopied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                                                {isCopied ? '¡Copiado!' : 'Copiar enlace'}
                                                            </button>
                                                        </td>

                                                        <td className="px-3 py-2">
                                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                titular.confirmed_at
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-gray-100 text-gray-500'
                                                                }`}>
                                                                {titular.confirmed_at ? 'Sí' : 'No'}
                                                            </span>
                                                        </td>

                                                        {/* Acciones: WhatsApp, Editar, Borrar */}
                                                        <td className="px-3 py-2 text-right whitespace-nowrap">
                                                            <div className="inline-flex items-center gap-1">
                                                                {/* Botón WhatsApp abre modal con preview */}
                                                                <button
                                                                    onClick={() => openWhatsAppModal(titular)}
                                                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer"
                                                                    title="Enviar invitación por WhatsApp"
                                                                >
                                                                    <MessageCircle size={15} />
                                                                </button>

                                                                {/* Editar datos del invitado */}
                                                                <button
                                                                    onClick={() => setGuestModal({
                                                                        isOpen: true,
                                                                        mode: 'edit',
                                                                        data: {
                                                                            ...titular,
                                                                            slots_totales: slotsCount
                                                                        }
                                                                    })}
                                                                    className="p-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                                                    title="Editar invitado"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>

                                                                {/* Eliminar invitado maestro de la lista */}
                                                                <button
                                                                    onClick={() => setDeleteItem({
                                                                        type: 'titular',
                                                                        id: titular.id,
                                                                        name: `${titular.nombre} ${titular.apellido}`
                                                                    })}
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
                        {/* Filtros de estado */}
                        <div className="flex gap-1.5 bg-white p-2.5 rounded-xl border border-gray-200">
                            {[
                                { id: 'todas', label: 'Todas', count: fotos.length },
                                { id: 'pendiente', label: 'Pendientes', count: fotos.filter(f => f.estado === 'pendiente').length },
                                { id: 'aprobada', label: 'Aprobadas', count: fotos.filter(f => f.estado === 'aprobada').length },
                                { id: 'rechazada', label: 'Rechazadas', count: fotos.filter(f => f.estado === 'rechazada').length },
                            ].map(filter => (
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
                                            <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                f.estado === 'aprobada' ? 'bg-green-600 text-white' :
                                                f.estado === 'rechazada' ? 'bg-red-600 text-white' : 'bg-yellow-500 text-white'
                                            }`}>
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
                    TAB 4: CONFIGURACIÓN DINÁMICA DEL EVENTO (SUPABASE)
                ════════════════════════════════════════════════════════════ */}
                {tab === 'configuracion' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 max-w-4xl space-y-6">
                        <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Configuración Global del Evento</h2>
                                <p className="text-xs text-gray-500">
                                    Todos los datos aquí editados se guardan en la tabla <code>configuracion</code> de Supabase y alimentan de inmediato la tarjeta y los formularios.
                                </p>
                            </div>
                            <button
                                onClick={reloadConfig}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5"
                            >
                                <RefreshCw size={13} /> Recargar
                            </button>
                        </div>

                        {configSaveStatus.msg && (
                            <div className={`p-3 rounded-lg text-xs font-bold ${
                                configSaveStatus.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                                {configSaveStatus.msg}
                            </div>
                        )}

                        <form onSubmit={handleSaveConfig} className="space-y-6">
                            {/* Sección: Nombres de los Novios y Contacto */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">1. Datos de los Novios</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                                    {/* Novia */}
                                    <div className="space-y-2">
                                        <span className="text-[11px] font-bold text-gray-600 uppercase">La Novia:</span>
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase">Nombre</label>
                                            <input
                                                type="text"
                                                value={configForm?.novios?.novia?.nombre || ''}
                                                onChange={(e) => setConfigForm({
                                                    ...configForm,
                                                    novios: {
                                                        ...configForm.novios,
                                                        novia: { ...configForm.novios?.novia, nombre: e.target.value }
                                                    }
                                                })}
                                                className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase">WhatsApp (con código país)</label>
                                            <input
                                                type="text"
                                                value={configForm?.novios?.novia?.whatsapp || ''}
                                                onChange={(e) => setConfigForm({
                                                    ...configForm,
                                                    novios: {
                                                        ...configForm.novios,
                                                        novia: { ...configForm.novios?.novia, whatsapp: e.target.value }
                                                    }
                                                })}
                                                className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white font-mono"
                                            />
                                        </div>
                                    </div>

                                    {/* Novio */}
                                    <div className="space-y-2">
                                        <span className="text-[11px] font-bold text-gray-600 uppercase">El Novio:</span>
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase">Nombre</label>
                                            <input
                                                type="text"
                                                value={configForm?.novios?.novio?.nombre || ''}
                                                onChange={(e) => setConfigForm({
                                                    ...configForm,
                                                    novios: {
                                                        ...configForm.novios,
                                                        novio: { ...configForm.novios?.novio, nombre: e.target.value }
                                                    }
                                                })}
                                                className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-500 uppercase">WhatsApp (con código país)</label>
                                            <input
                                                type="text"
                                                value={configForm?.novios?.novio?.whatsapp || ''}
                                                onChange={(e) => setConfigForm({
                                                    ...configForm,
                                                    novios: {
                                                        ...configForm.novios,
                                                        novio: { ...configForm.novios?.novio, whatsapp: e.target.value }
                                                    }
                                                })}
                                                className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sección: Fechas del Evento */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">2. Fechas Clave</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                                            Fecha de la Boda (ISO o YYYY-MM-DD):
                                        </label>
                                        <input
                                            type="text"
                                            value={configForm?.fecha || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, fecha: e.target.value })}
                                            className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white font-mono"
                                            placeholder="2026-12-19T17:00:00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                                            Fecha Límite para RSVP / Confirmación Menú:
                                        </label>
                                        <input
                                            type="text"
                                            value={configForm?.fechaLimiteRsvp || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, fechaLimiteRsvp: e.target.value })}
                                            className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white font-mono"
                                            placeholder="2026-11-30"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sección: Menú Gastronómico */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">3. Menú (Platos Fuertes y Contornos)</h3>
                                <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs">
                                    {/* Platos Fuertes */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1.5">
                                            Platos Fuertes Disponibles:
                                        </label>
                                        <div className="space-y-1.5">
                                            {(configForm?.menu?.platosFuertes || []).map((plato, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={plato.nombre}
                                                        onChange={(e) => {
                                                            const newPlatos = [...configForm.menu.platosFuertes];
                                                            newPlatos[idx] = { ...newPlatos[idx], nombre: e.target.value };
                                                            setConfigForm({ ...configForm, menu: { ...configForm.menu, platosFuertes: newPlatos } });
                                                        }}
                                                        className="flex-1 p-1.5 rounded border border-gray-300 bg-white"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newPlatos = configForm.menu.platosFuertes.filter((_, i) => i !== idx);
                                                            setConfigForm({ ...configForm, menu: { ...configForm.menu, platosFuertes: newPlatos } });
                                                        }}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                                        title="Eliminar plato"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newId = `plato_${Date.now()}`;
                                                    const newPlatos = [...(configForm?.menu?.platosFuertes || []), { id: newId, nombre: 'Nuevo Plato' }];
                                                    setConfigForm({ ...configForm, menu: { ...configForm.menu, platosFuertes: newPlatos } });
                                                }}
                                                className="text-[11px] font-bold text-primary hover:underline cursor-pointer pt-1"
                                            >
                                                + Añadir Plato Fuerte
                                            </button>
                                        </div>
                                    </div>

                                    {/* Contornos */}
                                    <div className="pt-3 border-t border-gray-200">
                                        <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1.5">
                                            Contornos / Guarniciones Disponibles:
                                        </label>
                                        <div className="space-y-1.5">
                                            {(configForm?.menu?.contornos || []).map((contorno, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={contorno.nombre}
                                                        onChange={(e) => {
                                                            const newContornos = [...configForm.menu.contornos];
                                                            newContornos[idx] = { ...newContornos[idx], nombre: e.target.value };
                                                            setConfigForm({ ...configForm, menu: { ...configForm.menu, contornos: newContornos } });
                                                        }}
                                                        className="flex-1 p-1.5 rounded border border-gray-300 bg-white"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newContornos = configForm.menu.contornos.filter((_, i) => i !== idx);
                                                            setConfigForm({ ...configForm, menu: { ...configForm.menu, contornos: newContornos } });
                                                        }}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                                        title="Eliminar contorno"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newId = `contorno_${Date.now()}`;
                                                    const newContornos = [...(configForm?.menu?.contornos || []), { id: newId, nombre: 'Nuevo Contorno' }];
                                                    setConfigForm({ ...configForm, menu: { ...configForm.menu, contornos: newContornos } });
                                                }}
                                                className="text-[11px] font-bold text-primary hover:underline cursor-pointer pt-1"
                                            >
                                                + Añadir Contorno
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={configSaveStatus.loading}
                                    className="px-6 py-2.5 bg-primary hover:bg-secondary text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                                >
                                    <Save size={15} />
                                    {configSaveStatus.loading ? 'Guardando en Supabase...' : 'Guardar Configuración en Supabase'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>

            {/* ════════════════════════════════════════════════════════════
                MODAL: AGREGAR ACOMPAÑANTE MANUAL A UN TITULAR
            ════════════════════════════════════════════════════════════ */}
            {addAsistenteTitular && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Agregar Acompañante</h3>
                                <p className="text-xs text-gray-500">
                                    Para el titular: <strong>{addAsistenteTitular.nombre} {addAsistenteTitular.apellido}</strong>
                                </p>
                            </div>
                            <button
                                onClick={() => setAddAsistenteTitular(null)}
                                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAddAsistenteManual} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                                    Nombre y Apellido del Acompañante *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: María Pérez"
                                    value={addAsistenteTitular.nombreNuevo || ''}
                                    onChange={(e) => setAddAsistenteTitular({
                                        ...addAsistenteTitular,
                                        nombreNuevo: e.target.value
                                    })}
                                    className="w-full p-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary focus:outline-none"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Plato Fuerte</label>
                                <select
                                    value={addAsistenteTitular.plato_fuerte || ''}
                                    onChange={(e) => setAddAsistenteTitular({
                                        ...addAsistenteTitular,
                                        plato_fuerte: e.target.value
                                    })}
                                    className="w-full p-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary focus:outline-none"
                                >
                                    {(menu?.platosFuertes || []).map(p => (
                                        <option key={p.id} value={p.nombre}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setAddAsistenteTitular(null)}
                                    className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-secondary transition-colors cursor-pointer"
                                >
                                    {actionLoading ? 'Guardando...' : 'Agregar Acompañante'}
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
                                        onChange={(e) => setGuestModal({
                                            ...guestModal,
                                            data: { ...guestModal.data, nombre: e.target.value }
                                        })}
                                        className="w-full p-2 rounded-lg border border-gray-300 text-xs focus:border-primary focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Apellido *</label>
                                    <input
                                        type="text"
                                        value={guestModal.data?.apellido || ''}
                                        onChange={(e) => setGuestModal({
                                            ...guestModal,
                                            data: { ...guestModal.data, apellido: e.target.value }
                                        })}
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
                                        onChange={(e) => setGuestModal({
                                            ...guestModal,
                                            data: { ...guestModal.data, telefono: e.target.value }
                                        })}
                                        className="w-full p-2 rounded-lg border border-gray-300 text-xs font-mono focus:border-primary focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Grupo *</label>
                                    <select
                                        value={guestModal.data?.grupo || 'novia'}
                                        onChange={(e) => setGuestModal({
                                            ...guestModal,
                                            data: { ...guestModal.data, grupo: e.target.value }
                                        })}
                                        className="w-full p-2 rounded-lg border border-gray-300 text-xs focus:border-primary focus:outline-none"
                                        required
                                    >
                                        <option value="novia">{nombreNovia} (Novia)</option>
                                        <option value="novio">{nombreNovio} (Novio)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Email (opcional)</label>
                                <input
                                    type="email"
                                    value={guestModal.data?.email || ''}
                                    onChange={(e) => setGuestModal({
                                        ...guestModal,
                                        data: { ...guestModal.data, email: e.target.value }
                                    })}
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
                                            max="10"
                                            value={guestModal.data?.slots_totales ?? guestModal.data?.slots ?? 0}
                                            onChange={(e) => setGuestModal({
                                                ...guestModal,
                                                data: {
                                                    ...guestModal.data,
                                                    slots_totales: parseInt(e.target.value) || 0,
                                                    slots: parseInt(e.target.value) || 0
                                                }
                                            })}
                                            className="w-24 p-2 rounded-lg border border-gray-300 text-xs font-bold focus:border-primary focus:outline-none"
                                            required
                                        />
                                        <span className="text-xs text-gray-600">
                                            = Total: <strong>{1 + (Number(guestModal.data?.slots_totales ?? guestModal.data?.slots) || 0)} personas</strong> (Titular + {guestModal.data?.slots_totales ?? guestModal.data?.slots ?? 0})
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-200">
                                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={guestModal.data?.puede_subir_fotos ?? true}
                                            onChange={(e) => setGuestModal({
                                                ...guestModal,
                                                data: { ...guestModal.data, puede_subir_fotos: e.target.checked }
                                            })}
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
                MODAL: EDITAR ASISTENTE
            ════════════════════════════════════════════════════════════ */}
            {editAsistenteItem && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-bold">Editar Asistente</h3>
                            <button onClick={() => setEditAsistenteItem(null)} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAsistenteEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nombre Completo *</label>
                                <input
                                    type="text"
                                    value={editAsistenteItem.nombre_completo}
                                    onChange={(e) => setEditAsistenteItem({ ...editAsistenteItem, nombre_completo: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Plato Fuerte</label>
                                <select
                                    value={editAsistenteItem.plato_fuerte || ''}
                                    onChange={(e) => setEditAsistenteItem({ ...editAsistenteItem, plato_fuerte: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary focus:outline-none"
                                >
                                    <option value="">Selecciona plato</option>
                                    {(menu?.platosFuertes || []).map(p => (
                                        <option key={p.id} value={p.nombre}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setEditAsistenteItem(null)}
                                    className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-secondary transition-colors cursor-pointer"
                                >
                                    {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
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
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                            deleteItem.type === 'reset_confirmacion' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                        }`}>
                            {deleteItem.type === 'reset_confirmacion' ? <RotateCcw size={24} /> : <AlertTriangle size={24} />}
                        </div>

                        <h3 className="text-base font-bold text-gray-900 mb-1">
                            {deleteItem.type === 'reset_confirmacion' ? '¿Reiniciar confirmación?' : '¿Estás seguro de eliminar?'}
                        </h3>

                        <p className="text-xs text-gray-500 mb-4">
                            {deleteItem.type === 'reset_confirmacion' ? (
                                <>
                                    Se borrarán las respuestas de asistencia y menú de <strong>{deleteItem.name}</strong> y sus acompañantes.
                                    <br />
                                    <strong className="text-green-600">El invitado permanecerá intacto en la lista de invitados</strong> para que pueda volver a confirmar.
                                </>
                            ) : deleteItem.type === 'titular' ? (
                                <>
                                    Estás a punto de borrar al invitado <strong>{deleteItem.name}</strong> definitivamente de la base de datos de invitados.
                                    <br />
                                    <span className="text-red-500 font-semibold">Esta acción no tiene vuelta atrás.</span>
                                </>
                            ) : (
                                <>
                                    Estás a punto de eliminar a <strong>{deleteItem.name}</strong> de los acompañantes confirmados.
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
                                {actionLoading ? 'Procesando...' : deleteItem.type === 'reset_confirmacion' ? 'Sí, reiniciar' : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminPanel;
