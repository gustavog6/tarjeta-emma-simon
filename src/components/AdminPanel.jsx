import React, { useState, useEffect } from 'react';
import {
    Check, X, Shield, Users, Image as ImageIcon, RefreshCw,
    Download, FileText, MessageCircle, Edit2, Trash2, AlertTriangle, RotateCcw,
    Plus, Minus, Camera, UserPlus, Copy, Settings, LogOut, UserCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { exportRsvpToXlsx } from '../utils/exportExcel';
import { exportRsvpToPdf } from '../utils/exportPdf';
import { useEventConfig } from '../context/EventConfigContext';
import { formatLongDate } from '../utils/dateUtils';
import {
    getMenuItemLabel,
    getCanonicalId,
    getAttendeeNames,
    getAttendeeFullName,
} from '../utils/menuUtils';
import { getGroupLabel, getGroupBadgeClass } from '../utils/groupUtils';
import { formatDbError } from '../utils/errorMessages';
import { formatHostsNames, interpolateTemplate } from '../config/eventPresets';
import { EVENT_LIMITS } from '../config/eventLimits';
import { GALLERY_BUCKET, resolvePhotoPublicUrl } from './Gallery';
import ConfigTab from './ConfigTab';

const DEFAULT_WA_TEMPLATE =
    '¡Hola {guest_name}! Nos alegra invitarte a compartir este momento especial. Esta invitación es válida para {passes}. Por favor confírmanos tu asistencia y selección de menú antes del {rsvp_deadline}. ¡Te esperamos! {hosts} ✨\n\n{link}';

const PHOTO_STATUS_LABELS = {
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
};

const AdminPanel = ({ user, onLogout }) => {
    const { config } = useEventConfig();
    const [tab, setTab] = useState('confirmations'); // 'confirmations' | 'guests' | 'photos' | 'settings'
    const [photoFilter, setPhotoFilter] = useState('pending'); // 'all' | 'pending' | 'approved' | 'rejected'
    const [groupFilter, setGroupFilter] = useState('all'); // 'all' | group.id
    const [expandedRows, setExpandedRows] = useState({});

    const [guests, setGuests] = useState([]);
    const [attendees, setAttendees] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bannerError, setBannerError] = useState(null);

    // Modals
    const [attendeeModal, setAttendeeModal] = useState(null);
    // { mode: 'create' | 'edit', primaryGuest, id?, isPrimary, firstName, lastName, mainCourseId, sideIds: [] }
    const [guestModal, setGuestModal] = useState({ isOpen: false, mode: 'create', data: null });
    const [whatsAppModal, setWhatsAppModal] = useState({ isOpen: false, guest: null, message: '', phone: '' });
    const [deleteItem, setDeleteItem] = useState(null);
    // { type: 'attendee' | 'guest' | 'reset_rsvp', id, guestId?, name, extraInfo? }
    const [actionLoading, setActionLoading] = useState(false);
    const [copiedToken, setCopiedToken] = useState(null);

    const { hosts, rsvpDeadline, menu, publicUrl, whatsappTemplate, groups = [] } = config;
    const hostsDisplay = formatHostsNames(hosts);
    const defaultGroupId = groups[0]?.id || 'group-a';
    const mainCoursesList = menu?.mainCourses || [];
    const sidesList = menu?.sides || [];
    const maxSides = menu?.maxSides ?? 2;

    const deadlineLabel = formatLongDate(rsvpDeadline);
    const publicBaseUrl = (publicUrl || window.location.origin).replace(/\/+$/, '');

    const loadData = async () => {
        if (!supabase) return;
        setLoading(true);
        setBannerError(null);

        try {
            const [guestsRes, attendeesRes, photosRes] = await Promise.all([
                supabase.from('guests').select('*').order('created_at', { ascending: false }),
                supabase.from('rsvp_attendees').select('*').order('created_at', { ascending: true }),
                supabase.from('gallery_photos').select('*, guests(first_name, last_name)').order('created_at', { ascending: false }),
            ]);

            if (guestsRes.error) throw guestsRes.error;
            if (attendeesRes.error) throw attendeesRes.error;
            if (photosRes.error) throw photosRes.error;

            if (guestsRes.data) {
                setGuests(guestsRes.data);
                setExpandedRows((prev) => {
                    const next = { ...prev };
                    guestsRes.data.forEach((g) => {
                        if (next[g.id] === undefined) next[g.id] = true;
                    });
                    return next;
                });
            }
            if (attendeesRes.data) setAttendees(attendeesRes.data);
            if (photosRes.data) {
                const mapped = photosRes.data.map((p) => ({
                    ...p,
                    url: resolvePhotoPublicUrl(p.storage_path),
                }));
                setPhotos(mapped);
            }
        } catch (err) {
            console.error('[AdminPanel] Error loading data:', err);
            setBannerError(formatDbError(err));
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
        guests.forEach((g) => { next[g.id] = expand; });
        setExpandedRows(next);
    };

    const copyInviteLink = (token, id) => {
        const link = `${publicBaseUrl}/?ref=${token}`;
        navigator.clipboard.writeText(link);
        setCopiedToken(id);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    // ─── Editable WhatsApp Preview Modal ───────────────────────────
    const openWhatsAppModal = (guest) => {
        const extraPasses = Number(guest.extra_passes ?? 0);
        const totalPasses = 1 + extraPasses;
        const passesTxt = `${totalPasses} persona${totalPasses > 1 ? 's' : ''}`;
        const inviteLink = `${publicBaseUrl}/?ref=${guest.access_token}`;

        const tpl = whatsappTemplate || DEFAULT_WA_TEMPLATE;
        const message = interpolateTemplate(tpl, {
            guestName: guest.first_name || '',
            passes: passesTxt,
            rsvpDeadline: deadlineLabel || '',
            hosts: hostsDisplay,
            link: inviteLink,
        });

        setWhatsAppModal({
            isOpen: true,
            guest,
            phone: (guest.phone || '').replace(/[^0-9]/g, ''),
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
        setWhatsAppModal({ isOpen: false, guest: null, message: '', phone: '' });
    };

    // ─── Create / Update Primary Guest ─────────────────────────────
    const handleSaveGuest = async (e) => {
        e.preventDefault();
        const formData = guestModal.data;

        if (!formData.first_name?.trim() || !formData.last_name?.trim() || !formData.phone?.trim() || !formData.group_id) {
            alert('Nombre, Apellido, Teléfono y Grupo son campos estrictamente obligatorios.');
            return;
        }

        const extraPassesCount = Math.min(
            EVENT_LIMITS.rsvp.extraPassesMax,
            Math.max(0, Number(formData.extra_passes ?? 0))
        );

        // Prevent reducing extra_passes below already confirmed attendee count
        if (guestModal.mode === 'edit') {
            const currentConfirmed = attendees.filter((a) => a.guest_id === formData.id).length;
            if (1 + extraPassesCount < currentConfirmed) {
                alert(
                    `Este invitado ya tiene ${currentConfirmed} persona(s) confirmada(s). No puedes reducir su capacidad a ${1 + extraPassesCount}. Elimina primero los asistentes sobrantes.`
                );
                return;
            }
        }

        setActionLoading(true);
        try {
            if (guestModal.mode === 'create') {
                const newRow = {
                    first_name: formData.first_name.trim(),
                    last_name: formData.last_name.trim(),
                    phone: formData.phone.trim(),
                    email: formData.email?.trim() || null,
                    group_id: formData.group_id,
                    extra_passes: extraPassesCount,
                    can_upload_photos: Boolean(formData.can_upload_photos),
                };
                const { data, error } = await supabase.from('guests').insert([newRow]).select();
                if (error) throw error;
                if (data && data[0]) {
                    setGuests((prev) => [data[0], ...prev]);
                    setExpandedRows((prev) => ({ ...prev, [data[0].id]: true }));
                }
            } else if (guestModal.mode === 'edit') {
                const { data, error } = await supabase
                    .from('guests')
                    .update({
                        first_name: formData.first_name.trim(),
                        last_name: formData.last_name.trim(),
                        phone: formData.phone.trim(),
                        email: formData.email?.trim() || null,
                        group_id: formData.group_id,
                        extra_passes: extraPassesCount,
                        can_upload_photos: Boolean(formData.can_upload_photos),
                    })
                    .eq('id', formData.id)
                    .select();

                if (error) throw error;
                const updated = data?.[0];
                setGuests((prev) =>
                    prev.map((g) =>
                        g.id === formData.id
                            ? updated || { ...g, ...formData, extra_passes: extraPassesCount }
                            : g
                    )
                );
            }

            setGuestModal({ isOpen: false, mode: 'create', data: null });
        } catch (err) {
            console.error('Error saving guest:', err);
            alert(formatDbError(err));
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Attendee Modal (Add Companion / Re-add Primary / Edit) ────
    const openCreateAttendee = (primaryGuest, isPrimary = false) => {
        setAttendeeModal({
            mode: 'create',
            primaryGuest,
            isPrimary,
            firstName: isPrimary ? primaryGuest.first_name : '',
            lastName: isPrimary ? primaryGuest.last_name : '',
            mainCourseId: mainCoursesList[0]?.id || '',
            sideIds: [],
        });
    };

    const openEditAttendee = (primaryGuest, attendee) => {
        const { firstName, lastName } = getAttendeeNames(attendee);
        setAttendeeModal({
            mode: 'edit',
            primaryGuest,
            id: attendee.id,
            isPrimary: Boolean(attendee.is_primary),
            firstName,
            lastName,
            mainCourseId: getCanonicalId(mainCoursesList, attendee.main_course_id) || '',
            sideIds: (attendee.side_ids || []).map((s) => getCanonicalId(sidesList, s)),
        });
    };

    const toggleModalSide = (sideId) => {
        setAttendeeModal((prev) => {
            if (!prev) return prev;
            const exists = prev.sideIds.includes(sideId);
            if (exists) {
                return { ...prev, sideIds: prev.sideIds.filter((id) => id !== sideId) };
            }
            if (prev.sideIds.length >= maxSides) return prev;
            return { ...prev, sideIds: [...prev.sideIds, sideId] };
        });
    };

    const handleSaveAttendee = async (e) => {
        e.preventDefault();
        if (!attendeeModal) return;

        const firstName = attendeeModal.firstName?.trim();
        const lastName = attendeeModal.lastName?.trim();
        if (!firstName || !lastName) {
            alert('Nombre y Apellido son obligatorios.');
            return;
        }
        if (!attendeeModal.mainCourseId) {
            alert('Debes seleccionar un plato fuerte.');
            return;
        }
        if (maxSides > 0 && sidesList.length > 0 && attendeeModal.sideIds.length < 1) {
            alert(`Debes seleccionar al menos 1 contorno (máximo ${maxSides}).`);
            return;
        }

        setActionLoading(true);
        try {
            const fullName = `${firstName} ${lastName}`;

            if (attendeeModal.mode === 'create') {
                const payload = {
                    guest_id: attendeeModal.primaryGuest.id,
                    first_name: firstName,
                    last_name: lastName,
                    full_name: fullName,
                    is_primary: Boolean(attendeeModal.isPrimary),
                    main_course_id: attendeeModal.mainCourseId,
                    side_ids: attendeeModal.sideIds,
                };
                const { data, error } = await supabase.from('rsvp_attendees').insert([payload]).select();
                if (error) throw error;

                if (data && data[0]) {
                    setAttendees((prev) => [...prev, data[0]]);
                }
                if (!attendeeModal.primaryGuest.confirmed_at) {
                    const nowIso = new Date().toISOString();
                    setGuests((prev) =>
                        prev.map((g) => (g.id === attendeeModal.primaryGuest.id ? { ...g, confirmed_at: nowIso } : g))
                    );
                }
            } else {
                const payload = {
                    first_name: firstName,
                    last_name: lastName,
                    full_name: fullName,
                    main_course_id: attendeeModal.mainCourseId,
                    side_ids: attendeeModal.sideIds,
                };
                const { data, error } = await supabase
                    .from('rsvp_attendees')
                    .update(payload)
                    .eq('id', attendeeModal.id)
                    .select();
                if (error) throw error;

                const updated = data?.[0];
                setAttendees((prev) =>
                    prev.map((a) => (a.id === attendeeModal.id ? updated || { ...a, ...payload } : a))
                );
            }

            setAttendeeModal(null);
        } catch (err) {
            console.error('Error saving attendee:', err);
            alert(formatDbError(err));
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Delete / Reset Actions with Referential Integrity ─────────
    const handleDeleteConfirm = async () => {
        if (!deleteItem) return;
        setActionLoading(true);

        try {
            if (deleteItem.type === 'attendee') {
                const { error } = await supabase.from('rsvp_attendees').delete().eq('id', deleteItem.id);
                if (error) throw error;

                const remaining = attendees.filter((a) => a.id !== deleteItem.id);
                setAttendees(remaining);

                // If 0 attendees remain for that guest, clear confirmed_at in local state (DB trigger handles the row)
                const stillHasAttendees = remaining.some((a) => a.guest_id === deleteItem.guestId);
                if (!stillHasAttendees && deleteItem.guestId) {
                    setGuests((prev) =>
                        prev.map((g) => (g.id === deleteItem.guestId ? { ...g, confirmed_at: null } : g))
                    );
                }
            } else if (deleteItem.type === 'reset_rsvp') {
                // Atomic RPC: deletes rsvp_attendees and clears confirmed_at; NEVER deletes the guest
                const { error } = await supabase.rpc('reset_guest_rsvp', {
                    p_guest_id: deleteItem.id,
                });
                if (error) throw error;

                setAttendees((prev) => prev.filter((a) => a.guest_id !== deleteItem.id));
                setGuests((prev) => prev.map((g) => (g.id === deleteItem.id ? { ...g, confirmed_at: null } : g)));
            } else if (deleteItem.type === 'guest') {
                // Remove uploaded storage files first to prevent orphaned objects
                const guestPhotos = photos.filter((p) => p.guest_id === deleteItem.id);
                if (guestPhotos.length > 0) {
                    const currentBucketPaths = guestPhotos
                        .map((p) => p.storage_path)
                        .filter((sp) => sp && !sp.startsWith('legacy:'));
                    const legacyBucketPaths = guestPhotos
                        .map((p) => p.storage_path)
                        .filter((sp) => sp && sp.startsWith('legacy:'))
                        .map((sp) => sp.slice(7));

                    if (currentBucketPaths.length > 0) {
                        await supabase.storage.from(GALLERY_BUCKET).remove(currentBucketPaths);
                    }
                    if (legacyBucketPaths.length > 0) {
                        await supabase.storage.from('galeria').remove(legacyBucketPaths);
                    }
                }

                const { error } = await supabase.from('guests').delete().eq('id', deleteItem.id);
                if (error) throw error;

                setGuests((prev) => prev.filter((g) => g.id !== deleteItem.id));
                setAttendees((prev) => prev.filter((a) => a.guest_id !== deleteItem.id));
                setPhotos((prev) => prev.filter((p) => p.guest_id !== deleteItem.id));
            }
            setDeleteItem(null);
        } catch (err) {
            console.error('Error handling delete:', err);
            alert(formatDbError(err));
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Photo Moderation ──────────────────────────────────────────
    const updatePhotoStatus = async (id, status) => {
        try {
            const { error } = await supabase.from('gallery_photos').update({ status }).eq('id', id);
            if (error) throw error;
            setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
        } catch (err) {
            console.error('Error updating photo status:', err);
            alert(formatDbError(err));
        }
    };

    // ─── Grouping & Totals ─────────────────────────────────────────
    const allGroups = guests
        .map((guest) => {
            const guestAttendees = attendees.filter((a) => a.guest_id === guest.id);
            const guestPhotos = photos.filter((p) => p.guest_id === guest.id);
            return {
                guest,
                attendees: guestAttendees,
                photosCount: guestPhotos.length,
            };
        })
        .filter((item) => {
            if (groupFilter === 'all') return true;
            return item.guest.group_id === groupFilter;
        });

    // Confirmations Tab: ONLY guests who have confirmed or have registered attendees
    const confirmedGroups = allGroups.filter(
        ({ guest, attendees: guestAttendees }) => Boolean(guest.confirmed_at) || guestAttendees.length > 0
    );

    const filteredPhotos = photos.filter((p) => {
        if (photoFilter === 'all') return true;
        return p.status === photoFilter;
    });

    const totalAssignedPasses = confirmedGroups.reduce((acc, g) => {
        const extra = Number(g.guest.extra_passes ?? 0);
        return acc + 1 + extra;
    }, 0);
    const totalConfirmedAttendees = confirmedGroups.reduce((acc, g) => acc + g.attendees.length, 0);

    return (
        <div className="admin-panel min-h-screen bg-gray-50 p-3 md:p-6 font-body text-gray-800">
            <div className="max-w-7xl mx-auto">

                {/* Top Header */}
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

                {/* Main Tabs */}
                <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-2">
                    <button
                        onClick={() => setTab('confirmations')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
                            tab === 'confirmations' ? 'bg-primary text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Users size={15} />
                        Confirmaciones ({totalConfirmedAttendees})
                    </button>

                    <button
                        onClick={() => setTab('guests')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
                            tab === 'guests' ? 'bg-primary text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <UserPlus size={15} />
                        Gestión de Invitados ({guests.length})
                    </button>

                    <button
                        onClick={() => setTab('photos')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
                            tab === 'photos' ? 'bg-primary text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <ImageIcon size={15} />
                        Fotos ({photos.filter((p) => p.status === 'pending').length} pendientes)
                    </button>

                    <button
                        onClick={() => setTab('settings')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
                            tab === 'settings' ? 'bg-primary text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Settings size={15} />
                        Configuración
                    </button>
                </div>

                {/* ════════════════════════════════════════════════════════════
                    TAB 1: CONFIRMACIONES EN ÁRBOL (NESTED ROWS)
                ════════════════════════════════════════════════════════════ */}
                {tab === 'confirmations' && (
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Grupo:</span>
                                <div className="flex flex-wrap gap-1">
                                    {[
                                        { id: 'all', name: 'Todos' },
                                        ...groups,
                                    ].map((g) => (
                                        <button
                                            key={g.id}
                                            onClick={() => setGroupFilter(g.id)}
                                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                                                groupFilter === g.id
                                                    ? 'bg-gray-800 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {g.name}
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
                                    onClick={() => exportRsvpToXlsx(confirmedGroups, config, groupFilter)}
                                    disabled={confirmedGroups.length === 0}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                                >
                                    <Download size={13} />
                                    Excel (.xlsx)
                                </button>
                                <button
                                    onClick={() => exportRsvpToPdf(confirmedGroups, config, groupFilter)}
                                    disabled={confirmedGroups.length === 0}
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
                                        {confirmedGroups.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                                                    Aún no hay confirmaciones registradas bajo este filtro.
                                                </td>
                                            </tr>
                                        ) : (
                                            confirmedGroups.map(({ guest, attendees: guestAttendees, photosCount }) => {
                                                const extraPasses = Number(guest.extra_passes ?? 0);
                                                const totalPasses = 1 + extraPasses;
                                                const hasAttendees = guestAttendees.length > 0;
                                                const hasPrimaryRow = guestAttendees.some((a) => a.is_primary);
                                                const isFull = guestAttendees.length >= totalPasses;
                                                // Single-pass guests with at most 1 attendee render inline instead of nested table
                                                const usesNested = extraPasses > 0 || guestAttendees.length > 1;
                                                const isExpanded = usesNested && Boolean(expandedRows[guest.id]);
                                                const singleAttendee = !usesNested ? guestAttendees[0] : null;

                                                return (
                                                    <React.Fragment key={guest.id}>
                                                        <tr className={`hover:bg-gray-50/80 transition-colors ${isExpanded ? 'bg-gray-50/40' : ''}`}>
                                                            <td className="px-3 py-2 text-center align-middle">
                                                                {usesNested ? (
                                                                    <button
                                                                        onClick={() => toggleRow(guest.id)}
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
                                                                    {guest.first_name} {guest.last_name}
                                                                </div>
                                                                {singleAttendee && (
                                                                    <div className="text-[10px] text-gray-500 mt-0.5">
                                                                        <span className="font-medium text-gray-700">
                                                                            {getMenuItemLabel(mainCoursesList, singleAttendee.main_course_id)}
                                                                        </span>
                                                                        {(singleAttendee.side_ids || []).length > 0 && (
                                                                            <> · {(singleAttendee.side_ids || []).map((id) => getMenuItemLabel(sidesList, id)).join(', ')}</>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>

                                                            <td className="px-3 py-2 align-middle">
                                                                <span
                                                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getGroupBadgeClass(groups, guest.group_id)}`}
                                                                >
                                                                    {getGroupLabel(groups, guest.group_id)}
                                                                </span>
                                                            </td>

                                                            <td className="px-3 py-2 text-gray-600 font-mono text-[11px] align-middle">
                                                                {guest.phone || '—'}
                                                            </td>

                                                            <td className="px-3 py-2 font-medium text-gray-700 align-middle">
                                                                <span className="font-bold text-gray-900">{totalPasses} pases</span>
                                                                <span className="text-gray-400 text-[10px] block">
                                                                    (Titular + {extraPasses})
                                                                </span>
                                                            </td>

                                                            <td className="px-3 py-2 align-middle">
                                                                <span
                                                                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                                                        guestAttendees.length > 0
                                                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                                                            : 'bg-gray-100 text-gray-400'
                                                                    }`}
                                                                >
                                                                    {guestAttendees.length} / {totalPasses}
                                                                </span>
                                                            </td>

                                                            <td className="px-3 py-2 text-gray-600 align-middle">
                                                                {photosCount > 0 ? (
                                                                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                                                                        <Camera size={12} /> {photosCount}
                                                                    </span>
                                                                ) : guest.can_upload_photos ? (
                                                                    <span className="text-gray-400 text-[11px]">Permitido</span>
                                                                ) : (
                                                                    <span className="text-gray-300 text-[11px]">No</span>
                                                                )}
                                                            </td>

                                                            <td className="px-3 py-2 align-middle">
                                                                <span
                                                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                        guest.confirmed_at
                                                                            ? 'bg-green-100 text-green-700'
                                                                            : 'bg-gray-100 text-gray-500'
                                                                    }`}
                                                                >
                                                                    {guest.confirmed_at ? 'Confirmó' : 'Pendiente'}
                                                                </span>
                                                            </td>

                                                            <td className="px-3 py-2 text-right whitespace-nowrap align-middle">
                                                                <div className="inline-flex items-center gap-1.5 justify-end">
                                                                    {singleAttendee && (
                                                                        <button
                                                                            onClick={() => openEditAttendee(guest, singleAttendee)}
                                                                            className="p-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                                                            title="Editar menú del asistente"
                                                                        >
                                                                            <Edit2 size={13} />
                                                                        </button>
                                                                    )}
                                                                    {guest.confirmed_at || hasAttendees ? (
                                                                        <button
                                                                            onClick={() =>
                                                                                setDeleteItem({
                                                                                    type: 'reset_rsvp',
                                                                                    id: guest.id,
                                                                                    name: `${guest.first_name} ${guest.last_name}`,
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

                                                        {/* NESTED ROW */}
                                                        {isExpanded && (
                                                            <tr className="bg-gray-50/70 border-b border-gray-100">
                                                                <td colSpan={9} className="p-0">
                                                                    <div className="py-2.5 pl-11 pr-4 space-y-2">
                                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                                                                Asistentes ({guestAttendees.length} / {totalPasses})
                                                                            </span>

                                                                            <div className="flex items-center gap-2">
                                                                                {!hasPrimaryRow && !isFull && (
                                                                                    <button
                                                                                        onClick={() => openCreateAttendee(guest, true)}
                                                                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-800 text-white hover:bg-gray-700 rounded text-[10px] font-bold transition-all cursor-pointer"
                                                                                    >
                                                                                        <UserCheck size={12} />
                                                                                        Agregar Titular
                                                                                    </button>
                                                                                )}

                                                                                <button
                                                                                    onClick={() => openCreateAttendee(guest, false)}
                                                                                    disabled={isFull}
                                                                                    title={isFull ? `Cupo lleno (${totalPasses}/${totalPasses})` : 'Agregar acompañante'}
                                                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold transition-all border ${
                                                                                        isFull
                                                                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                                                            : 'bg-primary/10 text-primary hover:bg-primary hover:text-white border-primary/20 cursor-pointer'
                                                                                    }`}
                                                                                >
                                                                                    <Plus size={12} />
                                                                                    {isFull ? 'Cupo lleno' : 'Agregar Acompañante'}
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {!hasAttendees ? (
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
                                                                                        {guestAttendees.map((attendee, idx) => (
                                                                                            <tr key={attendee.id} className="hover:bg-primary/5 transition-colors">
                                                                                                <td className="py-1.5 px-3 text-gray-400 font-mono">
                                                                                                    {idx + 1}
                                                                                                </td>
                                                                                                <td className="py-1.5 px-3 font-semibold text-gray-800">
                                                                                                    {getAttendeeFullName(attendee)}
                                                                                                </td>
                                                                                                <td className="py-1.5 px-3">
                                                                                                    <span
                                                                                                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                                                                            attendee.is_primary
                                                                                                                ? 'bg-gray-800 text-white'
                                                                                                                : 'bg-gray-100 text-gray-600'
                                                                                                        }`}
                                                                                                    >
                                                                                                        {attendee.is_primary ? 'Titular' : `Acomp. de ${guest.first_name}`}
                                                                                                    </span>
                                                                                                </td>
                                                                                                <td className="py-1.5 px-3 text-gray-700">
                                                                                                    {getMenuItemLabel(mainCoursesList, attendee.main_course_id)}
                                                                                                </td>
                                                                                                <td className="py-1.5 px-3 text-gray-600">
                                                                                                    {(attendee.side_ids || [])
                                                                                                        .map((id) => getMenuItemLabel(sidesList, id))
                                                                                                        .join(', ') || '—'}
                                                                                                </td>
                                                                                                <td className="py-1.5 px-3 text-right whitespace-nowrap">
                                                                                                    <div className="inline-flex items-center gap-1">
                                                                                                        <button
                                                                                                            onClick={() => openEditAttendee(guest, attendee)}
                                                                                                            className="p-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded cursor-pointer"
                                                                                                            title="Editar asistente"
                                                                                                        >
                                                                                                            <Edit2 size={13} />
                                                                                                        </button>
                                                                                                        <button
                                                                                                            onClick={() =>
                                                                                                                setDeleteItem({
                                                                                                                    type: 'attendee',
                                                                                                                    id: attendee.id,
                                                                                                                    guestId: guest.id,
                                                                                                                    name: getAttendeeFullName(attendee),
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

                                    {confirmedGroups.length > 0 && (
                                        <tfoot className="bg-gray-100/90 font-bold text-gray-800 border-t-2 border-gray-300">
                                            <tr>
                                                <td className="px-3 py-2.5 text-center">∑</td>
                                                <td className="px-3 py-2.5 font-bold">
                                                    {confirmedGroups.length} Invitaciones confirmadas
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-gray-500 font-normal">
                                                        Filtro: {groupFilter === 'all' ? 'Todos' : getGroupLabel(groups, groupFilter)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5 text-gray-400 font-normal">—</td>
                                                <td className="px-3 py-2.5 text-gray-900 font-bold">
                                                    {totalAssignedPasses} pases asignados
                                                </td>
                                                <td className="px-3 py-2.5 text-green-700 font-bold">
                                                    {totalConfirmedAttendees} asistentes
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
                {tab === 'guests' && (
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Grupo:</span>
                                <div className="flex flex-wrap gap-1">
                                    {[
                                        { id: 'all', name: 'Todos' },
                                        ...groups,
                                    ].map((g) => (
                                        <button
                                            key={g.id}
                                            onClick={() => setGroupFilter(g.id)}
                                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                                                groupFilter === g.id
                                                    ? 'bg-gray-800 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {g.name}
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
                                            first_name: '',
                                            last_name: '',
                                            phone: '',
                                            email: '',
                                            group_id: defaultGroupId,
                                            extra_passes: 0,
                                            can_upload_photos: true,
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
                                        {allGroups.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                                                    No hay invitados registrados en este grupo.
                                                </td>
                                            </tr>
                                        ) : (
                                            allGroups.map(({ guest, attendees: guestAttendees, photosCount }) => {
                                                const extraPasses = Number(guest.extra_passes ?? 0);
                                                const totalPasses = 1 + extraPasses;
                                                const isCopied = copiedToken === guest.id;

                                                return (
                                                    <tr key={guest.id} className="hover:bg-gray-50/80 transition-colors">
                                                        <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                                                            {guest.first_name} {guest.last_name}
                                                        </td>

                                                        <td className="px-3 py-2">
                                                            <span
                                                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getGroupBadgeClass(groups, guest.group_id)}`}
                                                            >
                                                                {getGroupLabel(groups, guest.group_id)}
                                                            </span>
                                                        </td>

                                                        <td className="px-3 py-2 text-gray-600 font-mono text-[11px]">
                                                            {guest.phone || '—'}
                                                        </td>

                                                        <td className="px-3 py-2 text-gray-500">
                                                            {guest.email || '—'}
                                                        </td>

                                                        <td className="px-3 py-2 font-medium">
                                                            <span className="font-bold text-gray-900">{totalPasses} pases</span>{' '}
                                                            <span className="text-[10px] text-gray-400">(1 + {extraPasses})</span>
                                                        </td>

                                                        <td className="px-3 py-2">
                                                            <span className={`text-[11px] font-semibold ${guest.can_upload_photos ? 'text-primary' : 'text-gray-400'}`}>
                                                                {guest.can_upload_photos ? 'Sí' : 'No'}
                                                            </span>
                                                        </td>

                                                        <td className="px-3 py-2 whitespace-nowrap">
                                                            <button
                                                                onClick={() => copyInviteLink(guest.access_token, guest.id)}
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
                                                                    guest.confirmed_at
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-gray-100 text-gray-500'
                                                                }`}
                                                            >
                                                                {guest.confirmed_at ? 'Sí' : 'No'}
                                                            </span>
                                                        </td>

                                                        <td className="px-3 py-2 text-right whitespace-nowrap">
                                                            <div className="inline-flex items-center gap-1">
                                                                <button
                                                                    onClick={() => openWhatsAppModal(guest)}
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
                                                                            data: { ...guest, extra_passes: extraPasses },
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
                                                                            type: 'guest',
                                                                            id: guest.id,
                                                                            name: `${guest.first_name} ${guest.last_name}`,
                                                                            extraInfo: `Se borrarán también ${guestAttendees.length} confirmación(es) y ${photosCount} foto(s) asociadas.`,
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
                {tab === 'photos' && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-1.5 bg-white p-2.5 rounded-xl border border-gray-200">
                            {[
                                { id: 'all', label: 'Todas', count: photos.length },
                                { id: 'pending', label: 'Pendientes', count: photos.filter((p) => p.status === 'pending').length },
                                { id: 'approved', label: 'Aprobadas', count: photos.filter((p) => p.status === 'approved').length },
                                { id: 'rejected', label: 'Rechazadas', count: photos.filter((p) => p.status === 'rejected').length },
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setPhotoFilter(filter.id)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        photoFilter === filter.id
                                            ? 'bg-primary text-white shadow-xs'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {filter.label} ({filter.count})
                                </button>
                            ))}
                        </div>

                        {filteredPhotos.length === 0 ? (
                            <p className="text-sm text-gray-400 py-12 text-center bg-white rounded-xl border border-gray-200">
                                No hay fotos bajo este filtro.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {filteredPhotos.map((p) => (
                                    <div key={p.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-xs flex flex-col text-xs">
                                        <div className="aspect-square bg-gray-100 relative">
                                            <img src={p.url} alt="Foto subida" className="w-full h-full object-cover" />
                                            <span
                                                className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    p.status === 'approved'
                                                        ? 'bg-green-600 text-white'
                                                        : p.status === 'rejected'
                                                            ? 'bg-red-600 text-white'
                                                            : 'bg-yellow-500 text-white'
                                                }`}
                                            >
                                                {PHOTO_STATUS_LABELS[p.status] || p.status}
                                            </span>
                                        </div>
                                        <div className="p-2.5 flex-1 flex flex-col justify-between">
                                            <p className="text-gray-600 mb-2 truncate">
                                                De: <strong>{p.guests ? `${p.guests.first_name} ${p.guests.last_name}` : 'Invitado'}</strong>
                                            </p>
                                            <div className="flex gap-1.5 pt-2 border-t border-gray-100">
                                                <button
                                                    onClick={() => updatePhotoStatus(p.id, 'approved')}
                                                    className="flex-1 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 font-bold flex items-center justify-center gap-1 cursor-pointer text-[11px]"
                                                >
                                                    <Check size={13} /> Aprobar
                                                </button>
                                                <button
                                                    onClick={() => updatePhotoStatus(p.id, 'rejected')}
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
                {tab === 'settings' && <ConfigTab attendees={attendees} guests={guests} />}
            </div>

            {/* ════════════════════════════════════════════════════════════
                MODAL: CREAR / EDITAR ASISTENTE (NOMBRE, APELLIDO, PLATO Y CONTORNOS)
            ════════════════════════════════════════════════════════════ */}
            {attendeeModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">
                                    {attendeeModal.mode === 'edit'
                                        ? 'Editar Asistente'
                                        : attendeeModal.isPrimary
                                            ? 'Agregar Confirmación del Titular'
                                            : 'Agregar Acompañante'}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Titular: <strong>{attendeeModal.primaryGuest.first_name} {attendeeModal.primaryGuest.last_name}</strong>
                                </p>
                            </div>
                            <button
                                onClick={() => setAttendeeModal(null)}
                                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAttendee} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        maxLength={EVENT_LIMITS.rsvp.firstNameMax}
                                        value={attendeeModal.firstName}
                                        onChange={(e) => setAttendeeModal({ ...attendeeModal, firstName: e.target.value })}
                                        placeholder="Ej: María"
                                        className="w-full p-2 rounded-lg border border-gray-300 text-xs focus:border-primary focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Apellido *</label>
                                    <input
                                        type="text"
                                        maxLength={EVENT_LIMITS.rsvp.lastNameMax}
                                        value={attendeeModal.lastName}
                                        onChange={(e) => setAttendeeModal({ ...attendeeModal, lastName: e.target.value })}
                                        placeholder="Ej: Pérez"
                                        className="w-full p-2 rounded-lg border border-gray-300 text-xs focus:border-primary focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Plato Fuerte *</label>
                                <select
                                    value={attendeeModal.mainCourseId || ''}
                                    onChange={(e) => setAttendeeModal({ ...attendeeModal, mainCourseId: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-gray-300 text-xs focus:border-primary focus:outline-none bg-white"
                                    required
                                >
                                    <option value="">Selecciona un plato</option>
                                    {mainCoursesList.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {maxSides > 0 && sidesList.length > 0 && (
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                                        Contornos * (mín. 1, máx. {maxSides} — {attendeeModal.sideIds.length} selec.)
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {sidesList.map((s) => {
                                            const selected = attendeeModal.sideIds.includes(s.id);
                                            const disabled = !selected && attendeeModal.sideIds.length >= maxSides;
                                            return (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => toggleModalSide(s.id)}
                                                    disabled={disabled}
                                                    className={`p-2 rounded-lg border text-xs font-medium text-left flex items-center justify-between transition-all ${
                                                        selected
                                                            ? 'border-primary bg-primary/10 text-gray-900 cursor-pointer'
                                                            : disabled
                                                                ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                                                                : 'border-gray-200 hover:border-primary/50 text-gray-700 cursor-pointer'
                                                    }`}
                                                >
                                                    <span>{s.name}</span>
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
                                    onClick={() => setAttendeeModal(null)}
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
                                        : attendeeModal.mode === 'edit'
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
                                onClick={() => setWhatsAppModal({ isOpen: false, guest: null, message: '', phone: '' })}
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
                                onClick={() => setWhatsAppModal({ isOpen: false, guest: null, message: '', phone: '' })}
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
                                        maxLength={EVENT_LIMITS.rsvp.firstNameMax}
                                        value={guestModal.data?.first_name || ''}
                                        onChange={(e) =>
                                            setGuestModal({ ...guestModal, data: { ...guestModal.data, first_name: e.target.value } })
                                        }
                                        className="w-full p-2 rounded-lg border border-gray-300 text-xs focus:border-primary focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Apellido *</label>
                                    <input
                                        type="text"
                                        maxLength={EVENT_LIMITS.rsvp.lastNameMax}
                                        value={guestModal.data?.last_name || ''}
                                        onChange={(e) =>
                                            setGuestModal({ ...guestModal, data: { ...guestModal.data, last_name: e.target.value } })
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
                                        maxLength={EVENT_LIMITS.rsvp.phoneMax}
                                        value={guestModal.data?.phone || ''}
                                        placeholder="+58414..."
                                        onChange={(e) =>
                                            setGuestModal({ ...guestModal, data: { ...guestModal.data, phone: e.target.value } })
                                        }
                                        className="w-full p-2 rounded-lg border border-gray-300 text-xs font-mono focus:border-primary focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Grupo *</label>
                                    <select
                                        value={guestModal.data?.group_id || defaultGroupId}
                                        onChange={(e) =>
                                            setGuestModal({ ...guestModal, data: { ...guestModal.data, group_id: e.target.value } })
                                        }
                                        className="w-full p-2 rounded-lg border border-gray-300 text-xs focus:border-primary focus:outline-none bg-white"
                                        required
                                    >
                                        {groups.map((g) => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Email (opcional)</label>
                                <input
                                    type="email"
                                    maxLength={EVENT_LIMITS.rsvp.emailMax}
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
                                            max={EVENT_LIMITS.rsvp.extraPassesMax}
                                            value={guestModal.data?.extra_passes ?? 0}
                                            onChange={(e) => {
                                                const v = Math.min(
                                                    EVENT_LIMITS.rsvp.extraPassesMax,
                                                    Math.max(0, parseInt(e.target.value, 10) || 0)
                                                );
                                                setGuestModal({
                                                    ...guestModal,
                                                    data: { ...guestModal.data, extra_passes: v },
                                                });
                                            }}
                                            className="w-24 p-2 rounded-lg border border-gray-300 text-xs font-bold focus:border-primary focus:outline-none"
                                            required
                                        />
                                        <span className="text-xs text-gray-600">
                                            = Total:{' '}
                                            <strong>{1 + (Number(guestModal.data?.extra_passes) || 0)} personas</strong>{' '}
                                            (Titular + {guestModal.data?.extra_passes ?? 0})
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-200">
                                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={guestModal.data?.can_upload_photos ?? true}
                                            onChange={(e) =>
                                                setGuestModal({
                                                    ...guestModal,
                                                    data: { ...guestModal.data, can_upload_photos: e.target.checked },
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
                                deleteItem.type === 'reset_rsvp'
                                    ? 'bg-amber-100 text-amber-600'
                                    : 'bg-red-100 text-red-600'
                            }`}
                        >
                            {deleteItem.type === 'reset_rsvp' ? <RotateCcw size={24} /> : <AlertTriangle size={24} />}
                        </div>

                        <h3 className="text-base font-bold text-gray-900 mb-1">
                            {deleteItem.type === 'reset_rsvp' ? '¿Reiniciar confirmación?' : '¿Estás seguro de eliminar?'}
                        </h3>

                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                            {deleteItem.type === 'reset_rsvp' ? (
                                <>
                                    Se borrarán las respuestas de asistencia y menú de <strong>{deleteItem.name}</strong> y sus acompañantes.
                                    <br />
                                    <strong className="text-green-600">El invitado permanecerá intacto en la lista de invitados</strong> para que pueda volver a confirmar.
                                </>
                            ) : deleteItem.type === 'guest' ? (
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
                                    deleteItem.type === 'reset_rsvp'
                                        ? 'bg-amber-600 hover:bg-amber-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                {actionLoading
                                    ? 'Procesando...'
                                    : deleteItem.type === 'reset_rsvp'
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
