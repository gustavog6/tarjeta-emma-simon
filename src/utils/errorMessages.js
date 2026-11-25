/**
 * src/utils/errorMessages.js
 * Maps PostgreSQL / Supabase error codes & RPC keys to clear UI messages.
 */

const ERROR_MAP = {
    capacity_exceeded: 'El cupo de este invitado está lleno (titular + acompañantes permitidos).',
    passes_exhausted: 'Ya utilizaste todos los pases disponibles de tu invitación.',
    passes_below_confirmed_count:
        'No puedes reducir los pases adicionales por debajo de las personas ya confirmadas. Primero elimina asistentes.',
    invalid_invitation: 'El enlace de invitación no es válido.',
    no_attendees: 'Debe registrarse al menos un asistente.',
    incomplete_attendee_name: 'Nombre y apellido son obligatorios para cada asistente.',
    incomplete_menu: 'Falta elegir el plato principal.',
    invalid_main_course: 'El plato elegido ya no está disponible en el menú.',
    invalid_side: 'Uno de los acompañamientos elegidos ya no está disponible en el menú.',
    too_many_sides: 'Se eligieron más acompañamientos de los permitidos.',
    gallery_full: 'La galería alcanzó el límite máximo de fotos para este evento.',
    max_limit_reached: 'Se alcanzó el número máximo de elementos permitidos para mantener el diseño.',
    min_limit_reached: 'No puedes dejar esta sección por debajo del mínimo obligatorio.',
    unauthorized: 'No tienes permiso para esta acción. Inicia sesión nuevamente.',
};

export function formatDbError(err) {
    const msg = err?.message || '';
    for (const key of Object.keys(ERROR_MAP)) {
        if (msg.includes(key)) return ERROR_MAP[key];
    }
    if (err?.code === '23503') {
        return 'No puedes eliminar este registro porque todavía está en uso (por ejemplo, un grupo con invitados asignados).';
    }
    if (err?.code === '23505') {
        return 'Ya existe un registro duplicado.';
    }
    if (err?.code === '23514') {
        return 'Uno de los campos excede la longitud máxima permitida o incumple una regla de validación.';
    }
    if (err?.code === '42501') {
        return 'Sin permisos: inicia sesión nuevamente.';
    }
    return msg || 'Ocurrió un error inesperado.';
}
