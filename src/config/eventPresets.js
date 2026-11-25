/**
 * src/config/eventPresets.js
 * ─────────────────────────────────────────────────────────────
 * Event-type tone presets & template helpers.
 * Keeps the codebase 100% event-agnostic while providing warm,
 * elegant, corporate or casual copy tailored to each occasion.
 */

export const EVENT_TYPES = [
    { value: 'wedding', label: 'Boda (Cálido / Romántico)', fileSlug: 'Boda' },
    { value: 'birthday', label: 'Cumpleaños (Festivo / Cercano)', fileSlug: 'Cumpleanos' },
    { value: 'gala', label: 'Fiesta de Gala (Elegante / Formal)', fileSlug: 'Gala' },
    { value: 'corporate', label: 'Almuerzo / Evento Corporativo (Ejecutivo)', fileSlug: 'Corporativo' },
    { value: 'anniversary', label: 'Aniversario (Familiar / Emotivo)', fileSlug: 'Aniversario' },
    { value: 'graduation', label: 'Graduación (Celebración / Logro)', fileSlug: 'Graduacion' },
    { value: 'casual', label: 'Fiesta Casual / Privada (Relajado)', fileSlug: 'Fiesta' },
    { value: 'custom', label: 'Personalizado', fileSlug: 'Evento' },
];

export const EVENT_TYPE_PRESETS = {
    wedding: {
        heroBadge: 'Nos casamos',
        rsvpGroupPrompt: '¿De parte de quién nos acompañas?',
        rsvpWhatsappIntro: '¡Hola! Confirmo asistencia a la boda de {hosts} 💍',
        whatsappTemplate:
            '¡Hola {guest_name}! Estamos muy felices de compartir nuestro día contigo. Esta invitación es válida para {passes}. Confírmanos tu asistencia y menú antes del {rsvp_deadline}. Nos vemos pronto. Con cariño, {hosts} ✨\n\n{link}',
        calendarTitleTemplate: 'Boda {hosts}',
        calendarDescriptionTemplate: 'Acompáñanos a celebrar nuestra boda en {venue}.',
        storyBadge: '¡NOS CASAMOS!',
        storyFooter: '"Acompáñanos a celebrar nuestro gran día"',
        mentionsSectionTitle: 'Con la bendición de',
        specialMentionsTitle: 'Nuestros Padrinos',
        groupALabel: 'Familia de la Novia',
        groupBLabel: 'Familia del Novio',
        contributionsTitle: 'Mesa de Regalos',
        contributionsSubtitle: 'Su presencia es nuestro mejor regalo, pero si desean tener un detalle con nosotros:',
    },
    birthday: {
        heroBadge: 'Celebremos juntos',
        rsvpGroupPrompt: '¿Con cuál grupo familiar o de amigos nos acompañas?',
        rsvpWhatsappIntro: '¡Hola! Confirmo asistencia al cumpleaños de {hosts} 🥂',
        whatsappTemplate:
            '¡Hola {guest_name}! Me encantaría celebrar mi cumpleaños contigo. Tu invitación es válida para {passes}. Confírmame tu asistencia y menú antes del {rsvp_deadline}. ¡Te espero! {hosts} 🎉\n\n{link}',
        calendarTitleTemplate: 'Cumpleaños de {hosts}',
        calendarDescriptionTemplate: 'Acompáñanos a festejar en {venue}.',
        storyBadge: '¡CELEBREMOS JUNTOS!',
        storyFooter: '"Te espero para festejar este día especial"',
        mentionsSectionTitle: 'Agradecimiento especial a',
        specialMentionsTitle: 'Invitados Especiales',
        groupALabel: 'Familia',
        groupBLabel: 'Organización',
        contributionsTitle: 'Detalle / Obsequios',
        contributionsSubtitle: 'Tu compañía es el mejor regalo, pero si deseas tener un detalle:',
    },
    gala: {
        heroBadge: 'Noche de Gala',
        rsvpGroupPrompt: 'Selecciona tu grupo o categoría de invitación',
        rsvpWhatsappIntro: '¡Hola! Confirmo mi asistencia a la gala de {hosts} ✨',
        whatsappTemplate:
            'Estimado(a) {guest_name}, será un honor contar con su presencia. Esta invitación es válida para {passes}. Agradecemos confirmar asistencia y selección gastronómica antes del {rsvp_deadline}. Atentamente, {hosts}.\n\n{link}',
        calendarTitleTemplate: 'Noche de Gala — {hosts}',
        calendarDescriptionTemplate: 'Recepción de gala en {venue}.',
        storyBadge: 'NOCHE DE GALA',
        storyFooter: '"Será un honor contar con tu presencia"',
        mentionsSectionTitle: 'Presentado por',
        specialMentionsTitle: 'Invitados de Honor',
        groupALabel: 'Comité Anfitrión',
        groupBLabel: 'Dirección',
        contributionsTitle: 'Aportes / Cuentas',
        contributionsSubtitle: 'Datos disponibles para aportes o reservaciones:',
    },
    corporate: {
        heroBadge: 'Invitación Especial',
        rsvpGroupPrompt: 'Selecciona tu área, delegación o grupo',
        rsvpWhatsappIntro: 'Hola, confirmo mi asistencia al encuentro de {hosts}.',
        whatsappTemplate:
            'Hola {guest_name}, te invitamos cordialmente a nuestro próximo encuentro. Tu pase es válido para {passes}. Por favor confirma tu asistencia y menú antes del {rsvp_deadline}. Saludos, {hosts}.\n\n{link}',
        calendarTitleTemplate: 'Evento — {hosts}',
        calendarDescriptionTemplate: 'Encuentro corporativo en {venue}.',
        storyBadge: 'ENCUENTRO ESPECIAL',
        storyFooter: '"Reservamos un lugar especial para ti"',
        mentionsSectionTitle: 'Organizado por',
        specialMentionsTitle: 'Ponentes y Comité',
        groupALabel: 'Dirección General',
        groupBLabel: 'Coordinación',
        contributionsTitle: 'Datos de Registro / Cuenta',
        contributionsSubtitle: 'Información bancaria oficial del evento:',
    },
    anniversary: {
        heroBadge: 'Nuestro Aniversario',
        rsvpGroupPrompt: '¿Con cuál grupo familiar o de amigos nos acompañas?',
        rsvpWhatsappIntro: '¡Hola! Confirmo asistencia al aniversario de {hosts} ✨',
        whatsappTemplate:
            '¡Hola {guest_name}! Queremos celebrar un año más juntos contigo. Esta invitación es válida para {passes}. Confírmanos tu asistencia antes del {rsvp_deadline}. Con cariño, {hosts} ✨\n\n{link}',
        calendarTitleTemplate: 'Aniversario — {hosts}',
        calendarDescriptionTemplate: 'Celebración de aniversario en {venue}.',
        storyBadge: '¡FELIZ ANIVERSARIO!',
        storyFooter: '"Gracias por ser parte de nuestra historia"',
        mentionsSectionTitle: 'Acompañados por',
        specialMentionsTitle: 'Menciones Especiales',
        groupALabel: 'Familia',
        groupBLabel: 'Familia',
        contributionsTitle: 'Mesa de Regalos',
        contributionsSubtitle: 'Su compañía es nuestro mayor regalo:',
    },
    graduation: {
        heroBadge: 'Mi Graduación',
        rsvpGroupPrompt: '¿Con cuál grupo familiar o de amigos nos acompañas?',
        rsvpWhatsappIntro: '¡Hola! Confirmo asistencia a la graduación de {hosts} 🎓',
        whatsappTemplate:
            '¡Hola {guest_name}! Quiero compartir este logro contigo. Esta invitación es válida para {passes}. Confírmame tu asistencia antes del {rsvp_deadline}. ¡Nos vemos pronto! {hosts} 🎓\n\n{link}',
        calendarTitleTemplate: 'Graduación de {hosts}',
        calendarDescriptionTemplate: 'Celebración de graduación en {venue}.',
        storyBadge: '¡LO LOGRAMOS!',
        storyFooter: '"Acompáñame a celebrar esta nueva etapa"',
        mentionsSectionTitle: 'Con el apoyo incondicional de',
        specialMentionsTitle: 'Padrinos y Mentores',
        groupALabel: 'Mis Padres',
        groupBLabel: 'Familia',
        contributionsTitle: 'Obsequios / Aportes',
        contributionsSubtitle: 'Gracias por acompañarme en este logro:',
    },
    casual: {
        heroBadge: 'Estás invitado',
        rsvpGroupPrompt: '¿Con cuál grupo vienes?',
        rsvpWhatsappIntro: '¡Hola! Confirmo que me sumo a la fiesta de {hosts} 🎉',
        whatsappTemplate:
            '¡Hola {guest_name}! Te espero para pasarla increíble. Tu invitación vale por {passes}. Avísame si vienes y elige tu menú antes del {rsvp_deadline}. ¡Abrazo! {hosts} 🎉\n\n{link}',
        calendarTitleTemplate: 'Fiesta — {hosts}',
        calendarDescriptionTemplate: 'Nos vemos en {venue}.',
        storyBadge: '¡ESTÁS INVITADO!',
        storyFooter: '"¡No faltes a la celebración!"',
        mentionsSectionTitle: 'Organizan',
        specialMentionsTitle: 'Invitados Especiales',
        groupALabel: 'Anfitriones',
        groupBLabel: 'Co-organizadores',
        contributionsTitle: 'Aportes / Cuentas',
        contributionsSubtitle: 'Datos disponibles para aportes:',
    },
};

/**
 * Formats 1 or 2 hosts naturally:
 * - 2 hosts: "Primary & Secondary"
 * - 1 host:  "Primary"
 */
export function formatHostsNames(hosts) {
    const primary = hosts?.primary?.firstName?.trim() || '';
    const secondary = hosts?.secondary?.firstName?.trim() || '';
    if (primary && secondary) return `${primary} & ${secondary}`;
    return primary || secondary || 'Organizadores';
}

/**
 * Replaces both English agnostic placeholders and legacy Spanish placeholders
 * so existing custom templates in DB never break.
 */
export function interpolateTemplate(template = '', vars = {}) {
    return String(template)
        .replace(/\{guest_name\}|\{nombre\}/g, vars.guestName ?? '')
        .replace(/\{passes\}|\{personas\}/g, vars.passes ?? '')
        .replace(/\{rsvp_deadline\}|\{fecha_limite\}/g, vars.rsvpDeadline ?? '')
        .replace(/\{hosts\}|\{novios\}/g, vars.hosts ?? '')
        .replace(/\{link\}|\{enlace\}/g, vars.link ?? '')
        .replace(/\{venue\}/g, vars.venue ?? '');
}

export function getEventSlug(eventType) {
    return EVENT_TYPES.find((t) => t.value === eventType)?.fileSlug || 'Evento';
}
