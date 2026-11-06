// Logica pura dello script: nessuna chiamata a SpreadsheetApp & co.
// Apps Script non supporta import/export: tutte le funzioni sono globali.

var MAX_RIGHE_CELEBRAZIONE = 40
var MAX_TENTATIVI = 5

function senzaAccenti(testo) {
    return String(testo || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function creaSlug(nome) {
    return senzaAccenti(nome)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

// digest: (testo) => array di byte (anche con segno, come Utilities.computeDigest)
function hashPassword(password, sale, digest) {
    return digest(sale + password)
        .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2) })
        .join('')
}

function primoNumeroLibero(codici, prefisso) {
    var re = new RegExp('^' + prefisso + '(\\d+)$', 'i')
    var usati = {}
    codici.forEach(function (c) {
        var m = String(c).trim().match(re)
        if (m) usati[Number(m[1])] = true
    })
    var n = 1
    while (usati[n]) n++
    return prefisso + n
}

function codiceProposto(titolo, ids) {
    var lettera = senzaAccenti(titolo).toUpperCase().match(/[A-Z]/)
    return primoNumeroLibero(ids, lettera ? lettera[0] : 'X')
}

function riferimentoProposto(riferimenti, prefisso) {
    return primoNumeroLibero(riferimenti, String(prefisso).toUpperCase())
}

function riferimentiIniziali(righeCanti, colonnaRaccoglitore) {
    var risultato = []
    righeCanti.forEach(function (riga) {
        var cantoId = String(riga.ID || '').trim()
        var riferimento = String(colonnaRaccoglitore ? riga[colonnaRaccoglitore] || '' : cantoId).trim()
        if (cantoId && riferimento) risultato.push({ cantoId: cantoId, riferimento: riferimento })
    })
    return risultato
}

function validaRighe(righe, idValidi) {
    if (!Array.isArray(righe)) return { ok: false, errore: 'Elenco dei canti non valido.' }
    if (righe.length > MAX_RIGHE_CELEBRAZIONE) {
        return { ok: false, errore: 'Al massimo ' + MAX_RIGHE_CELEBRAZIONE + ' canti per celebrazione.' }
    }
    var validi = {}
    idValidi.forEach(function (id) { validi[String(id).trim().toUpperCase()] = true })
    var pulite = []
    for (var i = 0; i < righe.length; i++) {
        var momento = String(righe[i].momento || '').trim()
        var cantoId = String(righe[i].cantoId || '').trim()
        var note = String(righe[i].note || '').trim()
        if (!momento || momento.length > 60) return { ok: false, errore: 'Riga ' + (i + 1) + ': il momento è obbligatorio (max 60 caratteri).' }
        if (!validi[cantoId.toUpperCase()]) return { ok: false, errore: 'Riga ' + (i + 1) + ': il canto "' + cantoId + '" non è nell\'archivio.' }
        if (note.length > 200) return { ok: false, errore: 'Riga ' + (i + 1) + ': le note sono troppo lunghe (max 200 caratteri).' }
        pulite.push({ momento: momento, cantoId: cantoId, note: note })
    }
    return { ok: true, righe: pulite }
}

function sostituisciCelebrazione(tutte, parrocchia, celebrazione, nuove) {
    var restanti = tutte.filter(function (r) {
        return !(r.parrocchia === parrocchia && r.celebrazione === celebrazione)
    })
    return restanti.concat(nuove.map(function (r, i) {
        return { parrocchia: parrocchia, celebrazione: celebrazione, ordine: i + 1, momento: r.momento, cantoId: r.cantoId, note: r.note || '' }
    }))
}

// Dal vecchio formato (Celebrazione, Momento, Canto_ID, Note; celebrazione vuota = la precedente)
function convertiCelebrazioniVecchie(csvRighe, slug) {
    var intestazione = (csvRighe[0] || []).map(function (c) { return String(c).trim().toLowerCase() })
    var col = {
        celebrazione: intestazione.indexOf('celebrazione'),
        momento: intestazione.indexOf('momento'),
        cantoId: intestazione.indexOf('canto_id'),
        note: intestazione.indexOf('note'),
    }
    var cella = function (riga, nome) { return col[nome] < 0 ? '' : String(riga[col[nome]] || '').trim() }
    var corrente = ''
    var ordini = {}
    var risultato = []
    csvRighe.slice(1).forEach(function (riga) {
        corrente = cella(riga, 'celebrazione') || corrente
        var cantoId = cella(riga, 'cantoId')
        if (!corrente || !cantoId) return
        ordini[corrente] = (ordini[corrente] || 0) + 1
        risultato.push({ parrocchia: slug, celebrazione: corrente, ordine: ordini[corrente], momento: cella(riga, 'momento'), cantoId: cantoId, note: cella(riga, 'note') })
    })
    return risultato
}

function tentativiSuperati(conteggio) {
    return conteggio >= MAX_TENTATIVI
}
