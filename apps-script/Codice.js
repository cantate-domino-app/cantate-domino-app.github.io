// Script del foglio "Canti Liturgici — database".
// Lettura (doGet) aperta a tutti; scrittura (doPost) con password verificata qui, mai nel browser.
// La logica pura sta in Logica.js (stesso progetto Apps Script).

var SCHEDE = {
    canti: 'Canti',
    raccoglitori: 'Raccoglitori',
    parrocchie: 'Parrocchie',
    celebrazioni: 'Celebrazioni',
    proposte: 'Proposte',
}

// Intestazione nel foglio → chiave usata nel codice
var COLONNE = {
    Raccoglitori: [['Parrocchia', 'parrocchia'], ['Canto_ID', 'cantoId'], ['Riferimento', 'riferimento']],
    Parrocchie: [['Slug', 'slug'], ['Nome', 'nome'], ['Città', 'citta'], ['Sale', 'sale'], ['PasswordHash', 'passwordHash']],
    Celebrazioni: [['Parrocchia', 'parrocchia'], ['Celebrazione', 'celebrazione'], ['Ordine', 'ordine'], ['Momento', 'momento'], ['Canto_ID', 'cantoId'], ['Note', 'note']],
    Proposte: [['Id', 'id'], ['Data', 'data'], ['Parrocchia', 'parrocchia'], ['Titolo', 'titolo'], ['Autore', 'autore'], ['Link', 'link'], ['Testo', 'testo'], ['Note', 'note'], ['Nome', 'nome'], ['Stato', 'stato'], ['CantoAssegnato', 'cantoAssegnato']],
}

var ERRORE_ACCESSO = 'Parrocchia o password non corretti.'
var ERRORE_TENTATIVI = 'Troppi tentativi, riprova tra 10 minuti.'

// ---------- Fogli ----------

function foglio() {
    return SpreadsheetApp.getActive()
}

function schedaCanti() {
    // Nel foglio di oggi la scheda dei canti è la prima; il nome può variare.
    return foglio().getSheetByName(SCHEDE.canti) || foglio().getSheets()[0]
}

function leggiTabella(scheda) {
    var valori = scheda.getDataRange().getDisplayValues()
    var intestazione = valori[0] || []
    var righe = valori.slice(1).map(function (riga) {
        var oggetto = {}
        intestazione.forEach(function (nome, i) { oggetto[nome] = riga[i] })
        return oggetto
    })
    return { intestazione: intestazione, righe: righe }
}

function leggi(nome) {
    var scheda = foglio().getSheetByName(nome)
    if (!scheda) throw new Error('Manca la scheda "' + nome + '": usa il menu Canti Liturgici → Prepara database.')
    return leggiTabella(scheda).righe.map(function (riga) {
        var oggetto = {}
        COLONNE[nome].forEach(function (c) { oggetto[c[1]] = String(riga[c[0]] == null ? '' : riga[c[0]]) })
        return oggetto
    })
}

function scrivi(nome, oggetti) {
    var scheda = foglio().getSheetByName(nome)
    var righe = [COLONNE[nome].map(function (c) { return c[0] })].concat(oggetti.map(function (o) {
        return COLONNE[nome].map(function (c) { return o[c[1]] == null ? '' : String(o[c[1]]) })
    }))
    scheda.clearContents()
    // Formato testo: "10:30" o "1/2" non devono diventare orari o date.
    scheda.getRange(1, 1, righe.length, righe[0].length).setNumberFormat('@').setValues(righe)
}

function aggiungi(nome, oggetto) {
    foglio().getSheetByName(nome).appendRow(COLONNE[nome].map(function (c) {
        return oggetto[c[1]] == null ? '' : String(oggetto[c[1]])
    }))
}

function idCanti() {
    return leggiTabella(schedaCanti()).righe
        .map(function (r) { return String(r.ID || '').trim() })
        .filter(function (id) { return id })
}

function parrocchiaPubblica(p) {
    return { slug: p.slug, nome: p.nome, citta: p.citta }
}

// ---------- Risposte ----------

function rispondi(dati) {
    return ContentService.createTextOutput(JSON.stringify(dati)).setMimeType(ContentService.MimeType.JSON)
}

function conBlocco(fn) {
    var blocco = LockService.getScriptLock()
    try {
        blocco.waitLock(10000)
    } catch (e) {
        return { ok: false, errore: 'Il server è occupato: niente è stato salvato. Riprova tra poco.' }
    }
    try {
        return fn()
    } finally {
        blocco.releaseLock()
    }
}

// ---------- Password ----------

function digestSha256(testo) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, testo, Utilities.Charset.UTF_8)
}

// Restituisce null se la password è giusta, altrimenti il messaggio d'errore.
function controllaTentativi(chiave, corretta) {
    var cache = CacheService.getScriptCache()
    var conteggio = Number(cache.get(chiave) || 0)
    if (tentativiSuperati(conteggio)) return ERRORE_TENTATIVI
    if (corretta()) {
        cache.remove(chiave)
        return null
    }
    cache.put(chiave, String(conteggio + 1), 600)
    return tentativiSuperati(conteggio + 1) ? ERRORE_TENTATIVI : ERRORE_ACCESSO
}

function accediParrocchia(dati) {
    var slug = creaSlug(dati.parrocchia)
    var trovata = null
    var errore = controllaTentativi('tentativi_' + slug, function () {
        trovata = leggi(SCHEDE.parrocchie).filter(function (p) { return p.slug === slug })[0] || null
        return !!(trovata && trovata.passwordHash &&
            hashPassword(String(dati.password || ''), trovata.sale, digestSha256) === trovata.passwordHash)
    })
    return errore ? { errore: errore } : { parrocchia: trovata }
}

function accediAdmin(dati) {
    var proprieta = PropertiesService.getScriptProperties()
    var errore = controllaTentativi('tentativi_admin', function () {
        var hash = proprieta.getProperty('ADMIN_HASH')
        return !!(hash && hashPassword(String(dati.adminPassword || ''), proprieta.getProperty('ADMIN_SALE'), digestSha256) === hash)
    })
    return errore ? { errore: errore } : {}
}

function nuovaPassword(password) {
    var sale = Utilities.getUuid()
    return { sale: sale, passwordHash: hashPassword(password, sale, digestSha256) }
}

// ---------- Lettura ----------

function doGet(e) {
    var p = (e && e.parameter) || {}
    try {
        if (p.azione === 'catalogo') return rispondi({ ok: true, canti: leggiTabella(schedaCanti()).righe })
        if (p.azione === 'parrocchie') return rispondi({ ok: true, parrocchie: leggi(SCHEDE.parrocchie).map(parrocchiaPubblica) })
        if (p.azione === 'celebrazioni') {
            var slug = creaSlug(p.parrocchia)
            var parrocchia = leggi(SCHEDE.parrocchie).filter(function (x) { return x.slug === slug })[0]
            if (!parrocchia) return rispondi({ ok: false, errore: 'Parrocchia non trovata.' })
            var diQuesta = function (r) { return r.parrocchia === slug }
            return rispondi({
                ok: true,
                parrocchia: parrocchiaPubblica(parrocchia),
                righe: leggi(SCHEDE.celebrazioni).filter(diQuesta).map(function (r) {
                    return { celebrazione: r.celebrazione, ordine: Number(r.ordine), momento: r.momento, cantoId: r.cantoId, note: r.note }
                }),
                raccoglitore: leggi(SCHEDE.raccoglitori).filter(diQuesta).map(function (r) {
                    return { cantoId: r.cantoId, riferimento: r.riferimento }
                }),
            })
        }
        return rispondi({ ok: false, errore: 'Azione sconosciuta.' })
    } catch (err) {
        return rispondi({ ok: false, errore: 'Errore del server: ' + err.message })
    }
}

// ---------- Scrittura ----------

var AZIONI_PARROCCHIA = {
    verificaParrocchia: function (dati, parrocchia) {
        return { ok: true, parrocchia: parrocchiaPubblica(parrocchia) }
    },

    salvaCelebrazione: function (dati, parrocchia) {
        var nome = String(dati.celebrazione || '').trim()
        if (!nome || nome.length > 60) return { ok: false, errore: 'Il nome della celebrazione è obbligatorio (max 60 caratteri).' }
        var verifica = validaRighe(dati.righe, idCanti())
        if (!verifica.ok) return verifica
        return conBlocco(function () {
            scrivi(SCHEDE.celebrazioni, sostituisciCelebrazione(leggi(SCHEDE.celebrazioni), parrocchia.slug, nome, verifica.righe))
            return { ok: true }
        })
    },

    eliminaCelebrazione: function (dati, parrocchia) {
        var nome = String(dati.celebrazione || '').trim()
        return conBlocco(function () {
            scrivi(SCHEDE.celebrazioni, sostituisciCelebrazione(leggi(SCHEDE.celebrazioni), parrocchia.slug, nome, []))
            return { ok: true }
        })
    },

    salvaRiferimento: function (dati, parrocchia) {
        var cantoId = String(dati.cantoId || '').trim()
        var riferimento = String(dati.riferimento || '').trim()
        if (riferimento.length > 20) return { ok: false, errore: 'Riferimento troppo lungo (max 20 caratteri).' }
        var ids = idCanti().map(function (id) { return id.toUpperCase() })
        if (ids.indexOf(cantoId.toUpperCase()) < 0) return { ok: false, errore: 'Il canto "' + cantoId + '" non è nell\'archivio.' }
        return conBlocco(function () {
            var tutte = leggi(SCHEDE.raccoglitori)
            var stessoCanto = function (r) { return r.parrocchia === parrocchia.slug && r.cantoId.toUpperCase() === cantoId.toUpperCase() }
            var occupato = tutte.filter(function (r) {
                return r.parrocchia === parrocchia.slug && !stessoCanto(r) && r.riferimento.toUpperCase() === riferimento.toUpperCase()
            })[0]
            if (riferimento && occupato) return { ok: false, errore: 'Il riferimento ' + riferimento + ' è già usato dal canto ' + occupato.cantoId + '.' }
            var altre = tutte.filter(function (r) { return !stessoCanto(r) })
            if (riferimento) altre.push({ parrocchia: parrocchia.slug, cantoId: cantoId, riferimento: riferimento })
            scrivi(SCHEDE.raccoglitori, altre)
            return { ok: true }
        })
    },
}

var AZIONI_ADMIN = {
    elencoProposte: function () {
        var ids = idCanti()
        return {
            ok: true,
            proposte: leggi(SCHEDE.proposte)
                .filter(function (p) { return p.stato === 'nuova' })
                .map(function (p) { p.codiceProposto = codiceProposto(p.titolo, ids); return p }),
        }
    },

    accettaProposta: function (dati) {
        var codice = String(dati.codice || '').trim()
        if (!/^[A-Za-z]{1,5}\d{1,4}$/.test(codice)) return { ok: false, errore: 'Codice non valido: lettere seguite da un numero, per esempio A27.' }
        return conBlocco(function () {
            var proposte = leggi(SCHEDE.proposte)
            var proposta = proposte.filter(function (p) { return p.id === dati.id })[0]
            if (!proposta || proposta.stato !== 'nuova') return { ok: false, errore: 'Proposta non trovata o già gestita.' }
            var esiste = idCanti().some(function (id) { return id.toUpperCase() === codice.toUpperCase() })
            if (esiste) return { ok: false, errore: 'Il codice ' + codice + ' è già usato da un altro canto.' }
            var canti = schedaCanti()
            var intestazione = leggiTabella(canti).intestazione
            var youtube = /youtu/i.test(proposta.link)
            var valori = {
                ID: codice,
                Titolo: proposta.titolo,
                Autori: proposta.autore,
                Tag: String(dati.tag || '').trim(),
                'Link Youtube': youtube ? proposta.link : '',
                Testo: proposta.testo,
                Note: youtube || !proposta.link ? proposta.note : [proposta.note, proposta.link].filter(String).join(' — '),
            }
            canti.appendRow(intestazione.map(function (nome) { return valori[nome] || '' }))
            proposta.stato = 'accettata'
            proposta.cantoAssegnato = codice
            scrivi(SCHEDE.proposte, proposte)
            return { ok: true, codice: codice }
        })
    },

    rifiutaProposta: function (dati) {
        return conBlocco(function () {
            var proposte = leggi(SCHEDE.proposte)
            var proposta = proposte.filter(function (p) { return p.id === dati.id })[0]
            if (!proposta) return { ok: false, errore: 'Proposta non trovata.' }
            proposta.stato = 'rifiutata'
            scrivi(SCHEDE.proposte, proposte)
            return { ok: true }
        })
    },

    creaParrocchia: function (dati) {
        var nome = String(dati.nome || '').trim()
        var slug = creaSlug(nome)
        if (!slug || nome.length > 80) return { ok: false, errore: 'Il nome della parrocchia è obbligatorio (max 80 caratteri).' }
        if (String(dati.password || '').length < 6) return { ok: false, errore: 'La password deve avere almeno 6 caratteri.' }
        return conBlocco(function () {
            if (leggi(SCHEDE.parrocchie).some(function (p) { return p.slug === slug })) {
                return { ok: false, errore: 'Esiste già una parrocchia con questo nome.' }
            }
            var credenziali = nuovaPassword(String(dati.password))
            aggiungi(SCHEDE.parrocchie, { slug: slug, nome: nome, citta: String(dati.citta || '').trim(), sale: credenziali.sale, passwordHash: credenziali.passwordHash })
            return { ok: true, parrocchia: { slug: slug, nome: nome, citta: String(dati.citta || '').trim() } }
        })
    },

    impostaPassword: function (dati) {
        if (String(dati.password || '').length < 6) return { ok: false, errore: 'La password deve avere almeno 6 caratteri.' }
        var slug = creaSlug(dati.parrocchia)
        return conBlocco(function () {
            var parrocchie = leggi(SCHEDE.parrocchie)
            var parrocchia = parrocchie.filter(function (p) { return p.slug === slug })[0]
            if (!parrocchia) return { ok: false, errore: 'Parrocchia non trovata.' }
            var credenziali = nuovaPassword(String(dati.password))
            parrocchia.sale = credenziali.sale
            parrocchia.passwordHash = credenziali.passwordHash
            scrivi(SCHEDE.parrocchie, parrocchie)
            return { ok: true }
        })
    },
}

function proponiCanto(dati) {
    var campo = function (nome, max) { return String(dati[nome] || '').trim().slice(0, max) }
    var titolo = campo('titolo', 150)
    if (!titolo) return { ok: false, errore: 'Il titolo del canto è obbligatorio.' }
    return conBlocco(function () {
        aggiungi(SCHEDE.proposte, {
            id: Utilities.getUuid(),
            data: new Date().toISOString(),
            parrocchia: campo('parrocchia', 80),
            titolo: titolo,
            autore: campo('autore', 150),
            link: campo('link', 500),
            testo: campo('testo', 10000),
            note: campo('note', 1000),
            nome: campo('nome', 80),
            stato: 'nuova',
            cantoAssegnato: '',
        })
        return { ok: true }
    })
}

function eseguiPost(dati) {
    if (dati.azione === 'proponiCanto') return proponiCanto(dati)
    if (AZIONI_PARROCCHIA[dati.azione]) {
        var accesso = accediParrocchia(dati)
        if (accesso.errore) return { ok: false, errore: accesso.errore }
        return AZIONI_PARROCCHIA[dati.azione](dati, accesso.parrocchia)
    }
    if (AZIONI_ADMIN[dati.azione]) {
        var admin = accediAdmin(dati)
        if (admin.errore) return { ok: false, errore: admin.errore === ERRORE_ACCESSO ? 'Password admin non corretta.' : admin.errore }
        return AZIONI_ADMIN[dati.azione](dati)
    }
    return { ok: false, errore: 'Azione sconosciuta.' }
}

function doPost(e) {
    try {
        return rispondi(eseguiPost(JSON.parse(e.postData.contents)))
    } catch (err) {
        return rispondi({ ok: false, errore: 'Errore del server: ' + err.message })
    }
}

// ---------- Menu nel foglio ----------

function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('Canti Liturgici')
        .addItem('Prepara database', 'preparaDatabase')
        .addItem('Imposta password admin', 'impostaPasswordAdmin')
        .addToUi()
}

// Idempotente: si può lanciare più volte senza duplicare nulla.
function preparaDatabase() {
    var f = foglio()
    var vecchie = null
    // La vecchia scheda delle celebrazioni si riconosce dalle colonne, qualunque sia il nome.
    f.getSheets().forEach(function (scheda) {
        var intestazione = leggiTabella(scheda).intestazione
        if (!vecchie && intestazione.indexOf('Canto_ID') >= 0 && intestazione.indexOf('Momento') >= 0 && intestazione.indexOf('Parrocchia') < 0) {
            vecchie = scheda.getDataRange().getDisplayValues()
            scheda.setName('Celebrazioni (vecchio)')
        }
    })
    Object.keys(COLONNE).forEach(function (nome) {
        if (!f.getSheetByName(nome)) {
            f.insertSheet(nome)
            scrivi(nome, [])
        }
    })
    if (vecchie && leggi(SCHEDE.celebrazioni).length === 0) {
        scrivi(SCHEDE.celebrazioni, convertiCelebrazioniVecchie(vecchie, 'santa-chiara'))
    }
    if (!leggi(SCHEDE.parrocchie).some(function (p) { return p.slug === 'santa-chiara' })) {
        // Senza password: la imposta l'admin dal pannello.
        aggiungi(SCHEDE.parrocchie, { slug: 'santa-chiara', nome: 'Santa Chiara', citta: '', sale: '', passwordHash: '' })
    }
    var raccoglitori = leggi(SCHEDE.raccoglitori)
    if (!raccoglitori.some(function (r) { return r.parrocchia === 'santa-chiara' })) {
        var canti = leggiTabella(schedaCanti())
        var colonna = canti.intestazione.filter(function (c) { return String(c).trim().toLowerCase() === 'raccoglitore' })[0] || null
        scrivi(SCHEDE.raccoglitori, raccoglitori.concat(riferimentiIniziali(canti.righe, colonna).map(function (r) {
            return { parrocchia: 'santa-chiara', cantoId: r.cantoId, riferimento: r.riferimento }
        })))
    }
}

function impostaPasswordAdmin() {
    var ui = SpreadsheetApp.getUi()
    var risposta = ui.prompt('Password admin', 'Scrivi la nuova password admin (almeno 8 caratteri):', ui.ButtonSet.OK_CANCEL)
    if (risposta.getSelectedButton() !== ui.Button.OK) return
    var password = risposta.getResponseText()
    if (password.length < 8) {
        ui.alert('Password troppo corta: almeno 8 caratteri.')
        return
    }
    var credenziali = nuovaPassword(password)
    PropertiesService.getScriptProperties().setProperties({ ADMIN_SALE: credenziali.sale, ADMIN_HASH: credenziali.passwordHash })
    ui.alert('Password admin salvata.')
}
