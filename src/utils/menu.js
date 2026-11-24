/**
 * Utilidades del menú. La BD guarda plato y contornos como ID;
 * los nombres siempre se resuelven desde la configuración.
 */

export const slugify = (s = '') =>
    s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'item';

/** Busca por id y, por compatibilidad con datos viejos, también por nombre */
export const findItem = (list = [], v) =>
    list.find((i) => i.id === v) || list.find((i) => i.nombre === v) || null;

/** Nombre legible. Si el ítem ya no existe en el menú lo indica. */
export const labelOf = (list, v) => {
    if (!v) return '—';
    const it = findItem(list, v);
    return it ? it.nombre : `${v} (retirado del menú)`;
};

/** ID canónico de un valor (id o nombre viejo) */
export const canonicalId = (list, v) => findItem(list, v)?.id ?? v;

export const splitNombre = (full = '') => {
    const t = full.trim();
    const i = t.indexOf(' ');
    return i < 0
        ? { nombre: t, apellido: '' }
        : { nombre: t.slice(0, i), apellido: t.slice(i + 1).trim() };
};

/** Nombre y apellido de una fila de `confirmaciones` (compatible con filas viejas) */
export const nombreApellidoDe = (a) =>
    a.nombre && a.apellido ? { nombre: a.nombre, apellido: a.apellido } : splitNombre(a.nombre_completo);

export const nombreCompletoDe = (a) =>
    a.nombre && a.apellido ? `${a.nombre} ${a.apellido}` : a.nombre_completo || '';

/** Genera un id único a partir de un nombre */
export const uniqueId = (nombre, existentes = []) => {
    const base = slugify(nombre);
    const ids = new Set(existentes.map((e) => e.id));
    if (!ids.has(base)) return base;
    let n = 2;
    while (ids.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
};
