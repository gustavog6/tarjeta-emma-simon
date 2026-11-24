const MENSAJES = {
    cupo_excedido: 'El cupo de este invitado está lleno (titular + acompañantes permitidos).',
    slots_menor_que_confirmados:
        'No puedes bajar los acompañantes permitidos por debajo de las personas ya confirmadas. Primero elimina asistentes.',
    ya_confirmado: 'Esta invitación ya fue confirmada.',
    invitacion_invalida: 'La invitación no es válida.',
    sin_asistentes: 'Debe haber al menos un asistente.',
    datos_incompletos: 'Nombre y apellido son obligatorios para cada asistente.',
    menu_incompleto: 'Falta elegir el plato fuerte.',
    plato_invalido: 'El plato elegido ya no está disponible en el menú.',
    contorno_invalido: 'Uno de los contornos elegidos ya no está disponible en el menú.',
    demasiados_contornos: 'Se eligieron más contornos de los permitidos.',
    no_autorizado: 'No tienes permiso para esta acción. Inicia sesión de nuevo.',
};

export function friendlyError(err) {
    const msg = err?.message || '';
    for (const key of Object.keys(MENSAJES)) {
        if (msg.includes(key)) return MENSAJES[key];
    }
    if (err?.code === '23505') return 'Ya existe un registro duplicado (por ejemplo, un titular repetido).';
    if (err?.code === '42501') return 'Sin permisos: inicia sesión de nuevo.';
    return msg || 'Ocurrió un error inesperado.';
}
