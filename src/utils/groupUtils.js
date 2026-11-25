/**
 * src/utils/groupUtils.js
 * Styling and lookup helpers for dynamic guest groups (`guest_groups` table).
 */

export const GROUP_COLORS = {
    pink: {
        label: 'Rosa',
        badge: 'bg-pink-100 text-pink-700',
        cardActive: 'border-pink-400 bg-pink-50 shadow-md',
        cardIdle: 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50',
        circleActive: 'bg-pink-200 text-pink-700',
        circleIdle: 'bg-pink-100 text-pink-500',
    },
    blue: {
        label: 'Azul',
        badge: 'bg-blue-100 text-blue-700',
        cardActive: 'border-blue-400 bg-blue-50 shadow-md',
        cardIdle: 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50',
        circleActive: 'bg-blue-200 text-blue-700',
        circleIdle: 'bg-blue-100 text-blue-500',
    },
    green: {
        label: 'Verde',
        badge: 'bg-emerald-100 text-emerald-700',
        cardActive: 'border-emerald-400 bg-emerald-50 shadow-md',
        cardIdle: 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50',
        circleActive: 'bg-emerald-200 text-emerald-700',
        circleIdle: 'bg-emerald-100 text-emerald-600',
    },
    purple: {
        label: 'Morado',
        badge: 'bg-purple-100 text-purple-700',
        cardActive: 'border-purple-400 bg-purple-50 shadow-md',
        cardIdle: 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50',
        circleActive: 'bg-purple-200 text-purple-700',
        circleIdle: 'bg-purple-100 text-purple-600',
    },
    amber: {
        label: 'Ámbar',
        badge: 'bg-amber-100 text-amber-800',
        cardActive: 'border-amber-400 bg-amber-50 shadow-md',
        cardIdle: 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50',
        circleActive: 'bg-amber-200 text-amber-800',
        circleIdle: 'bg-amber-100 text-amber-600',
    },
    gray: {
        label: 'Gris',
        badge: 'bg-gray-100 text-gray-700',
        cardActive: 'border-gray-400 bg-gray-100 shadow-md',
        cardIdle: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
        circleActive: 'bg-gray-300 text-gray-800',
        circleIdle: 'bg-gray-100 text-gray-600',
    },
};

export const COLOR_OPTIONS = Object.entries(GROUP_COLORS).map(([value, cfg]) => ({
    value,
    label: cfg.label,
}));

export const GROUP_ICON_OPTIONS = [
    { value: 'Users', label: 'Personas' },
    { value: 'Heart', label: 'Corazón' },
    { value: 'Star', label: 'Estrella' },
    { value: 'Sparkles', label: 'Destellos' },
    { value: 'Wine', label: 'Copa / Brindis' },
    { value: 'dress', label: 'Ilustración Vestido' },
    { value: 'shirt', label: 'Ilustración Camisa' },
];

export const findGroup = (groups = [], id) => groups.find((g) => g.id === id) || null;

export const getGroupLabel = (groups = [], id) => {
    if (!id) return '—';
    const g = findGroup(groups, id);
    return g ? g.name : id;
};

export const getGroupBadgeClass = (groups = [], id) => {
    const g = findGroup(groups, id);
    return GROUP_COLORS[g?.color]?.badge || GROUP_COLORS.gray.badge;
};

export const getGroupColorStyle = (color) => GROUP_COLORS[color] || GROUP_COLORS.gray;
