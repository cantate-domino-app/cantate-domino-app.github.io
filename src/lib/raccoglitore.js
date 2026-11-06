// Il raccoglitore è quello cartaceo di Luca: un canto c'è se ha un riferimento (es. A12).
// Finché il foglio non ha la colonna "Raccoglitore", vale la regola di sempre: riferimento = ID.

export function trovaColonnaRaccoglitore(colonne) {
    return colonne.find((c) => c.trim().toLowerCase() === 'raccoglitore') ?? null
}

export function riferimentoRaccoglitore(riga, colonna) {
    if (!colonna) return (riga.ID || '').trim()
    return (riga[colonna] || '').trim()
}
