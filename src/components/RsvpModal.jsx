import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, UtensilsCrossed, Check, ChevronRight, ChevronLeft,
    MessageCircle, Users, Plus, Trash2, Heart, AlertCircle
} from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { supabase } from '../lib/supabase';
import { parseFecha } from '../utils/fechas';
import { friendlyError } from '../utils/errores';
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

const RsvpModal = ({ isOpen, onClose, invitado, onConfirmed }) => {
    const { config } = useConfig();
    const { novios, menu, fecha, textos } = config;
    const rawSlots = invitado?.slots_totales ?? invitado?.slots ?? 0;
    const maxSlots = 1 + (Number(rawSlots) || 0);
    const defaultGrupo = invitado?.grupo || null;

    const initialTitular = () =>
        createEmptyGuest(invitado?.nombre || '', invitado?.apellido || '', true);

    const [step, setStep] = useState(1);
    const [invitadoDe, setInvitadoDe] = useState(defaultGrupo);
    const [guests, setGuests] = useState([initialTitular()]);
    const [currentGuestIndex, setCurrentGuestIndex] = useState(0);
    const [menuStep, setMenuStep] = useState('platoFuerte');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    if (!isOpen) return null;

    const currentGuest = guests[currentGuestIndex];
    const maxContornos = menu?.maxContornos ?? 2;

    const resetSelections = () => {
        setStep(1);
        setGuests([initialTitular()]);
        setCurrentGuestIndex(0);
        setMenuStep('platoFuerte');
        setInvitadoDe(defaultGrupo);
        setSubmitting(false);
        setSubmitError(null);
    };

    const handleClose = () => {
        resetSelections();
        onClose();
    };

    const addGuest = () => {
        if (guests.length < maxSlots) {
            setGuests([...guests, createEmptyGuest()]);
        }
    };

    const removeGuest = (index) => {
        if (guests.length > 1 && index > 0) {
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
        const phone = invitadoDe === 'novia' ? novia.whatsapp : novio.whatsapp;

        let mensaje = `¡Hola! Confirmo asistencia a la boda de ${novio.nombre} & ${novia.nombre} 💍\n\n`;
        mensaje += `*Invitados de:* ${invitadoDe === 'novia' ? `${novia.nombre} (Novia)` : `${novio.nombre} (Novio)`}\n`;
        mensaje += `*Total de personas:* ${guests.length}\n\n`;

        guests.forEach((guest, index) => {
            const contornos = guest.contornos.map((c) => c.nombre).join(' y ');
            mensaje += `*Invitado ${index + 1}:* ${fullNameOf(guest)}\n`;
            if (guest.platoFuerte) {
                mensaje += `• Plato fuerte: ${guest.platoFuerte.nombre}\n`;
            }
            if (contornos) {
                mensaje += `• Contornos: ${contornos}\n`;
            }
            if (guest.regalo) {
                mensaje += `• Regalo: ${guest.regalo}\n`;
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
                onConfirmed(data || { ...invitado, confirmed_at: new Date().toISOString() });
            }

            // Solo abrimos WhatsApp si la confirmación se guardó con éxito en BD
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
        if (step === 2) return `Paso 2/4: ¿Quiénes asisten? (Máx ${maxSlots})`;
        if (step === 3) {
            if (menuStep === 'platoFuerte') return `${fullNameOf(currentGuest)}: Plato fuerte`;
            if (menuStep === 'contornos') return `${fullNameOf(currentGuest)}: Contornos`;
        }
        if (step === 4) return 'Paso 4/4: Confirmar asistencia';
        return '';
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                />

                <motion.div
                    className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative z-10 glass-panel border-2 border-primary/20 max-h-[90vh] overflow-y-auto"
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
                        <h3 className="font-heading text-4xl text-primary">{textos?.rsvp?.titulo || 'Confirmar Asistencia'}</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                            {getStepLabel()}
                        </p>

                        <div className="flex gap-2 justify-center mt-4">
                            {[1, 2, 3, 4].map((s) => (
                                <div
                                    key={s}
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        s <= step ? 'bg-primary w-8' : 'bg-gray-300 w-4'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Step 1: Novia / Novio */}
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

                                <div className="flex gap-4">
                                    <motion.button
                                        onClick={() => setInvitadoDe('novia')}
                                        className={`flex-1 p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 cursor-pointer ${
                                            invitadoDe === 'novia'
                                                ? 'border-pink-400 bg-pink-50 shadow-md'
                                                : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
                                        }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                            invitadoDe === 'novia' ? 'bg-pink-200 text-white' : 'bg-pink-100 text-pink-400'
                                        }`}>
                                            <img src={vestido} alt="Novia" className="w-10 h-10 object-contain" />
                                        </div>
                                        <span className="font-bold text-xl text-gray-700">{novios.novia.nombre}</span>
                                        <span className="text-xs text-gray-500 uppercase tracking-widest">La Novia</span>
                                    </motion.button>

                                    <motion.button
                                        onClick={() => setInvitadoDe('novio')}
                                        className={`flex-1 p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 cursor-pointer ${
                                            invitadoDe === 'novio'
                                                ? 'border-blue-400 bg-blue-50 shadow-md'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                                        }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                            invitadoDe === 'novio' ? 'bg-blue-200 text-white' : 'bg-blue-100 text-blue-400'
                                        }`}>
                                            <img src={camisa} alt="Novio" className="w-10 h-10 object-contain" />
                                        </div>
                                        <span className="font-bold text-xl text-gray-700">{novios.novio.nombre}</span>
                                        <span className="text-xs text-gray-500 uppercase tracking-widest">El Novio</span>
                                    </motion.button>
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

                        {/* Step 2: Nombres y Apellidos de invitados */}
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
                                        ¿Quiénes van a asistir?
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Tu invitación es válida para hasta <strong>{maxSlots} persona{maxSlots > 1 ? 's' : ''}</strong> (Tú + {rawSlots} acompañante{Number(rawSlots) === 1 ? '' : 's'}).
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {guests.map((guest, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0 font-bold text-xs">
                                                        {index + 1}
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                        {index === 0 ? 'Titular' : `Acompañante ${index}`}
                                                    </span>
                                                </div>
                                                {guests.length > 1 && index > 0 && (
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
                                                    readOnly={index === 0 && Boolean(invitado?.nombre)}
                                                    placeholder="Nombre *"
                                                    className={`w-full px-2.5 py-1.5 rounded-lg border text-sm focus:border-primary focus:outline-none ${
                                                        index === 0 && invitado?.nombre
                                                            ? 'bg-gray-100 border-gray-200 text-gray-600'
                                                            : 'bg-white border-gray-300 text-gray-700'
                                                    }`}
                                                />
                                                <input
                                                    type="text"
                                                    value={guest.apellido}
                                                    onChange={(e) => updateGuestField(index, 'apellido', e.target.value)}
                                                    readOnly={index === 0 && Boolean(invitado?.apellido)}
                                                    placeholder="Apellido *"
                                                    className={`w-full px-2.5 py-1.5 rounded-lg border text-sm focus:border-primary focus:outline-none ${
                                                        index === 0 && invitado?.apellido
                                                            ? 'bg-gray-100 border-gray-200 text-gray-600'
                                                            : 'bg-white border-gray-300 text-gray-700'
                                                    }`}
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {guests.length < maxSlots && (
                                    <motion.button
                                        onClick={addGuest}
                                        className="w-full p-3 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm font-semibold"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Plus size={18} />
                                        Agregar acompañante ({guests.length}/{maxSlots})
                                    </motion.button>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-3.5 rounded-full font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <ChevronLeft size={18} />
                                        Atrás
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStep(3);
                                            setCurrentGuestIndex(0);
                                            setMenuStep('platoFuerte');
                                        }}
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
                                            {(menu?.platosFuertes || []).map((plato) => (
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
                                                onClick={() => setMenuStep('contornos')}
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
                                            {currentGuest.contornos.length}/{maxContornos} seleccionados
                                        </p>

                                        <div className="grid grid-cols-2 gap-2">
                                            {(menu?.contornos || []).map((contorno) => {
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
                                                disabled={currentGuest.contornos.length !== maxContornos}
                                                className={`flex-1 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                                    currentGuest.contornos.length === maxContornos
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
