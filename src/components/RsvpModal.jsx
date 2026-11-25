import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, UtensilsCrossed, Check, ChevronRight, ChevronLeft,
    MessageCircle, Users, Plus, Trash2, Heart, AlertCircle, UserPlus
} from 'lucide-react';
import { useEventConfig } from '../context/EventConfigContext';
import { supabase } from '../lib/supabase';
import { parseDate } from '../utils/dateUtils';
import { formatDbError } from '../utils/errorMessages';
import { findGroup, getGroupLabel, getGroupColorStyle } from '../utils/groupUtils';
import { ICON_MAP } from '../utils/iconRegistry';
import { EVENT_LIMITS, limitList } from '../config/eventLimits';
import { formatHostsNames, interpolateTemplate } from '../config/eventPresets';
import attireOptionA from '../assets/attire-option-a.png';
import attireOptionB from '../assets/attire-option-b.png';

const createEmptyAttendee = (firstName = '', lastName = '', isPrimary = false) => ({
    firstName,
    lastName,
    isPrimary,
    mainCourse: null,
    sides: [],
    giftOption: null,
});

const fullNameOf = (a) => `${a.firstName || ''} ${a.lastName || ''}`.trim();

const renderGroupIcon = (iconKey, altText) => {
    if (iconKey === 'dress') {
        return <img src={attireOptionA} alt={altText} className="w-9 h-9 object-contain" />;
    }
    if (iconKey === 'shirt') {
        return <img src={attireOptionB} alt={altText} className="w-9 h-9 object-contain" />;
    }
    const IconComp = ICON_MAP[iconKey] || Users;
    return <IconComp size={26} />;
};

const RsvpModal = ({ isOpen, onClose, guest, existingAttendees = [], onConfirmed }) => {
    const { config } = useEventConfig();
    const { hosts, menu, eventDate, copy } = config;
    const groups = limitList(config.groups, EVENT_LIMITS.groups.max);
    const mainCoursesList = limitList(menu?.mainCourses, EVENT_LIMITS.menu.mainCoursesMax);
    const sidesList = limitList(menu?.sides, EVENT_LIMITS.menu.sidesMax);

    const extraPasses = Number(guest?.extra_passes ?? 0);
    const maxPasses = 1 + extraPasses;
    const alreadyConfirmed = existingAttendees.length;
    const alreadyHasPrimary = existingAttendees.some((a) => a.is_primary);
    const remainingPasses = Math.max(0, maxPasses - alreadyConfirmed);
    const defaultGroupId = guest?.group_id || groups[0]?.id || null;
    const skipGroupStep = alreadyHasPrimary || groups.length <= 1;

    const buildInitialAttendees = () =>
        alreadyHasPrimary
            ? [createEmptyAttendee('', '', false)]
            : [createEmptyAttendee(guest?.first_name || '', guest?.last_name || '', true)];

    const [step, setStep] = useState(skipGroupStep ? 2 : 1);
    const [selectedGroupId, setSelectedGroupId] = useState(defaultGroupId);
    const [attendees, setAttendees] = useState(buildInitialAttendees);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [menuStep, setMenuStep] = useState('mainCourse');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setStep(skipGroupStep ? 2 : 1);
            setAttendees(buildInitialAttendees());
            setCurrentIndex(0);
            setMenuStep('mainCourse');
            setSelectedGroupId(defaultGroupId);
            setSubmitting(false);
            setSubmitError(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, alreadyHasPrimary, alreadyConfirmed, groups.length]);

    if (!isOpen) return null;

    const currentAttendee = attendees[currentIndex] || attendees[0];
    const maxSides = menu?.maxSides ?? 2;

    const handleClose = () => {
        setSubmitting(false);
        setSubmitError(null);
        onClose();
    };

    const addAttendee = () => {
        if (attendees.length < remainingPasses) {
            setAttendees([...attendees, createEmptyAttendee()]);
        }
    };

    const removeAttendee = (index) => {
        if (!alreadyHasPrimary && index === 0) return;
        if (attendees.length > 1) {
            const next = attendees.filter((_, i) => i !== index);
            setAttendees(next);
            if (currentIndex >= next.length) {
                setCurrentIndex(next.length - 1);
            }
        }
    };

    const updateAttendeeField = (index, field, value) => {
        const next = [...attendees];
        next[index] = { ...next[index], [field]: value };
        setAttendees(next);
    };

    const updateCurrentAttendee = (updates) => {
        const next = [...attendees];
        next[currentIndex] = { ...currentAttendee, ...updates };
        setAttendees(next);
    };

    const toggleSide = (side) => {
        const currentSides = currentAttendee.sides;
        if (currentSides.find((s) => s.id === side.id)) {
            updateCurrentAttendee({ sides: currentSides.filter((s) => s.id !== side.id) });
        } else if (currentSides.length < maxSides) {
            updateCurrentAttendee({ sides: [...currentSides, side] });
        }
    };

    const allAttendeesHaveNames = () =>
        attendees.every((a) => a.firstName.trim().length > 0 && a.lastName.trim().length > 0);

    const handleContinueFromStep2 = () => {
        if (attendees.length < remainingPasses) {
            setStep(2.5);
        } else {
            setStep(3);
            setCurrentIndex(0);
            setMenuStep('mainCourse');
        }
    };

    const goToNextAttendee = () => {
        if (currentIndex < attendees.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setMenuStep('mainCourse');
        } else {
            setSubmitError(null);
            setStep(4);
        }
    };

    const goToPrevAttendee = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setMenuStep('mainCourse');
        } else {
            setStep(2);
        }
    };

    const generateWhatsAppLink = () => {
        const groupObj = findGroup(groups, selectedGroupId);
        const phone =
            groupObj?.contactPhone ||
            hosts?.primary?.phone ||
            hosts?.secondary?.phone ||
            '';

        const hostsStr = formatHostsNames(hosts);
        const introLine = interpolateTemplate(
            copy?.rsvp?.whatsappIntro || '¡Hola! Confirmo asistencia a la invitación de {hosts} ✨',
            { hosts: hostsStr }
        );

        let message = `${introLine}\n\n`;
        if (groups.length > 1) {
            message += `*Grupo:* ${getGroupLabel(groups, selectedGroupId)}\n`;
        }
        message += `*Titular:* ${guest?.first_name || ''} ${guest?.last_name || ''}\n`;
        message += `*Personas en este envío:* ${attendees.length} (${alreadyConfirmed + attendees.length}/${maxPasses} total)\n\n`;

        attendees.forEach((att, idx) => {
            const sidesText = att.sides.map((s) => s.name).join(' y ');
            const roleLabel = att.isPrimary
                ? 'Titular'
                : `Acompañante ${alreadyHasPrimary ? alreadyConfirmed + idx : idx}`;
            message += `*${roleLabel}:* ${fullNameOf(att)}\n`;
            if (att.mainCourse) {
                message += `• Plato fuerte: ${att.mainCourse.name}\n`;
            }
            if (sidesText) {
                message += `• Contornos: ${sidesText}\n`;
            }
            message += `\n`;
        });

        const parsedDate = parseDate(eventDate);
        const dateStr = parsedDate
            ? parsedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
            : '';
        if (dateStr) {
            message += `¡Nos vemos el ${dateStr}!`;
        }

        const encoded = encodeURIComponent(message);
        const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
        return `https://wa.me/${cleanPhone}?text=${encoded}`;
    };

    const handleConfirm = async () => {
        if (submitting) return;
        setSubmitting(true);
        setSubmitError(null);

        try {
            if (!supabase || !guest?.access_token) {
                throw new Error('No se encontró el enlace de tu invitación.');
            }

            const payload = attendees.map((a) => ({
                first_name: a.firstName.trim(),
                last_name: a.lastName.trim(),
                main_course_id: a.mainCourse?.id || null,
                side_ids: a.sides.map((s) => s.id),
                gift_option_id: a.giftOption || null,
            }));

            const { data, error } = await supabase.rpc('submit_rsvp', {
                p_token: guest.access_token,
                p_attendees: payload,
            });

            if (error) throw error;

            if (onConfirmed) {
                await onConfirmed(data || { ...guest, confirmed_at: new Date().toISOString() });
            }

            const link = generateWhatsAppLink();
            window.location.href = link;

            setTimeout(() => {
                setSubmitting(false);
                handleClose();
            }, 800);
        } catch (err) {
            console.error('[RsvpModal] Error saving confirmation:', err);
            setSubmitError(formatDbError(err));
            setSubmitting(false);
        }
    };

    const groupPromptText = copy?.rsvp?.groupPrompt || '¿De parte de quién nos acompañas?';

    const getStepLabel = () => {
        if (step === 1) return `Paso 1/4: ${groupPromptText}`;
        if (step === 2) {
            return alreadyHasPrimary
                ? `Agregar acompañantes (${remainingPasses} ${remainingPasses === 1 ? 'pase disponible' : 'pases disponibles'})`
                : `¿Quiénes asisten? (Máx ${maxPasses})`;
        }
        if (step === 2.5) return 'Tienes pases disponibles en tu invitación';
        if (step === 3) {
            if (menuStep === 'mainCourse') return `${fullNameOf(currentAttendee)}: Plato fuerte`;
            if (menuStep === 'sides') return `${fullNameOf(currentAttendee)}: Contornos`;
        }
        if (step === 4) return 'Confirmar asistencia';
        return '';
    };

    const progressStep = step === 2.5 ? 2 : step;
    const unusedPassesNow = remainingPasses - attendees.length;

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
                            {alreadyHasPrimary ? 'Agregar Acompañantes' : (copy?.rsvp?.title || 'Confirmar Asistencia')}
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
                        {/* Step 1: Dynamic Group Selection */}
                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center">
                                    <Heart size={44} className="mx-auto text-primary mb-3" />
                                    <h4 className="font-semibold text-gray-600 text-2xl tracking-wide break-anywhere">
                                        {groupPromptText}
                                    </h4>
                                    <p className="text-sm text-gray-400 mt-1">Selecciona una opción</p>
                                </div>

                                <div className={`grid gap-3 ${groups.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                                    {groups.map((g) => {
                                        const active = selectedGroupId === g.id;
                                        const style = getGroupColorStyle(g.color);
                                        return (
                                            <motion.button
                                                key={g.id}
                                                onClick={() => setSelectedGroupId(g.id)}
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
                                                    {renderGroupIcon(g.iconKey, g.name)}
                                                </div>
                                                <span className="font-bold text-base text-gray-700 leading-tight break-anywhere">
                                                    {g.name}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!selectedGroupId}
                                    className={`w-full mt-4 py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                        selectedGroupId
                                            ? 'bg-primary text-white hover:bg-secondary shadow-md'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    Continuar
                                    <ChevronRight size={20} />
                                </button>
                            </motion.div>
                        )}

                        {/* Step 2: Attendees First & Last Names */}
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
                                        {alreadyHasPrimary ? '¿Qué acompañantes agregarás?' : '¿Quiénes van a asistir?'}
                                    </h4>
                                    {alreadyHasPrimary ? (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Ya registraste <strong>{alreadyConfirmed} de {maxPasses}</strong> pases. Puedes añadir hasta{' '}
                                            <strong>{remainingPasses} acompañante{remainingPasses === 1 ? '' : 's'}</strong> más.
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Tu invitación es válida para hasta <strong>{maxPasses} persona{maxPasses > 1 ? 's' : ''}</strong> (Tú + {extraPasses} acompañante{extraPasses === 1 ? '' : 's'}).
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {attendees.map((att, index) => {
                                        const isLockedPrimary = att.isPrimary && index === 0;
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
                                                            {alreadyHasPrimary ? alreadyConfirmed + index + 1 : index + 1}
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                            {att.isPrimary ? 'Titular' : `Acompañante ${alreadyHasPrimary ? alreadyConfirmed + index : index}`}
                                                        </span>
                                                    </div>
                                                    {attendees.length > 1 && !isLockedPrimary && (
                                                        <button
                                                            onClick={() => removeAttendee(index)}
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
                                                        value={att.firstName}
                                                        maxLength={EVENT_LIMITS.rsvp.firstNameMax}
                                                        onChange={(e) => updateAttendeeField(index, 'firstName', e.target.value)}
                                                        readOnly={isLockedPrimary && Boolean(guest?.first_name)}
                                                        placeholder="Nombre *"
                                                        className={`w-full px-2.5 py-1.5 rounded-lg border text-sm focus:border-primary focus:outline-none ${
                                                            isLockedPrimary && guest?.first_name
                                                                ? 'bg-gray-100 border-gray-200 text-gray-600'
                                                                : 'bg-white border-gray-300 text-gray-700'
                                                        }`}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={att.lastName}
                                                        maxLength={EVENT_LIMITS.rsvp.lastNameMax}
                                                        onChange={(e) => updateAttendeeField(index, 'lastName', e.target.value)}
                                                        readOnly={isLockedPrimary && Boolean(guest?.last_name)}
                                                        placeholder="Apellido *"
                                                        className={`w-full px-2.5 py-1.5 rounded-lg border text-sm focus:border-primary focus:outline-none ${
                                                            isLockedPrimary && guest?.last_name
                                                                ? 'bg-gray-100 border-gray-200 text-gray-600'
                                                                : 'bg-white border-gray-300 text-gray-700'
                                                        }`}
                                                    />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {attendees.length < remainingPasses && (
                                    <motion.button
                                        onClick={addAttendee}
                                        className="w-full p-3 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm font-semibold"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Plus size={18} />
                                        Agregar acompañante ({alreadyConfirmed + attendees.length}/{maxPasses})
                                    </motion.button>
                                )}

                                <div className="flex gap-3 mt-6">
                                    {!skipGroupStep && (
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
                                        disabled={!allAttendeesHaveNames()}
                                        className={`flex-1 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                            allAttendeesHaveNames()
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

                        {/* Step 2.5: Unused Passes Notice */}
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
                                        Tu invitación incluye <strong>{maxPasses} persona{maxPasses > 1 ? 's' : ''}</strong> en total
                                        {alreadyConfirmed > 0 && ` (ya confirmaste ${alreadyConfirmed})`}.
                                        {attendees.length === 1 && !alreadyHasPrimary ? (
                                            <> Estás a punto de confirmar solo por ti, quedando <strong>{unusedPassesNow} acompañante{unusedPassesNow === 1 ? '' : 's'}</strong> sin registrar.</>
                                        ) : (
                                            <> Aún te {unusedPassesNow === 1 ? 'queda' : 'quedan'} <strong>{unusedPassesNow} pase{unusedPassesNow === 1 ? '' : 's'}</strong> sin usar.</>
                                        )}
                                    </p>
                                </div>

                                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 text-xs text-gray-600 leading-relaxed">
                                    ¿Deseas añadir a tus acompañantes ahora? Si prefieres continuar así, podrás volver a abrir tu invitación más adelante para registrar los pases restantes.
                                </div>

                                <div className="flex flex-col gap-2.5 pt-2">
                                    <button
                                        onClick={() => {
                                            if (attendees.length < remainingPasses) {
                                                setAttendees([...attendees, createEmptyAttendee()]);
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
                                            setCurrentIndex(0);
                                            setMenuStep('mainCourse');
                                        }}
                                        className="w-full py-3 rounded-full font-semibold border border-primary/30 text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                                    >
                                        Continuar de todos modos
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Menu per Attendee */}
                        {step === 3 && (
                            <motion.div
                                key={`att-${currentIndex}-${menuStep}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    {attendees.map((att, index) => (
                                        <div
                                            key={index}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                                index === currentIndex
                                                    ? 'bg-primary text-white scale-110 shadow-sm'
                                                    : 'bg-gray-200 text-gray-500'
                                            }`}
                                            title={fullNameOf(att)}
                                        >
                                            {index + 1}
                                        </div>
                                    ))}
                                </div>

                                {menuStep === 'mainCourse' && (
                                    <>
                                        <h4 className="font-semibold text-gray-700 text-2xl text-center">
                                            Plato fuerte para <span className="text-primary font-heading text-3xl">{fullNameOf(currentAttendee)}</span>
                                        </h4>

                                        <div className="space-y-2 pt-2">
                                            {mainCoursesList.map((course) => (
                                                <motion.button
                                                    key={course.id}
                                                    onClick={() => updateCurrentAttendee({ mainCourse: course })}
                                                    className={`w-full p-3.5 rounded-xl border-2 transition-all duration-200 flex items-center justify-between text-left cursor-pointer ${
                                                        currentAttendee.mainCourse?.id === course.id
                                                            ? 'border-primary bg-primary/10 shadow-sm'
                                                            : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50'
                                                    }`}
                                                    whileHover={{ scale: 1.01 }}
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    <span className="font-medium text-gray-700 text-base break-anywhere">{course.name}</span>
                                                    {currentAttendee.mainCourse?.id === course.id && (
                                                        <div className="bg-primary text-white rounded-full p-1">
                                                            <Check size={14} />
                                                        </div>
                                                    )}
                                                </motion.button>
                                            ))}
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button
                                                onClick={goToPrevAttendee}
                                                className="flex-1 py-3.5 rounded-full font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <ChevronLeft size={18} />
                                                Atrás
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (sidesList.length === 0 || maxSides === 0) {
                                                        goToNextAttendee();
                                                    } else {
                                                        setMenuStep('sides');
                                                    }
                                                }}
                                                disabled={!currentAttendee.mainCourse}
                                                className={`flex-1 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                                    currentAttendee.mainCourse
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

                                {menuStep === 'sides' && (
                                    <>
                                        <h4 className="font-semibold text-gray-700 text-2xl text-center">
                                            Contornos para <span className="text-primary font-heading text-3xl">{fullNameOf(currentAttendee)}</span>
                                        </h4>
                                        <p className="text-xs text-gray-500 text-center mb-4">
                                            Selecciona entre 1 y {maxSides} ({currentAttendee.sides.length}/{maxSides} seleccionados)
                                        </p>

                                        <div className="grid grid-cols-2 gap-2">
                                            {sidesList.map((side) => {
                                                const isSelected = currentAttendee.sides.find((s) => s.id === side.id);
                                                const isDisabled = currentAttendee.sides.length >= maxSides && !isSelected;

                                                return (
                                                    <motion.button
                                                        key={side.id}
                                                        onClick={() => toggleSide(side)}
                                                        disabled={isDisabled}
                                                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center min-h-[70px] cursor-pointer ${
                                                            isSelected
                                                                ? 'border-primary bg-primary/10 shadow-sm'
                                                                : isDisabled
                                                                    ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                                                                    : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <span className="font-medium text-gray-700 text-sm break-anywhere">{side.name}</span>
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
                                                onClick={() => setMenuStep('mainCourse')}
                                                className="flex-1 py-3.5 rounded-full font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <ChevronLeft size={18} />
                                                Atrás
                                            </button>
                                            <button
                                                onClick={goToNextAttendee}
                                                disabled={maxSides > 0 && currentAttendee.sides.length < 1}
                                                className={`flex-1 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                                    maxSides === 0 || currentAttendee.sides.length >= 1
                                                        ? 'bg-primary text-white hover:bg-secondary shadow-md'
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                                {currentIndex < attendees.length - 1 ? 'Siguiente invitado' : 'Ver resumen'}
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* Step 4: Summary */}
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
                                    {attendees.map((a, idx) => (
                                        <div key={idx} className="bg-primary/5 p-3.5 rounded-xl border border-primary/20 text-sm">
                                            <div className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                                                <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                                                    {idx + 1}
                                                </span>
                                                {fullNameOf(a)}
                                            </div>
                                            <div className="text-gray-600 pl-7 text-xs space-y-0.5">
                                                <p>• <strong>Plato:</strong> {a.mainCourse?.name}</p>
                                                {a.sides.length > 0 && (
                                                    <p>• <strong>Contornos:</strong> {a.sides.map((s) => s.name).join(', ')}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {unusedPassesNow > 0 && (
                                    <p className="text-[11px] text-center text-gray-500">
                                        Te quedarán <strong>{unusedPassesNow} {unusedPassesNow === 1 ? 'pase disponible' : 'pases disponibles'}</strong> por si deseas agregar acompañantes luego.
                                    </p>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setStep(3);
                                            setCurrentIndex(attendees.length - 1);
                                            setMenuStep(sidesList.length > 0 && maxSides > 0 ? 'sides' : 'mainCourse');
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
