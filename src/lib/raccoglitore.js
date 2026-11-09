// Primo riferimento libero nel raccoglitore con un certo prefisso (A1, A2… → A3).
// Stessa regola di riferimentoProposto in apps-script/Logica.js.
export function riferimentoProposto(riferimenti, prefisso) {
    const p = prefisso.toUpperCase()
    const usati = new Set(
        riferimenti
            .map((r) => r.trim().toUpperCase())
            .filter((r) => r.startsWith(p) && /^\d+$/.test(r.slice(p.length)))
            .map((r) => Number(r.slice(p.length)))
    )
    let n = 1
    while (usati.has(n)) n++
    return p + n
}

// Prefisso suggerito: l'iniziale del titolo senza accenti ("Ève" → "E")
export function prefissoDi(titolo) {
    return (titolo.normalize('NFD').match(/[A-Za-z]/)?.[0] || 'X').toUpperCase()
}
