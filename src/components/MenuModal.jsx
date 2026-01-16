import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UtensilsCrossed, Check, ChevronRight, ChevronLeft, MessageCircle, Users, User, Plus, Trash2, Heart } from 'lucide-react';
import vestido from '../assets/vestido-verde.png';
import camisa from '../assets/camisa-verde.png';

const PLATOS_FUERTES = [
    { id: 'pollo-grill', nombre: 'Pechuga de pollo al grill', emoji: '🍗' },
    { id: 'pollo-limon', nombre: 'Pechuga de pollo al limón', emoji: '🍋' },
    { id: 'pollo-parmesana', nombre: 'Pechuga de pollo a la parmesana', emoji: '🧀' },
    { id: 'asado-negro', nombre: 'Asado Negro', emoji: '🥩' },
    { id: 'pescado-ajillo', nombre: 'Pescado al ajillo', emoji: '🐟' },
];

const CONTORNOS = [
    { id: 'vegetales', nombre: 'Vegetales salteados', emoji: '🥦' },
    { id: 'ensalada', nombre: 'Ensalada verde', emoji: '🥗' },
    { id: 'papas-vapor', nombre: 'Papas al vapor', emoji: '🥔' },
    { id: 'papas-fritas', nombre: 'Papas fritas', emoji: '🍟' },
    { id: 'pure', nombre: 'Puré de papas', emoji: '🥣' },
    { id: 'arroz', nombre: 'Arroz', emoji: '🍚' },
];

const createEmptyGuest = () => ({
    nombre: '',
    platoFuerte: null,
    contornos: [],
});

const MenuModal = ({ isOpen, onClose }) => {
    // Step 1: Cantidad de personas y nombres
    // Step 2: Selección de menú para cada invitado
    // Step 3: Resumen y confirmación
    const [step, setStep] = useState(1);
    const [guests, setGuests] = useState([createEmptyGuest()]);
    const [currentGuestIndex, setCurrentGuestIndex] = useState(0);
    const [menuStep, setMenuStep] = useState('platoFuerte'); // 'platoFuerte', 'contornos'
    const [invitadoDe, setInvitadoDe] = useState(null); // 'novia' o 'novio'

    const currentGuest = guests[currentGuestIndex];

    // Números de WhatsApp
    const WHATSAPP_NOVIA = '+584249743171';
    const WHATSAPP_NOVIO = '+584140110568';

    const resetSelections = () => {
        setStep(1);
        setGuests([createEmptyGuest()]);
        setCurrentGuestIndex(0);
        setMenuStep('platoFuerte');
        setInvitadoDe(null);
    };

    const handleClose = () => {
        resetSelections();
        onClose();
    };

    const addGuest = () => {
        if (guests.length < 5) {
            setGuests([...guests, createEmptyGuest()]);
        }
    };

    const removeGuest = (index) => {
        if (guests.length > 1) {
            const newGuests = guests.filter((_, i) => i !== index);
            setGuests(newGuests);
            if (currentGuestIndex >= newGuests.length) {
                setCurrentGuestIndex(newGuests.length - 1);
            }
        }
    };

    const updateCurrentGuest = (updates) => {
        const newGuests = [...guests];
        newGuests[currentGuestIndex] = { ...currentGuest, ...updates };
        setGuests(newGuests);
    };

    const toggleContorno = (contorno) => {
        const currentContornos = currentGuest.contornos;
        if (currentContornos.find(c => c.id === contorno.id)) {
            updateCurrentGuest({ contornos: currentContornos.filter(c => c.id !== contorno.id) });
        } else if (currentContornos.length < 2) {
            updateCurrentGuest({ contornos: [...currentContornos, contorno] });
        }
    };

    const isCurrentGuestComplete = () => {
        return currentGuest.nombre.trim() &&
            currentGuest.platoFuerte &&
            currentGuest.contornos.length === 2;
    };

    const areAllGuestsComplete = () => {
        return guests.every(g => g.nombre.trim() && g.platoFuerte && g.contornos.length === 2);
    };

    const allGuestsHaveNames = () => {
        return guests.every(g => g.nombre.trim());
    };

    const canContinueStep1 = () => {
        return invitadoDe && allGuestsHaveNames();
    };

    const goToNextGuest = () => {
        if (currentGuestIndex < guests.length - 1) {
            setCurrentGuestIndex(currentGuestIndex + 1);
            setMenuStep('platoFuerte');
        } else {
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

    const updateGuestName = (index, nombre) => {
        const newGuests = [...guests];
        newGuests[index] = { ...newGuests[index], nombre };
        setGuests(newGuests);
    };

    const generateWhatsAppLink = () => {
        let mensaje = `Hola, confirmo asistencia a la boda de Emma y Simón\n\n`;
        mensaje += `*Invitados de:* ${invitadoDe === 'novia' ? 'Emma (Novia)' : 'Simón (Novio)'}\n`;
        mensaje += `*Total de personas:* ${guests.length}\n\n`;

        guests.forEach((guest, index) => {
            const contornos = guest.contornos.map(c => c.nombre).join(' y ');
            mensaje += `*Invitado ${index + 1}:* ${guest.nombre}\n`;
            mensaje += `• Plato fuerte: ${guest.platoFuerte?.nombre}\n`;
            mensaje += `• Contornos: ${contornos}\n\n`;
        });

        mensaje += `¡Nos vemos el Sábado 31 de enero a las 11:30 AM!`;

        const mensajeCodificado = encodeURIComponent(mensaje);
        const numeroWhatsApp = invitadoDe === 'novia' ? WHATSAPP_NOVIA : WHATSAPP_NOVIO;
        return `https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`;
    };

    // const handleConfirm = () => {
    //     const link = generateWhatsAppLink();
    //     window.open(link, '_blank');
    //     handleClose();
    // };

    // const handleConfirm = async () => {
    //     // Primero enviar TODOS los invitados a Google Forms
    //     await enviarConfirmacionGoogleForms(guests, invitadoDe);

    //     // Luego abrir WhatsApp
    //     const link = generateWhatsAppLink();
    //     window.open(link, '_blank');

    //     // Cerrar modal
    //     handleClose();
    // };

    // Si quieres usar la versión detallada (con info del grupo):
    // Versión detallada optimizada para móvil (evita bloqueadores de pop-ups)
    const handleConfirmDetallado = () => {
        // Enviar a Google Forms en segundo plano
        enviarConfirmacionDetallada(guests, invitadoDe);

        // Generar y abrir link de WhatsApp
        const link = generateWhatsAppLink();

        // En móviles, window.location.href es más fiable que window.open
        window.location.href = link;

        // Pequeño delay para cerrar el modal permitiendo que el sistema procese el link
        setTimeout(() => {
            handleClose();
        }, 1000);
    };

    const getTotalSteps = () => 4;

    const getStepLabel = () => {
        if (step === 1) return 'Paso 1/4: Fui invitado por...';
        if (step === 2) return 'Paso 2/4: ¿Quiénes asisten?';
        if (step === 3) {
            if (menuStep === 'platoFuerte') return `${currentGuest.nombre}: Plato fuerte`;
            if (menuStep === 'contornos') return `${currentGuest.nombre}: Contornos`;
        }
        if (step === 4) return 'Paso 4/4: Confirmar asistencia';
        return '';
    };

    if (!isOpen) return null;

    // VERSIÓN ALTERNATIVA: Con información del grupo
    const enviarConfirmacionDetallada = async (guests, invitadoDe) => {
        try {
            const urlFormulario = 'https://docs.google.com/forms/d/e/1FAIpQLSeH1dJoByFaPF-9sjGLx6Q7Juuc3NJqIwbeLmXSNULnQaD_og/formResponse';

            // Enviar UN REGISTRO POR CADA invitado
            const promesas = guests.map((guest, index) => {
                const contornos = guest.contornos.map(c => c.nombre).join(' y ');
                const menuPersonal = `Grupo de ${guests.length} persona(s) - Invitado ${index + 1}
    Plato fuerte: ${guest.platoFuerte?.nombre}
    Contornos: ${contornos}`;

                // Usamos URLSearchParams para asegurar que los datos se envíen correctamente
                const params = new URLSearchParams();
                params.append('entry.1515782771', guest.nombre); // nombre-completo
                params.append('entry.43679086', invitadoDe === 'novia' ? 'Emma (Novia)' : 'Simón (Novio)'); // invitado de
                params.append('entry.1250341504', menuPersonal); // menu

                return fetch(urlFormulario, {
                    method: 'POST',
                    body: params,
                    mode: 'no-cors',
                    keepalive: true // Permite que la petición termine aunque se navegue a otra página
                });
            });

            await Promise.all(promesas);

            console.log(`✅ ${guests.length} confirmación(es) enviada(s) a Google Forms`);
            return true;
        } catch (error) {
            console.error('❌ Error al enviar a Google Forms:', error);
            return false;
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                />

                {/* Modal */}
                <motion.div
                    className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative z-10 glass-panel border-2 border-primary/20 max-h-[90vh] overflow-y-auto"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    {/* Header */}
                    <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md p-6 text-center border-b border-gray-100 shadow-sm">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-primary">
                            <UtensilsCrossed size={32} />
                        </div>
                        <h3 className="font-heading text-4xl text-primary">Confirmar Asistencia</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                            {getStepLabel()}
                        </p>

                        {/* Progress bar */}
                        <div className="flex gap-2 justify-center mt-4">
                            {[1, 2, 3, 4].map((s) => (
                                <div
                                    key={s}
                                    className={`h-2 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary w-8' : 'bg-gray-300 w-4'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Step 1: Selección Novio/Novia */}
                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center">
                                    <Heart size={48} className="mx-auto text-primary mb-3" />
                                    <h4 className="font-semibold text-gray-500 text-3xl tracking-wide">
                                        ¿De parte de quién asisten?
                                    </h4>
                                    <p className="text-sm text-gray-400 mt-2">
                                        Selecciona una opción
                                    </p>
                                </div>

                                <div className="flex gap-4">
                                    <motion.button
                                        onClick={() => setInvitadoDe('novia')}
                                        className={`flex-1 p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${invitadoDe === 'novia'
                                            ? 'border-pink-400 bg-pink-50 shadow-lg'
                                            : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
                                            }`}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${invitadoDe === 'novia' ? 'bg-pink-200 text-white' : 'bg-pink-100 text-pink-400'
                                            }`}>
                                            {/* <Heart size={32} /> */}
                                            <img src={vestido} alt="Vestido" className="w-10 h-10 object-contain" />
                                        </div>
                                        <span className="font-bold text-xl text-gray-500">Emma</span>
                                        <span className="text-sm text-gray-500 italic">La Novia</span>
                                    </motion.button>

                                    <motion.button
                                        onClick={() => setInvitadoDe('novio')}
                                        className={`flex-1 p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${invitadoDe === 'novio'
                                            ? 'border-blue-400 bg-blue-50 shadow-lg'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                                            }`}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${invitadoDe === 'novio' ? 'bg-blue-200 text-white' : 'bg-blue-100 text-blue-400'
                                            }`}>
                                            <img src={camisa} alt="Camisa" className="w-10 h-10 object-contain" />
                                        </div>
                                        <span className="font-bold text-xl text-gray-500">Simón</span>
                                        <span className="text-sm text-gray-500 italic">El Novio</span>
                                    </motion.button>
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!invitadoDe}
                                    className={`w-full mt-4 py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${invitadoDe
                                        ? 'bg-primary text-white hover:bg-secondary shadow-lg hover:shadow-xl'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    Continuar
                                    <ChevronRight size={20} />
                                </button>
                            </motion.div>
                        )}

                        {/* Step 2: Nombres de invitados */}
                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="text-center mb-4">
                                    <Users size={48} className="mx-auto text-primary mb-3" />
                                    <h4 className="font-semibold text-gray-500 text-3xl tracking-wider">
                                        ¿Quiénes van a asistir?
                                    </h4>
                                    {/* <p className="text-sm text-gray-400 mt-2">
                                        Ingresa el nombre de cada invitado (máximo 5)
                                    </p> */}
                                </div>

                                {/* Lista de invitados con campo de nombre */}
                                <div className="space-y-3">
                                    {guests.map((guest, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border-2 border-gray-200"
                                        >
                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                                                <User size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                value={guest.nombre}
                                                onChange={(e) => updateGuestName(index, e.target.value)}
                                                placeholder={`Nombre del invitado ${index + 1}`}
                                                className="flex-1 px-1 py-1 bg-transparent border-0 border-b-2 border-gray-300 focus:border-primary focus:outline-none transition-all text-gray-500 placeholder:text-gray-400"
                                            />
                                            {guests.length > 1 && (
                                                <button
                                                    onClick={() => removeGuest(index)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Botón agregar */}
                                {guests.length < 5 && (
                                    <motion.button
                                        onClick={addGuest}
                                        className="w-full p-4 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Plus size={20} />
                                        Agregar otra persona
                                    </motion.button>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-4 rounded-full font-bold border-2 border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ChevronLeft size={20} />
                                        Atrás
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStep(3);
                                            setCurrentGuestIndex(0);
                                            setMenuStep('platoFuerte');
                                        }}
                                        disabled={!allGuestsHaveNames()}
                                        className={`flex-1 py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${allGuestsHaveNames()
                                            ? 'bg-primary text-white hover:bg-secondary shadow-lg hover:shadow-xl'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        Continuar
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Datos de cada invitado */}
                        {step === 3 && (
                            <motion.div
                                key={`guest-${currentGuestIndex}-${menuStep}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                {/* Indicador de invitado actual */}
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    {guests.map((guest, index) => (
                                        <div
                                            key={index}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${index === currentGuestIndex
                                                ? 'bg-primary text-white scale-110'
                                                : index < currentGuestIndex && guests[index].platoFuerte && guests[index].contornos.length === 2
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-200 text-gray-500'
                                                }`}
                                            title={guest.nombre}
                                        >
                                            {index < currentGuestIndex && guests[index].platoFuerte && guests[index].contornos.length === 2 ? (
                                                <Check size={16} />
                                            ) : (
                                                index + 1
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Sub-step: Plato Fuerte */}
                                {menuStep === 'platoFuerte' && (
                                    <>
                                        <h4 className="font-semibold text-gray-500 text-3xl mb-4 text-center tracking-wider">
                                            Plato fuerte para <span className="text-primary">{currentGuest.nombre}</span>
                                        </h4>

                                        <div className="space-y-2">
                                            {PLATOS_FUERTES.map((plato) => (
                                                <motion.button
                                                    key={plato.id}
                                                    onClick={() => updateCurrentGuest({ platoFuerte: plato })}
                                                    className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 text-left ${currentGuest.platoFuerte?.id === plato.id
                                                        ? 'border-primary bg-primary/10 shadow-md'
                                                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                                                        }`}
                                                    whileHover={{ scale: 1.01 }}
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    {/* <span className="text-xl">{plato.emoji}</span> */}
                                                    <span className="flex-1 font-medium italic text-gray-500 text-base text-center">{plato.nombre}</span>
                                                    {currentGuest.platoFuerte?.id === plato.id && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="bg-primary text-white rounded-full p-1"
                                                        >
                                                            <Check size={14} />
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            ))}
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button
                                                onClick={goToPrevGuest}
                                                className="flex-1 py-4 rounded-full font-bold border-2 border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                <ChevronLeft size={20} />
                                                Atrás
                                            </button>
                                            <button
                                                onClick={() => setMenuStep('contornos')}
                                                disabled={!currentGuest.platoFuerte}
                                                className={`flex-1 py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${currentGuest.platoFuerte
                                                    ? 'bg-primary text-white hover:bg-secondary shadow-lg'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                Siguiente
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* Sub-step: Contornos */}
                                {menuStep === 'contornos' && (
                                    <>
                                        <h4 className="font-semibold text-gray-500 text-3xl mb-2 text-center tracking-wider">
                                            Contornos para <span className="text-primary">{currentGuest.nombre}</span>
                                        </h4>
                                        <p className="text-sm text-gray-500 text-center mb-4">
                                            {currentGuest.contornos.length}/2 seleccionados
                                        </p>

                                        <div className="grid grid-cols-2 gap-2">
                                            {CONTORNOS.map((contorno) => {
                                                const isSelected = currentGuest.contornos.find(c => c.id === contorno.id);
                                                const isDisabled = currentGuest.contornos.length >= 2 && !isSelected;

                                                return (
                                                    <motion.button
                                                        key={contorno.id}
                                                        onClick={() => toggleContorno(contorno)}
                                                        disabled={isDisabled}
                                                        className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1 ${isSelected
                                                            ? 'border-primary bg-primary/10 shadow-md'
                                                            : isDisabled
                                                                ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                                                : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                                                            }`}
                                                        whileHover={!isDisabled ? { scale: 1.02 } : {}}
                                                        whileTap={!isDisabled ? { scale: 0.98 } : {}}
                                                    >
                                                        {/* <span className="text-xl">{contorno.emoji}</span> */}
                                                        <span className="font-medium italic text-gray-500 text-base text-center">
                                                            {contorno.nombre}
                                                        </span>
                                                        {isSelected && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="bg-primary text-white rounded-full p-0.5"
                                                            >
                                                                <Check size={12} />
                                                            </motion.div>
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button
                                                onClick={() => setMenuStep('platoFuerte')}
                                                className="flex-1 py-4 rounded-full font-bold border-2 border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                <ChevronLeft size={20} />
                                                Atrás
                                            </button>
                                            <button
                                                onClick={goToNextGuest}
                                                disabled={currentGuest.contornos.length !== 2}
                                                className={`flex-1 py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${currentGuest.contornos.length === 2
                                                    ? 'bg-primary text-white hover:bg-secondary shadow-lg'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {currentGuestIndex < guests.length - 1 ? (
                                                    <>
                                                        Sig. invitado
                                                        <ChevronRight size={20} />
                                                    </>
                                                ) : (
                                                    <>
                                                        Ver resumen
                                                        <ChevronRight size={20} />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* Step 4: Resumen y confirmación */}
                        {step === 4 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="text-center mb-4">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Check size={32} className="text-green-600" />
                                    </div>
                                    <h4 className="font-semibold text-gray-500 text-3xl tracking-wider">
                                        ¡Todo listo!
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                        Revisa tu selección antes de confirmar
                                    </p>
                                </div>

                                {/* Resumen de todos los invitados */}
                                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                    {guests.map((guest, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-gradient-to-br from-primary/5 to-secondary/10 p-4 rounded-xl border border-primary"
                                        >
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                    {index + 1}
                                                </div>
                                                <span className="font-semibold text-gray-500">{guest.nombre}</span>
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 bg-white/80 p-2 rounded-lg justify-center w-fit px-4">
                                                    {/* <span>{guest.platoFuerte?.emoji}</span> */}
                                                    <span className="text-gray-500 text-sm italic">{guest.platoFuerte?.nombre}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {guest.contornos.map((contorno) => (
                                                        <div
                                                            key={contorno.id}
                                                            className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded-lg"
                                                        >
                                                            {/* <span>{contorno.emoji}</span> */}
                                                            <span className="text-gray-500 text-sm italic">{contorno.nombre}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setStep(3);
                                            setCurrentGuestIndex(guests.length - 1);
                                            setMenuStep('contornos');
                                        }}
                                        className="flex-1 py-4 rounded-full font-bold border-2 border-gray-200 text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ChevronLeft size={20} />
                                        Editar
                                    </button>
                                    <button
                                        onClick={handleConfirmDetallado}
                                        className="flex-1 py-4 rounded-full font-bold flex items-center justify-center gap-2 bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl transition-all"
                                    >
                                        <MessageCircle size={20} />
                                        Confirmar
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* <div className="p-4 text-center bg-white/90 backdrop-blur-md text-xs text-gray-400 sticky bottom-0 z-10 border-t border-gray-100 uppercase tracking-widest">
                        ¡Esperamos verte pronto! 💕
                    </div> */}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MenuModal;
