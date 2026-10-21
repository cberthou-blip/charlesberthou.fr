"""Petits pictogrammes filaires locaux, sans bibliothèque ni requête externe."""
from html import escape

ICONS = {
    'shopping-basket': '<path d="m8 3-4 6m12-6 4 6M3 9h18l-2 11H5L3 9Z"/><path d="M9 12v5m6-5v5"/>',
    'book-open': '<path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>',
    'messages-square': '<path d="M14 13H7l-4 3V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1Z"/><path d="M8 17h9l4 3V8h-3"/>',
    'zap': '<path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/>',
    'users-round': '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v3"/>',
    'heart-pulse': '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/><path d="M3 12h5l2-4 4 8 2-4h5"/>',
    'wallet': '<path d="M20 8V5H5a2 2 0 0 1 0-4h14v4M3 3v16a2 2 0 0 0 2 2h15v-5"/><path d="M22 8h-7a4 4 0 0 0 0 8h7V8Z"/><path d="M16 12h.01"/>',
    'smartphone': '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 5h4m-2 14h.01"/>',
    'scale': '<path d="M12 3v18m-5 0h10M3 7l9-2 9 2M5 7l-3 7h6L5 7Zm14 0-3 7h6l-3-7Z"/>',
    'mail-search': '<path d="M11 19H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v6M2 5l10 7 10-7"/><circle cx="17" cy="17" r="4"/><path d="m20 20 3 3"/>',
    'brain': '<path d="M12 5a3 3 0 0 0-6 0 4 4 0 0 0-3 7 4 4 0 0 0 2 7 3.5 3.5 0 0 0 7 1V5Zm0 0a3 3 0 0 1 6 0 4 4 0 0 1 3 7 4 4 0 0 1-2 7 3.5 3.5 0 0 1-7 1M7 8c0 2 2 3 5 3m5-3c0 2-2 3-5 3M6 16c0-2 2-3 4-3m8 3c0-2-2-3-4-3"/>',
    'plug': '<path d="M8 2v5m8-5v5M6 7h12v3a6 6 0 0 1-12 0V7Zm6 9v6"/>',
    'browser': '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 8h20M6 5.5h.01M9 5.5h.01M8 12h8m-8 4h5"/>',
    'sliders-horizontal': '<path d="M3 6h4m4 0h10M3 12h10m4 0h4M3 18h4m4 0h10"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
    'mic': '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/>',
    'shield-check': '<path d="M12 2 3 6v6c0 5 5 8 9 10 4-2 9-5 9-10V6l-9-4Z"/><path d="m8 12 3 3 5-6"/>',
    'calendar-clock': '<path d="M10 21H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5M6 1v5m10-5v5M2 9h18"/><circle cx="17" cy="17" r="5"/><path d="M17 14v3l2 1"/>',
    'copy': '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    'list': '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
}


def render_icon(name, class_name='resource-icon'):
    if name is None:
        return ''
    return (f'<svg class="{escape(class_name, quote=True)}" width="22" height="22" viewBox="0 0 24 24" '
            'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true" focusable="false">'
            + ICONS[name] + '</svg>')
