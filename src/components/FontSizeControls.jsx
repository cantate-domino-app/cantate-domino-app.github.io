import Icon from './Icon'
import { FONT_MIN, FONT_MAX } from '../hooks/useFontSize'

// Pannello che si apre sotto la barra del canto
export default function FontSizeControls({ fontSize, setFontSize }) {
    const changeFontSize = (delta) => setFontSize((prev) => prev + delta)

    return (
        <div className="text-size-panel" role="group" aria-label="Dimensione del testo">
            <button
                type="button"
                className="btn"
                onClick={() => changeFontSize(-2)}
                disabled={fontSize <= FONT_MIN}
                aria-label="Testo più piccolo"
            >
                <Icon name="minus" />
            </button>
            <span className="font-size-indicator" aria-live="polite">{fontSize} px</span>
            <button
                type="button"
                className="btn"
                onClick={() => changeFontSize(2)}
                disabled={fontSize >= FONT_MAX}
                aria-label="Testo più grande"
            >
                <Icon name="plus" />
            </button>
        </div>
    )
}
