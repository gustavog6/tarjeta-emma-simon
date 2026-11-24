import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, UtensilsCrossed, Check, ChevronRight, ChevronLeft,
    MessageCircle, Users, Plus, Trash2, Heart, AlertCircle, UserPlus
} from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { supabase } from '../lib/supabase';
import { parseFecha } from '../utils/fechas';
import { friendlyError } from '../utils/errores';
import { findGrupo, grupoLabel, grupoColorStyle } from '../utils/grupos';
import { INVITATION_LIMITS, limitList } from '../config/invitationLimits';
import vestido from '../assets/vestido-verde.png';
import camisa from '../assets/camisa-verde.png';

const createEmptyGuest = (nombre = '', apellido = '', esTitular = false) => ({
    nombre,
    apellido,
    esTitular,
    platoFuerte: null,
    contornos: [],
    regalo: null,
});

const fullNameOf = (g) => `${g.nombre || ''} ${g.apellido || ''}`.trim();

const RsvpModal = ({ isOpen, onClose, invitado, confirmacionesPrevias = [], onConfirmed }) => {
    const { config } = useConfig();
    const { novios, menu, fecha, textos } = config;
    const grupos = limitList(config.grupos, INVITATION_LIMITS.grupos.max);
    const platosList = limitList(menu?.platosFuertes, INVITATION_LIMITS.menu.platosMax);
    const contornosList = limitList(menu?.contornos, INVITATION_LIMITS.menu.contornosMax);
    const rawSlots = Number(invitado?.slots_totales ?? invitado?.slots ?? 0);
    const maxSlots = 1 + rawSlots;
    const yaConfirmados = confirmacionesPrevias.length;
    const yaTieneTitular = confirmacionesPrevias.some((c) => c.es_titular);
    const cuposRestantes = Math.max(0, maxSlots - yaConfirmados);
    const defaultGrupo = invitado?.grupo || grupos[0]?.id || null;

    const buildInitialGuests = () =>
        yaTieneTitular
            ? [createEmptyGuest('', '', false)]
            : [createEmptyGuest(invitado?.nombre || '', invitado?.apellido || '', true)];

    const [step, setStep] = useState(yaTieneTitular ? 2 : 1); // 1 | 2 | 2.5 (aviso cupos) | 3 | 4
    const [invitadoDe, setInvitadoDe] = useState(defaultGrupo);
    const [guests, setGuests] = useState(buildInitialGuests);
    const [currentGuestIndex, setCurrentGuestIndex] = useState(0);
    const [menuStep, setMenuStep] = useState('platoFuerte');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // Sincronizar estado cada vez que se abre el modal
    useEffect(() => {
        if (isOpen) {
            setStep(yaTieneTitular ? 2 : 1);
            setGuests(buildInitialGuests());
            setCurrentGuestIndex(0);
            setMenuStep('platoFuerte');
            setInvitadoDe(defaultGrupo);
            setSubmitting(false);
            setSubmitError(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, yaTieneTitular, yaConfirmados]);

    if (!isOpen) return null;

    const currentGuest = guests[currentGuestIndex] || guests[0];
    const maxContornos = menu?.maxContornos ?? 2;

    const handleClose = () => {
        setSubmitting(false);
        setSubmitError(null);
        onClose();
    };

    const addGuest = () => {
        if (guests.length < cuposRestantes) {
            setGuests([...guests, createEmptyGuest()]);
        }
    };

    const removeGuest = (index) => {
        // Si es primera vez (titular en índice 0), no permitir borrar índice 0
        if (!yaTieneTitular && index === 0) return;
        if (guests.length > 1) {
            const newGuests = guests.filter((_, i) => i !== index);
            setGuests(newGuests);
            if (currentGuestIndex >= newGuests.length) {
                setCurrentGuestIndex(newGuests.length - 1);
            }
        }
    };

    const updateGuestField = (index, field, value) => {
        const newGuests = [...guests];
        newGuests[index] = { ...newGuests[index], [field]: value };
        setGuests(newGuests);
    };

    const updateCurrentGuest = (updates) => {
        const newGuests = [...guests];
        newGuests[currentGuestIndex] = { ...currentGuest, ...updates };
        setGuests(newGuests);
    };

    const toggleContorno = (contorno) => {
        const currentContornos = currentGuest.contornos;
        if (currentContornos.find((c) => c.id === contorno.id)) {
            updateCurrentGuest({ contornos: currentContornos.filter((c) => c.id !== contorno.id) });
        } else if (currentContornos.length < maxContornos) {
            updateCurrentGuest({ contornos: [...currentContornos, contorno] });
        }
    };

    const allGuestsHaveNames = () =>
        guests.every((g) => g.nombre.trim().length > 0 && g.apellido.trim().length > 0);

    const handleContinueFromStep2 = () => {
        // Si todavía tiene pases sin usar, mostrar el paso de aviso antes de pasar al menú
        if (guests.length < cuposRestantes) {
            setStep(2.5);
        } else {
            setStep(3);
            setCurrentGuestIndex(0);
            setMenuStep('platoFuerte');
        }
    };

    const goToNextGuest = () => {
        if (currentGuestIndex < guests.length - 1) {
            setCurrentGuestIndex(currentGuestIndex + 1);
            setMenuStep('platoFuerte');
        } else {
            setSubmitError(null);
            setStep(4);
        }
    };

    const goToPrevGuest = () => {
        if (currentGuestIndex > 0) {
            setCurrentGuestIndex(currentGuestIndex - 1);
            setMenuStep('platoFuerte');
        } else {
            setStep(2);
        }
    };

    const generateWhatsAppLink = () => {
        const novia = novios.novia;
        const novio = novios.novio;
        const grupoObj = findGrupo(grupos, invitadoDe);
        const phone =
            grupoObj?.whatsapp ||
            (invitadoDe === 'novia' ? novia.whatsapp : novio.whatsapp) ||
            novia.whatsapp ||
            novio.whatsapp ||
            '';

        let mensaje = yaTieneTitular
            ? `¡Hola! Agrego acompañante(s) a mi confirmación para la boda de ${novio.nombre} & ${novia.nombre} 💍\n\n`
            : `¡Hola! Confirmo asistencia a la boda de ${novio.nombre} & ${novia.nombre} 💍\n\n`;
        mensaje += `*Grupo:* ${grupoLabel(grupos, invitadoDe)}\n`;
        mensaje += `*Titular:* ${invitado?.nombre || ''} ${invitado?.apellido || ''}\n`;
        mensaje += `*Personas en este envío:* ${guests.length} (${yaConfirmados + guests.length}/${maxSlots} total)\n\n`;

        guests.forEach((guest, index) => {
            const contornos = guest.contornos.map((c) => c.nombre).join(' y ');
            mensaje += `*${guest.esTitular ? 'Titular' : `Acompañante ${yaTieneTitular ? yaConfirmados + index : index}`}:* ${fullNameOf(guest)}\n`;
            if (guest.platoFuerte) {
                mensaje += `• Plato fuerte: ${guest.platoFuerte.nombre}\n`;
            }
            if (contornos) {
                mensaje += `• Contornos: ${contornos}\n`;
            }
            mensaje += `\n`;
        });

        const parsedDate = parseFecha(fecha);
        const dateStr = parsedDate
            ? parsedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
            : '';
        if (dateStr) {
            mensaje += `¡Nos vemos el ${dateStr}!`;
        }

        const encoded = encodeURIComponent(mensaje);
        const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
        return `https://wa.me/${cleanPhone}?text=${encoded}`;
    };

    const handleConfirm = async () => {
        if (submitting) return;
        setSubmitting(true);
        setSubmitError(null);

        try {
            if (!supabase || !invitado?.token) {
                throw new Error('No se encontró el token de tu invitación.');
            }

            const payload = guests.map((g) => ({
                nombre: g.nombre.trim(),
                apellido: g.apellido.trim(),
                plato_fuerte: g.platoFuerte?.id || null,
                contornos: g.contornos.map((c) => c.id),
                regalo_id: g.regalo || null,
            }));

            const { data, error } = await supabase.rpc('confirmar_asistencia', {
                p_token: invitado.token,
                p_asistentes: payload,
            });

            if (error) throw error;

            if (onConfirmed) {
                await onConfirmed(data || { ...invitado, confirmed_at: new Date().toISOString() });
            }

            const link = generateWhatsAppLink();
            window.location.href = link;

            setTimeout(() => {
                setSubmitting(false);
                handleClose();
            }, 800);
        } catch (err) {
            console.error('[RsvpModal] Error saving confirmation:', err);
            setSubmitError(friendlyError(err));
            setSubmitting(false);
        }
    };

    const getStepLabel = () => {
        if (step === 1) return 'Paso 1/4: ¿De parte de quién vienes?';
        if (step === 2) {
            return yaTieneTitular
                ? `Agregar acompañantes (${cuposRestantes} ${cuposRestantes === 1 ? 'pase disponible' : 'pases disponibles'})`
                : `Paso 2/4: ¿Quiénes asisten? (Máx ${maxSlots})`;
        }
        if (step === 2.5) return 'Tienes pases disponibles en tu invitación';
        if (step === 3) {
            if (menuStep === 'platoFuerte') return `${fullNameOf(currentGuest)}: Plato fuerte`;
            if (menuStep === 'contornos') return `${fullNameOf(currentGuest)}: Contornos`;
        }
        if (step === 4) return 'Confirmar asistencia';
        return '';
    };

    const progressStep = step === 2.5 ? 2 : step;
    const pasesSinUsarAhora = cuposRestantes - guests.length;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 safe-overlay">
                <motion.div
                    className="absolute inset-0 bg-black/60 modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                />

                <motion.div
                    className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative z-10 glass-panel border-2 border-primary/20 modal-sheet overflow-y-auto"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    {/* Header */}
                    <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md p-6 text-center border-b border-gray-100 shadow-sm">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-primary">
                            <UtensilsCrossed size={32} />
                        </div>
                        <h3 className="font-heading text-4xl text-primary">
                            {yaTieneTitular ? 'Agregar Acompañantes' : (textos?.rsvp?.titulo || 'Confirmar Asistencia')}
                        </h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                            {getStepLabel()}
                        </p>

                        <div className="flex gap-2 justify-center mt-4">
                            {[1, 2, 3, 4].map((s) => (
                                <div
                                    key={s}
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        s <= progressStep ? 'bg-primary w-8' : 'bg-gray-300 w-4'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Step 1: Grupo */}
                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center">
                                    <Heart size={44} className="mx-auto text-primary mb-3" />
                                    <h4 className="font-semibold text-gray-600 text-2xl tracking-wide">
                                        ¿De parte de quién asisten?
                                    </h4>
                                    <p className="text-sm text-gray-400 mt-1">Selecciona una opción</p>
                                </div>

                                <div className={`grid gap-3 ${grupos.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                                    {grupos.map((g) => {
                                        const active = invitadoDe === g.id;
                                        const style = grupoColorStyle(g.color);
                                        return (
                                            <motion.button
                                                key={g.id}
                                                onClick={() => setInvitadoDe(g.id)}
                                                className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2.5 cursor-pointer text-center ${
                                                    active ? style.cardActive : style.cardIdle
                                                }`}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div
                                                    className={`w-14 h-14 rounded-full flex items-center justify-center ${
                                                        active ? style.circleActive : style.circleIdle
                                                    }`}
                                                >
                                                    {g.id === 'novia' ? (
                                                        <img src={vestido} alt={g.nombre} className="w-9 h-9 object-contain" />
                                                    ) : g.id === 'novio' ? (
                                                        <img src={camisa} alt={g.nombre} className="w-9 h-9 object-contain" />
                                                    ) : (
                                                        <Users size={26} />
                                                    )}
                                                </div>
                                                <span className="font-bold text-base text-gray-700 leading-tight">{g.nombre}</span>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!invitadoDe}
                                    className={`w-full mt-4 py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                        invitadoDe
                                            ? 'bg-primary text-white hover:bg-secondary shadow-md'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    Continuar
                                    <ChevronRight size={20} />
                                </button>
                            </motion.div>
                        )}

                        {/* Step 2: Nombres y Apellidos */}
                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="text-center mb-4">
                                    <Users size={40} className="mx-auto text-primary mb-2" />
                                    <h4 className="font-semibold text-gray-700 text-2xl tracking-wide">
                                        {yaTieneTitular ? '¿Qué acompañantes agregarás?' : '¿Quiénes van a asistir?'}
                                    </h4>
                                    {yaTieneTitular ? (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Ya registraste <strong>{yaConfirmados} de {maxSlots}</strong> pases. Puedes añadir hasta{' '}
                                            <strong>{cuposRestantes} acompañante{cuposRestantes === 1 ? '' : 's'}</strong> más.
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Tu invitación es válida para hasta <strong>{maxSlots} persona{maxSlots > 1 ? 's' : ''}</strong> (Tú + {rawSlots} acompañante{rawSlots === 1 ? '' : 's'}).
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {guests.map((guest, index) => {
                                        const isLockedTitular = guest.esTitular && index === 0;
                                        return (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0 font-bold text-xs">
                                                            {yaTieneTitular ? yaConfirmados + index + 1 : index + 1}
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                            {guest.esTitular ? 'Titular' : `Acompañante ${yaTieneTitular ? yaConfirmados + index : index}`}
                                                        </span>
                                                    </div>
                                                    {guests.length > 1 && !isLockedTitular && (
                                                        <button
                                                            onClick={() => removeGuest(index)}
                                                            className="p-1.5 text-red-400 hover:text-red-600 rounded-full transition-colors cursor-pointer"
                                                            title="Quitar acompañante"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        value={guest.nombre}
                                                        onChange={(e) => updateGuestField(index, 'nombre', e.target.value)}
                                                        readOnly={isLockedTitular && Boolean(invitado?.nombre)}
                                                        placeholder="Nombre *"
                                                        className={`w-full px-2.5 py-1.5 rounded-lg border text-sm focus:border-primary focus:outline-none ${
                                                            isLockedTitular && invitado?.nombre
                                                                ? 'bg-gray-100 border-gray-200 text-gray-600'
                                                                : 'bg-white border-gray-300 text-gray-700'
                                                        }`}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={guest.apellido}
                                                        onChange={(e) => updateGuestField(index, 'apellido', e.target.value)}
                                                        readOnly={isLockedTitular && Boolean(invitado?.apellido)}
                                                        placeholder="Apellido *"
                                                        className={`w-full px-2.5 py-1.5 rounded-lg border text-sm focus:border-primary focus:outline-none ${
                                                            isLockedTitular && invitado?.apellido
                                                                ? 'bg-gray-100 border-gray-200 text-gray-600'
                                                                : 'bg-white border-gray-300 text-gray-700'
                                                        }`}
                                                    />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {guests.length < cuposRestantes && (
                                    <motion.button
                                        onClick={addGuest}
                                        className="w-full p-3 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm font-semibold"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Plus size={18} />
                                        Agregar acompañante ({yaConfirmados + guests.length}/{maxSlots})
                                    </motion.button>
                                )}

                                <div className="flex gap-3 mt-6">
                                    {!yaTieneTitular && (
                                        <button
                                            onClick={() => setStep(1)}
                                            className="flex-1 py-3.5 rounded-full font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <ChevronLeft size={18} />
                                            Atrás
                                        </button>
                                    )}
                                    <button
                                        onClick={handleContinueFromStep2}
                                        disabled={!allGuestsHaveNames()}
                                        className={`flex-1 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                            allGuestsHaveNames()
                                                ? 'bg-primary text-white hover:bg-secondary shadow-md'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        Continuar
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2.5: Aviso elegante de pases disponibles sin usar */}
                        {step === 2.5 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                className="space-y-5 text-center py-2"
                            >
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                                    <UserPlus size={30} />
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-heading text-4xl text-primary">
                                        ¡Tienes pases disponibles!
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
                                        Tu invitación incluye <strong>{maxSlots} persona{maxSlots > 1 ? 's' : ''}</strong> en total
                                        {yaConfirmados > 0 && ` (ya confirmaste ${yaConfirmados})`}.
                                        {guests.length === 1 && !yaTieneTitular ? (
                                            <> Estás a punto de confirmar solo por ti, quedando <strong>{pasesSinUsarAhora} acompañante{pasesSinUsarAhora === 1 ? '' : 's'}</strong> sin registrar.</>
                                        ) : (
                                            <> Aún te {pasesSinUsarAhora === 1 ? 'queda' : 'quedan'} <strong>{pasesSinUsarAhora} pase{pasesSinUsarAhora === 1 ? '' : 's'}</strong> sin usar.</>
                                        )}
                                    </p>
                                </div>

                                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 text-xs text-gray-600 leading-relaxed">
                                    ¿Deseas añadir a tus acompañantes ahora? Si prefieres continuar así, podrás volver a abrir tu invitación más adelante para registrar los pases restantes.
                                </div>

                                <div className="flex flex-col gap-2.5 pt-2">
                                    <button
                                        onClick={() => {
                                            if (guests.length < cuposRestantes) {
                                                setGuests([...guests, createEmptyGuest()]);
                                            }
                                            setStep(2);
                                        }}
                                        className="w-full py-3.5 rounded-full font-bold bg-primary text-white hover:bg-secondary shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                                    >
                                        <Plus size={18} />
                                        Sí, agregar acompañantes
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStep(3);
                                            setCurrentGuestIndex(0);
                                            setMenuStep('platoFuerte');
                                        }}
                                        className="w-full py-3 rounded-full font-semibold border border-primary/30 text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                                    >
                                        Continuar de todos modos
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Menú por invitado */}
                        {step === 3 && (
                            <motion.div
                                key={`guest-${currentGuestIndex}-${menuStep}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    {guests.map((guest, index) => (
                                        <div
                                            key={index}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                                index === currentGuestIndex
                                                    ? 'bg-primary text-white scale-110 shadow-sm'
                                                    : 'bg-gray-200 text-gray-500'
                                            }`}
                                            title={fullNameOf(guest)}
                                        >
                                            {index + 1}
                                        </div>
                                    ))}
                                </div>

                                {menuStep === 'platoFuerte' && (
                                    <>
                                        <h4 className="font-semibold text-gray-700 text-2xl text-center">
                                            Plato fuerte para <span className="text-primary font-heading text-3xl">{fullNameOf(currentGuest)}</span>
                                        </h4>

                                        <div className="space-y-2 pt-2">
                                            {platosList.map((plato) => (
                                                <motion.button
                                                    key={plato.id}
                                                    onClick={() => updateCurrentGuest({ platoFuerte: plato })}
                                                    className={`w-full p-3.5 rounded-xl border-2 transition-all duration-200 flex items-center justify-between text-left cursor-pointer ${
                                                        currentGuest.platoFuerte?.id === plato.id
                                                            ? 'border-primary bg-primary/10 shadow-sm'
                                                            : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50'
                                                    }`}
                                                    whileHover={{ scale: 1.01 }}
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    <span className="font-medium text-gray-700 text-base">{plato.nombre}</span>
                                                    {currentGuest.platoFuerte?.id === plato.id && (
                                                        <div className="bg-primary text-white rounded-full p-1">
                                                            <Check size={14} />
                                                        </div>
                                                    )}
                                                </motion.button>
                                            ))}
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button
                                                onClick={goToPrevGuest}
                                                className="flex-1 py-3.5 rounded-full font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <ChevronLeft size={18} />
                                                Atrás
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (contornosList.length === 0 || maxContornos === 0) {
                                                        goToNextGuest();
                                                    } else {
                                                        setMenuStep('contornos');
                                                    }
                                                }}
                                                disabled={!currentGuest.platoFuerte}
                                                className={`flex-1 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                                    currentGuest.platoFuerte
                                                        ? 'bg-primary text-white hover:bg-secondary shadow-md'
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                                Siguiente
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </>
                                )}

                                {menuStep === 'contornos' && (
                                    <>
                                        <h4 className="font-semibold text-gray-700 text-2xl text-center">
                                            Contornos para <span className="text-primary font-heading text-3xl">{fullNameOf(currentGuest)}</span>
                                        </h4>
                                        <p className="text-xs text-gray-500 text-center mb-4">
                                            Selecciona entre 1 y {maxContornos} ({currentGuest.contornos.length}/{maxContornos} seleccionados)
                                        </p>

                                        <div className="grid grid-cols-2 gap-2">
                                            {contornosList.map((contorno) => {
                                                const isSelected = currentGuest.contornos.find((c) => c.id === contorno.id);
                                                const isDisabled = currentGuest.contornos.length >= maxContornos && !isSelected;

                                                return (
                                                    <motion.button
                                                        key={contorno.id}
                                                        onClick={() => toggleContorno(contorno)}
                                                        disabled={isDisabled}
                                                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center min-h-[70px] cursor-pointer ${
                                                            isSelected
                                                                ? 'border-primary bg-primary/10 shadow-sm'
                                                                : isDisabled
                                                                    ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                                                                    : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <span className="font-medium text-gray-700 text-sm">{contorno.nombre}</span>
                                                        {isSelected && (
                                                            <div className="bg-primary text-white rounded-full p-0.5 mt-1">
                                                                <Check size={12} />
                                                            </div>
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button
                                                onClick={() => setMenuStep('platoFuerte')}
                                                className="flex-1 py-3.5 rounded-full font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <ChevronLeft size={18} />
                                                Atrás
                                            </button>
                                            <button
                                                onClick={goToNextGuest}
                                                disabled={maxContornos > 0 && currentGuest.contornos.length < 1}
                                                className={`flex-1 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                                    maxContornos === 0 || currentGuest.contornos.length >= 1
                                                        ? 'bg-primary text-white hover:bg-secondary shadow-md'
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                                {currentGuestIndex < guests.length - 1 ? 'Siguiente invitado' : 'Ver resumen'}
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* Step 4: Resumen */}
                        {step === 4 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="text-center mb-4">
                                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 text-green-600">
                                        <Check size={28} />
                                    </div>
                                    <h4 className="font-semibold text-gray-700 text-2xl tracking-wide">
                                        ¡Todo listo para confirmar!
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        Revisa los detalles antes de enviar
                                    </p>
                                </div>

                                {submitError && (
                                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                        <span>{submitError}</span>
                                    </div>
                                )}

                                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                                    {guests.map((g, idx) => (
                                        <div key={idx} className="bg-primary/5 p-3.5 rounded-xl border border-primary/20 text-sm">
                                            <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                                                <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                                                    {idx + 1}
                                                </span>
                                                {fullNameOf(g)}
                                            </div>
                                            <div className="text-gray-600 pl-7 text-xs space-y-0.5">
                                                <p>• <strong>Plato:</strong> {g.platoFuerte?.nombre}</p>
                                                <p>• <strong>Contornos:</strong> {g.contornos.map((c) => c.nombre).join(', ')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {pasesSinUsarAhora > 0 && (
                                    <p className="text-[11px] text-center text-gray-500">
                                        Te quedarán <strong>{pasesSinUsarAhora} {pasesSinUsarAhora === 1 ? 'pase disponible' : 'pases disponibles'}</strong> por si deseas agregar acompañantes luego.
                                    </p>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setStep(3);
                                            setCurrentGuestIndex(guests.length - 1);
                                            setMenuStep('contornos');
                                        }}
                                        disabled={submitting}
                                        className="flex-1 py-3.5 rounded-full font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <ChevronLeft size={18} />
                                        Editar
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={submitting}
                                        className="flex-1 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 shadow-lg cursor-pointer transition-all disabled:opacity-60"
                                    >
                                        <MessageCircle size={18} />
                                        {submitting ? 'Confirmando...' : 'Confirmar'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RsvpModal;
