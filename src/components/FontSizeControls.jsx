export default function FontSizeControls({ fontSize, setFontSize }) {
    const changeFontSize = (delta) => setFontSize((prev) => prev + delta)

    return (
        <div className="font-controls">
            <span className="toolbar-label">Testo:</span>
            <button
                type="button"
                onClick={() => changeFontSize(-2)}
                title="Rimpicciolisci font"
                aria-label="Rimpicciolisci carattere"
            >
                A-
            </button>
            <span className="font-size-indicator">{fontSize}px</span>
            <button
                type="button"
                onClick={() => changeFontSize(2)}
                title="Ingrandisci font"
                aria-label="Ingrandisci carattere"
            >
                A+
            </button>
        </div>
    )
}
