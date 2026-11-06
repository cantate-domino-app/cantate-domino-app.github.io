// Icone disegnate a tratto (stesso spessore ovunque), colore preso dal testo
const PATHS = {
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    sun: (
        <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </>
    ),
    moon: <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />,
    'chevron-left': <path d="M15 18l-6-6 6-6" />,
    'chevron-right': <path d="M9 18l6-6-6-6" />,
    'chevron-down': <path d="M6 9l6 6 6-6" />,
    'chevron-up': <path d="M6 15l6-6 6 6" />,
    'text-size': <path d="M3.5 18l5-12 5 12M5.3 14h6.4M14.5 18l3.5-8 3.5 8M15.5 15.5h5" />,
    'screen-on': (
        <>
            <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
            <path d="M12 8.5v3.2l2 1.5" />
        </>
    ),
    share: <path d="M12 3v12M7.5 7.5L12 3l4.5 4.5M5 13v6.5h14V13" />,
    play: <path d="M8 5.5v13l10.5-6.5z" />,
    download: <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14" />,
    external: <path d="M14 4h6v6M20 4l-9 9M18 14v5.5H4.5V6H10" />,
    search: (
        <>
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.5 4.5" />
        </>
    ),
    install: <path d="M12 3v11M7.5 9.5L12 14l4.5-4.5M6 17.5h12M8 21h8" />,
    lock: (
        <>
            <rect x="5" y="10.5" width="14" height="10" rx="2" />
            <path d="M8 10.5V7.5a4 4 0 018 0v3" />
        </>
    ),
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    music: (
        <>
            <path d="M9 18V5.5l11-2V16" />
            <circle cx="6.5" cy="18" r="2.5" />
            <circle cx="17.5" cy="16" r="2.5" />
        </>
    ),
}

export default function Icon({ name, size = 22 }) {
    return (
        <svg
            className="icon"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {PATHS[name]}
        </svg>
    )
}
