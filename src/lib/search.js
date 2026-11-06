// Rimuove accenti e converte in minuscolo per ricerca flessibile
export function normalizeText(text) {
    if (!text) return ''
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
}

// Normalizza i campi una volta sola al caricamento, non a ogni tasto premuto
export function buildSearchIndex(songs) {
    return songs.map((song) => {
        const title = normalizeText(song.title)
        const author = normalizeText(song.author)
        const id = normalizeText(song.id)
        const tags = song.tags.map(normalizeText).join(' ')
        const lyrics = normalizeText(song.lyrics)
        return { song, title, author, id, tags, lyrics, full: `${title} ${author} ${id} ${tags} ${lyrics}` }
    })
}

// Ricerca multi-parola (AND) ordinata per pertinenza, a parità per titolo
export function searchSongs(index, query) {
    const normalizedQuery = normalizeText(query.trim())
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return index.map((entry) => entry.song)

    const results = []
    index.forEach((entry) => {
        if (!tokens.every((token) => entry.full.includes(token))) return

        let score = 0
        if (entry.title === normalizedQuery) score += 120
        else if (entry.title.includes(normalizedQuery)) score += 60

        tokens.forEach((token) => {
            if (entry.id === token) score += 40
            if (entry.title.includes(token)) score += 25
            if (entry.author.includes(token)) score += 20
            if (entry.tags.includes(token)) score += 10
            if (entry.lyrics.includes(token)) score += 2
        })
        results.push({ song: entry.song, score })
    })

    results.sort((a, b) => b.score - a.score || a.song.title.localeCompare(b.song.title, 'it'))
    return results.map((r) => r.song)
}
