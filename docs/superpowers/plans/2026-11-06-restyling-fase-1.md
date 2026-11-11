# Restyling Fase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere l'app più leggibile e comoda durante celebrazione e prove (restyling con Impeccable), correggendo i bug A e i problemi UX trovati nell'analisi, senza toccare i dati né il foglio Google.

**Architecture:** La logica duplicata (wake lock, cache CSV, dimensione font) diventa hook condivisi in `src/hooks/`. La logica pura (ricerca, classificazione tag) va in moduli `.js` in `src/lib/`, testati con il test runner integrato di Node. La parte visiva si rifà con la skill Impeccable sopra l'identità esistente (pergamena, amaranto, oro, EB Garamond + Cinzel, tema "veglia").

**Tech Stack:** React 19, Vite 8, vite-plugin-pwa, PapaParse, CSS puro. Test: `node --test` (nessuna dipendenza nuova).

**Spec:** `docs/superpowers/specs/2026-11-06-analisi-miglioramenti-design.md` (§4.1, §4.3 filtri, §4.5, §5, §7)

*Nota: ricerca precalcolata e filtri Momento/Tempo erano in Fase 2. Li anticipo qui perché non toccano il foglio e cambiano la home che il restyling ridisegna comunque. La pulizia dei dati nel foglio resta in Fase 2.*

## Global Constraints

- Tutto sul branch `proposta-miglioramenti`; mai push, mai merge su `main`.
- **Il foglio Google non si modifica.** Nessun cambio a URL CSV, nomi colonne o formato dati.
- Nessuna dipendenza npm nuova (icone = SVG inline; test = `node --test`).
- UI, commenti e messaggi di commit **in italiano**.
- Base path `/canti-liturgici-santa-chiara/` invariato; nome "Parrocchia Santa Chiara" resta (lo toglie la Fase 3).
- Route invariate: `/`, `/song/:id`, `/daily?celebrazione=` (e legacy `?messa=`), `/suggest`.
- Chiavi `localStorage` invariate: `cached_songs_catalog_csv`, `cached_celebrations_schedule_csv`, `hymn_font_size`, `active_celebration`, `app_theme`, `canti_admin_auth`.
- Markup testi (`<RIT>…</RIT>`, `<RIT/>`) interpretato come oggi.
- Accessibilità: aree tocco ≥ 44px, focus visibile, contrasto testo WCAG AA in entrambi i temi.
- Telefono prima di tutto (375px), poi iPad verticale (768px) e orizzontale (1024px+).

## Review Focus

1. **Avvio offline con cache** (modalità aereo dopo un primo caricamento): home, canto e celebrazioni devono comparire subito, senza messaggi di errore.
2. **Browser senza Wake Lock** (Safari iOS < 16.4, Firefox): il wake lock automatico non deve mostrare `alert`, né errori, né un interruttore che non fa nulla.
3. **Canto della celebrazione assente dal catalogo** (`Canto_ID` sbagliato, es. "ALDO"): la riga mostra "Canto <ID>" e la navigazione precedente/successivo la salta o la mostra senza rompersi.
4. **Titoli lunghi e testi senza ritornello su 375px**: niente scroll orizzontale, niente testo tagliato.
5. **Tag sconosciuto** aggiunto domani nel foglio: compare tra i "Momenti", non sparisce.

---

### Task 0: Preparazione e screenshot "prima"

**Files:**
- Create: `docs/restyling/prima/*.png`
- Modify: `package.json` (script `test`)

- [ ] **Step 1:** `npm ci` — Expected: installazione senza errori.
- [ ] **Step 2:** Aggiungere a `package.json` lo script `"test": "node --test src/lib/"`.
- [ ] **Step 3:** `npm run dev`, poi catturare screenshot di home, pagina canto `A2` (ha spartito), celebrazioni (Messa 10:30) a 375×812 e 1024×768, tema chiaro e scuro → `docs/restyling/prima/<pagina>-<larghezza>-<tema>.png` (12 file).
- [ ] **Step 4:** `npm run lint` e annotare gli errori già presenti (non vanno corretti qui, ma non vanno aumentati).
- [ ] **Step 5:** Commit `Restyling: screenshot di partenza e script test`.

### Task 1: Hook condivisi + bug ricaricamento celebrazioni + wake lock automatico

**Files:**
- Create: `src/hooks/useCachedCsv.js`, `src/hooks/useWakeLock.js`, `src/hooks/useFontSize.js`
- Modify: `src/context/SongsContext.jsx`, `src/pages/DailySongsPage.jsx:114-262`, `src/pages/SongPage.jsx:20-64`, `src/components/FontSizeControls.jsx`

**Interfaces:**
- Produces:
  - `useCachedCsv(url: string, cacheKey: string, parse: (csv) => T, isEmpty: (T) => boolean) → { data: T | null, loading: boolean, error: string | null }`: stesso comportamento di oggi (cache subito, fetch in background, sostituisce solo se il testo cambia, errore solo senza cache). **L'effetto dipende solo da `url` e `cacheKey`.**
  - `useWakeLock({ auto = true }) → { supported: boolean, active: boolean, toggle: () => Promise<void> }`: richiede il lock al mount se `auto` e supportato; lo richiede di nuovo su `visibilitychange` → `visible` se l'utente non l'ha spento; lo rilascia all'unmount. Nessun `alert`.
  - `useFontSize() → [fontSize: number, setFontSize]`: legge/scrive `hymn_font_size`, default **18** su tutte le pagine.

- [ ] **Step 1:** Implementare i tre hook.
- [ ] **Step 2:** `SongsContext` usa `useCachedCsv` con `parseCsvData` invariata.
- [ ] **Step 3:** `DailySongsPage` usa `useCachedCsv` con `parseCelebrationCsv` invariata (tutti e tre i formati). Celebrazione attiva e righe espanse derivano dai dati con `useMemo`/`useEffect` separati. Il parametro URL si legge, ma **non** fa ripartire il fetch.
- [ ] **Step 4:** `SongPage` e `DailySongsPage` usano `useWakeLock()` e `useFontSize()`. Rimuovere il codice duplicato. `FontSizeControls`: passi di 2px, range **16–36px** (per l'iPad sul leggio).
- [ ] **Step 5: Verifica bug 1.** Con il pannello rete aperto su `/daily`, cliccare 3 volte tra le schede 10:30 / 12:15 / Adorazione. Expected: **0** nuove richieste a `docs.google.com`. Il link `#/daily?celebrazione=Adorazione` apre Adorazione e `#/daily?messa=Messa%2012:15` apre la 12:15.
- [ ] **Step 6: Verifica wake lock.** In Chrome: aprire un canto → `active === true` senza tocchi. Cambiare scheda e tornare → di nuovo attivo. Spento a mano, resta spento al ritorno. Con `navigator.wakeLock` assente (sovrascritto in console prima del caricamento): nessun alert, interruttore nascosto. *(Review Focus 2)*
- [ ] **Step 7: Verifica offline.** Dopo un caricamento, DevTools → Offline → ricaricare home, canto e celebrazioni: si vedono i contenuti, nessun errore. *(Review Focus 1)*
- [ ] **Step 8:** `npm run lint` (non peggiora) e commit `Hook condivisi: cache CSV, wake lock automatico, dimensione testo; fix ricaricamento celebrazioni`.

### Task 2: Ricerca precalcolata e filtri Momento / Tempo liturgico

**Files:**
- Create: `src/lib/search.js`, `src/lib/search.test.js`, `src/lib/tags.js`, `src/lib/tags.test.js`
- Modify: `src/pages/HomePage.jsx`, `src/context/SongsContext.jsx` (aggiunge indice)

**Interfaces:**
- Produces:
  - `normalizeText(text: string) → string` (minuscolo, senza accenti; spostata da `HomePage.jsx:6`)
  - `buildSearchIndex(songs) → Array<{ song, title, author, id, tags, lyrics, full }>`, campi normalizzati una volta sola; esposta da `useSongs()` come `searchIndex`
  - `searchSongs(index, query: string) → song[]`: stessi pesi di oggi (titolo esatto 120, titolo contiene frase 60, id esatto 40, token in titolo 25, autore 20, tag 10, testo 2; AND tra token; parità → titolo `localeCompare(…, 'it')`)
  - `TEMPI_LITURGICI: string[]` = `['avvento','natale','quaresima','palme','giovedì santo','venerdì santo','pasqua','pentecoste','spirito santo','ognissanti','mariano','san francesco']`
  - `splitTags(tags: string[]) → { momenti: string[], tempi: string[] }`: ciò che non è in `TEMPI_LITURGICI` va in `momenti`

- [ ] **Step 1: Test che falliscono.**

```js
// src/lib/tags.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitTags } from './tags.js'
test('separa momenti e tempi', () => {
  assert.deepEqual(splitTags(['ingresso', 'quaresima', 'comunione']), { momenti: ['ingresso', 'comunione'], tempi: ['quaresima'] })
})
test('tag sconosciuto finisce nei momenti', () => {
  assert.deepEqual(splitTags(['matrimonio']), { momenti: ['matrimonio'], tempi: [] })
})
test('riconosce i tempi anche senza accento', () => {
  assert.deepEqual(splitTags(['giovedi santo']).tempi, ['giovedi santo'])
})
```

```js
// src/lib/search.test.js — canti fittizi: {id:'A1',title:'Acclamate al Signore',author:'Rinaldi',tags:['ingresso'],lyrics:'servitelo con gioia'},
// {id:'A2',title:'Acclamate al Signore',author:'Frisina',...}, {id:'C1',title:'Canto della gioia',author:'X',tags:[],lyrics:''},
// {id:'P1',title:'Pietà di noi',author:'Y',tags:['perdono'],lyrics:''}
test('titolo esatto prima di tutto', …)          // 'acclamate al signore' → A1/A2 prima di C1
test('ricerca senza accenti', …)                  // 'pieta' trova 'Pietà'
test('tutti i token devono esserci (AND)', …)     // 'acclamate frisina' → solo A2
test('ID esatto', …)                              // 'c1' → C1 primo
test('parole del testo', …)                       // 'servitelo' → A1
test('query vuota restituisce tutto', …)
```

- [ ] **Step 2:** `npm test` → Expected: FAIL (moduli mancanti).
- [ ] **Step 3:** Implementare `src/lib/tags.js` e `src/lib/search.js` con le firme sopra.
- [ ] **Step 4:** `npm test` → Expected: tutti PASS.
- [ ] **Step 5:** `HomePage` usa `searchSongs(searchIndex, search)` e due righe di chip: **Momento** e **Tempo liturgico**, con un filtro attivo per riga e logica AND tra le due ("comunione" + "quaresima"). "Tutti" azzera la riga. *(Review Focus 5: un tag nuovo nel foglio appare tra i Momenti.)*
- [ ] **Step 6:** Commit `Ricerca precalcolata e filtri separati per Momento e Tempo liturgico`.

### Task 3: Direzione grafica con Impeccable

**Files:**
- Create: `DESIGN.md` (o il file che Impeccable produce), mockup di riferimento se la skill li genera
- Modify: nessun file sorgente in questo task

- [ ] **Step 1:** Invocare la skill **impeccable** con questo brief: "Redesign di una PWA di canti liturgici per coro e musicisti, usata su telefono e iPad durante messa e prove. Mantenere l'identità: pergamena #f5f0e6, amaranto #8b261e, oro #b47818, EB Garamond (testi) + Cinzel (titoli), tema scuro 'veglia' (#141210 / oro #d69530). Priorità: 1) leggibilità del testo a colpo d'occhio, anche in chiesa poco illuminata; 2) una cosa principale per schermata; 3) barre strumenti compatte con icone, niente emoji; 4) celebrazioni compatte con passaggio rapido tra canti; 5) layout iPad. Vincoli: CSS puro, niente dipendenze, contrasto AA, tocco ≥ 44px." Partire dagli screenshot di `docs/restyling/prima/`.
- [ ] **Step 2:** Seguire il flusso della skill fino a una direzione approvata da Andrea (token colore/tipo/spaziatura, componenti chiave: barra navigazione, card canto, chip filtro, barra strumenti, strofa/ritornello, riga celebrazione).
- [ ] **Step 3:** Commit `Direzione grafica del restyling`.

### Task 4: Componenti base — token, icone, navbar, card

**Files:**
- Create: `src/components/Icon.jsx`
- Modify: `src/App.css` (token e stili globali), `src/index.css`, `src/components/Navbar.jsx`, `src/components/SongCard.jsx`, `src/components/FontSizeControls.jsx`, `index.html` (solo se cambiano i font)

**Interfaces:**
- Produces: `<Icon name="sun|moon|share|link|play|download|expand|chevron-left|chevron-right|chevron-down|text-size|lock|install|menu|close|search" size?={number} />`, SVG inline con `aria-hidden="true"` e `stroke="currentColor"`

- [ ] **Step 1:** Applicare i token della direzione al `:root` e a `[data-theme="dark"]` in `App.css`, mantenendo i nomi delle variabili esistenti dove possibile.
- [ ] **Step 2:** Creare `Icon.jsx`. Sostituire **tutte** le emoji usate come icone di interfaccia (`grep -nP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' src` → 0 risultati in pulsanti e link; restano consentite solo nel testo dei messaggi condivisi).
- [ ] **Step 3:** `SongCard`: tutta la card è un `<Link>`. Il badge YouTube resta un link separato che non attiva la card (`stopPropagation` o link fuori dall'area cliccabile, mai `<a>` annidati).
- [ ] **Step 4:** Navbar: il trigger admin (5 tocchi su "Parrocchia Santa Chiara") deve continuare a funzionare.
- [ ] **Step 5:** Verifica a 375px: nessuno scroll orizzontale in home (`document.documentElement.scrollWidth === 375`), titoli lunghi vanno a capo. *(Review Focus 4)*
- [ ] **Step 6:** `npm run lint`, `npm run build` OK. Commit `Restyling: token, icone SVG, navbar e card`.

### Task 5: Pagina canto

**Files:**
- Modify: `src/pages/SongPage.jsx`, `src/components/SongLyrics.jsx` (solo markup/classi, parser invariato), `src/App.css`

- [ ] **Step 1:** Barra strumenti in una riga: dimensione testo, interruttore schermo acceso (solo se `supported`), condividi. Etichette brevi, `aria-label` completi.
- [ ] **Step 2:** Spartiti: **niente iframe al caricamento.** Mostrare una riga "Spartito originale" con i pulsanti "Apri" (preview Drive) e "Scarica". L'anteprima incorporata compare solo dopo un tocco su "Mostra anteprima". Stessa cosa per lo spartito modificato (solo admin).
- [ ] **Step 3:** Testo: ritornello ben distinto dalle strofe (non solo colore: anche rientro o filetto), marcatore "Rit." visibile. A ≥ 1024px in orizzontale, larghezza di riga max ~70 caratteri e margini ampi.
- [ ] **Step 4:** Canto senza testo: messaggio chiaro, e il link YouTube/spartito diventa l'azione principale.
- [ ] **Step 5:** Verifica: `A2` (con spartito) carica 0 iframe finché non si tocca "Mostra anteprima". `A1` (senza spartito) non mostra la sezione. Verificare un canto senza testo.
- [ ] **Step 6:** Commit `Restyling: pagina canto, spartiti su richiesta`.

### Task 6: Celebrazioni + navigazione tra i canti

**Files:**
- Modify: `src/pages/DailySongsPage.jsx`, `src/pages/SongPage.jsx`, `src/App.css`

**Interfaces:**
- Consumes: `useWakeLock`, `useFontSize` (Task 1)
- Produces: stato di navigazione passato a `/song/:id` = `{ from: 'daily', queue: string[] /* Canto_ID nell'ordine della celebrazione, solo quelli presenti nel catalogo */, index: number, celebration: string }`

- [ ] **Step 1:** Lista celebrazione compatta: momento + titolo su una riga, testo espandibile (aperto di default come oggi), azione "Apri" verso la pagina canto.
- [ ] **Step 2:** Riga con `Canto_ID` assente dal catalogo: mostra "Canto <ID>" in stile attenuato, niente "Apri", esclusa da `queue`. *(Review Focus 3)*
- [ ] **Step 3:** `SongPage`, quando `state.from === 'daily'`: barra in basso fissa con "‹ <momento precedente>" e "<momento successivo> ›". Navigazione con `replace` (il tasto indietro torna alla celebrazione, non scorre tutti i canti). Il link "Torna alla celebrazione" riporta a `/daily?celebrazione=<celebration>`.
- [ ] **Step 4:** Le schede delle celebrazioni restano scorrevoli in orizzontale su 375px. Icone SVG al posto di 🕯️👦✨⛪.
- [ ] **Step 5:** Verifica: da Messa 10:30, aprire "Ingresso" e scorrere con › fino a "Finale" e poi indietro. Il tasto indietro del browser torna alla lista. Aprire direttamente `#/song/c10` (senza stato): nessuna barra di navigazione.
- [ ] **Step 6:** Commit `Restyling: celebrazioni compatte e passaggio rapido tra i canti`.

### Task 7: Suggerisci, modali, iPad e rifinitura

**Files:**
- Modify: `src/pages/SuggestPage.jsx` (solo stile), `src/components/AdminModal.jsx`, `src/components/IosInstallPrompt.jsx`, `src/App.css`

- [ ] **Step 1:** Applicare la direzione a form suggerimenti, modale admin e guida installazione iOS. Il comportamento non cambia (`no-cors` resta, §4.1-5 è Fase 2).
- [ ] **Step 2:** Breakpoint: 375, 768, 1024+. Su iPad orizzontale la home mostra la lista su 2 colonne e la pagina canto ha margini ampi.
- [ ] **Step 3:** Rivedere con la skill **impeccable** (critica/audit) tutte le schermate, chiaro e scuro, e correggere quanto emerge sui vincoli globali (contrasto AA, tocco ≥ 44px, focus visibile).
- [ ] **Step 4:** `npm run lint`, `npm test`, `npm run build`, `npm run preview` → installazione PWA e avvio offline ancora funzionanti.
- [ ] **Step 5:** Commit `Restyling: modulo suggerimenti, modali, layout iPad`.

### Task 8: Screenshot "dopo" e nota per Luca

**Files:**
- Create: `docs/restyling/dopo/*.png`, `docs/restyling/README.md`

- [ ] **Step 1:** Stessi 12 screenshot del Task 0 → `docs/restyling/dopo/`, più la barra di navigazione tra i canti e la pagina canto su iPad orizzontale.
- [ ] **Step 2:** `docs/restyling/README.md`: tabella prima/dopo con le immagini, elenco delle modifiche (grafica, bug corretti, novità) in linguaggio non tecnico, e come provarla dal vivo (`npm run dev -- --host`, indirizzo `http://<IP del PC>:5173/` dallo stesso Wi-Fi).
- [ ] **Step 3:** Commit `Restyling: screenshot finali e presentazione per Luca`.
