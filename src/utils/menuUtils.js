/**
 * src/utils/menuUtils.js
 * Canonical ID resolution and attendee name formatting helpers.
 */

export const slugify = (str = '') =>
    str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'item';

export const findMenuItem = (list = [], value) =>
    list.find((i) => i.id === value) || list.find((i) => i.name === value) || null;

export const getMenuItemLabel = (list, value) => {
    if (!value) return '—';
    const item = findMenuItem(list, value);
    return item ? item.name : `${value} (retirado del menú)`;
};

export const getCanonicalId = (list, value) => findMenuItem(list, value)?.id ?? value;

export const splitFullName = (full = '') => {
    const trimmed = full.trim();
    const idx = trimmed.indexOf(' ');
    return idx < 0
        ? { firstName: trimmed, lastName: '' }
        : { firstName: trimmed.slice(0, idx), lastName: trimmed.slice(idx + 1).trim() };
};

export const getAttendeeNames = (attendee) =>
    attendee.first_name && attendee.last_name
        ? { firstName: attendee.first_name, lastName: attendee.last_name }
        : splitFullName(attendee.full_name);

export const getAttendeeFullName = (attendee) =>
    attendee.first_name && attendee.last_name
        ? `${attendee.first_name} ${attendee.last_name}`
        : attendee.full_name || '';

export const generateUniqueId = (name, existingItems = []) => {
    const base = slugify(name);
    const ids = new Set(existingItems.map((e) => e.id));
    if (!ids.has(base)) return base;
    let n = 2;
    while (ids.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
};
