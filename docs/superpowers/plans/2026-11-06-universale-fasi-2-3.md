# Versione universale (Fasi 2-3) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trasformare l'app di Santa Chiara in "Canti Liturgici" universale. Il database è una copia del foglio nel Drive di Andrea, servita da uno script Apps Script. Ci sono: archivio comune aperto, celebrazioni per parrocchia protette da password, suggerimenti con conferma vera, pannello admin e catalogo statico veloce.

**Architecture:**
- Il foglio Google (copia di "Canti Luca") resta il database. Un unico script Apps Script, versionato in `apps-script/` e incollato da Andrea nel foglio, espone `doGet` (lettura) e `doPost` (scrittura con password verificata sul server).
- La logica pura dello script sta in `apps-script/Logica.js`, testata in Node con `vm`.
- Il catalogo canti viene scaricato in fase di build da una GitHub Action in `public/canti.json`: veloce, stessa origine, in cache nel service worker.
- Le celebrazioni si leggono dal vivo dallo script, con cache per parrocchia.

**Tech Stack:** React 19, Vite 8, vite-plugin-pwa, Google Apps Script (V8), GitHub Actions, `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-06-analisi-miglioramenti-design.md` (§4.1-5, §4.3, §4.4, §6, "Decisioni di Andrea per le Fasi 2-3")

## Global Constraints

- **Costo zero.** Nessun servizio a pagamento, nessuna dipendenza npm nuova.
- **Il foglio di Luca e il repo di Luca non si modificano.** Si lavora sul branch `universale`, creato da `proposta-miglioramenti`, che verrà pubblicato in un **nuovo repo GitHub di Andrea**. Il database è una **copia** nel Drive di Andrea.
- Nome provvisorio **"Canti Liturgici"**, definito in un solo punto (`src/config.js` + `vite.config.js` lo importa). Nessuna occorrenza di "Santa Chiara" nell'interfaccia.
- Base path da variabile `BASE_PATH` (default `/canti-liturgici/`); URL dello script da `VITE_API_URL`.
- Lettura dell'archivio: **senza login**. Modifica celebrazioni: **nome parrocchia + password condivisa**, verificata **sul server**. Le parrocchie le crea solo l'admin.
- Le celebrazioni usano **solo canti dell'archivio comune**. Gli ID esistenti restano invariati. Per un canto nuovo l'admin vede un **codice proposto** (iniziale del titolo + primo numero libero nell'archivio, es. `A27`) e può cambiarlo.
- **Raccoglitore per parrocchia** (richiesta di Luca): il codice dell'archivio NON è la posizione nel raccoglitore cartaceo. Ogni parrocchia ha il suo elenco `Canto_ID → Riferimento`. Un canto è nel raccoglitore della parrocchia se ha un riferimento. Santa Chiara parte dai riferimenti di oggi (colonna "Raccoglitore" del foglio, oppure l'ID se la colonna non c'è); le altre parrocchie partono vuote. I canti aggiunti da altre parrocchie non occupano numeri nel raccoglitore di Luca.
- Password: SHA-256 con sale casuale per parrocchia. Mai in chiaro nel foglio, nel repo o nell'URL. La password admin sta nelle Script Properties come hash.
- Massimo **5 tentativi sbagliati ogni 10 minuti** per parrocchia/admin (CacheService).
- UI, commenti, commit in italiano. Restano valide tutte le regole grafiche di `DESIGN.md`.
- `<meta name="robots" content="noindex">` (spec §4.7).

## Review Focus

1. **Script irraggiungibile o lento** (Apps Script 1-3 s, a volte errore 500): l'app mostra dati in cache. Il salvataggio fallito dice chiaramente che **non** è stato salvato e lascia le modifiche nel form.
2. **Password sbagliata ripetuta**: dopo 5 tentativi risponde "troppi tentativi, riprova tra 10 minuti". Non rivela se la parrocchia esiste.
3. **Due coristi salvano la stessa celebrazione**: vince l'ultimo salvataggio. Nessuna riga duplicata né persa nelle altre celebrazioni o parrocchie.
4. **Nome parrocchia con accenti o maiuscole** ("San Nicolò", "S. Maria"): lo slug è stabile e la ricerca lo trova senza accenti.
5. **Canto rimosso dall'archivio ma presente in una celebrazione**: la riga resta e appare "Canto <ID> non in archivio", come oggi.

---

### Task 1: Branch, configurazione unica e nome neutro

**Files:**
- Create: `src/config.js`
- Modify: `vite.config.js`, `index.html`, `src/components/Navbar.jsx`, `src/pages/DailySongsPage.jsx` (testo di condivisione), `src/App.jsx`, `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: `src/config.js` → `export const APP_NAME = 'Canti Liturgici'`, `export const API_URL = import.meta.env.VITE_API_URL || ''`, `export const BASE = import.meta.env.BASE_URL`

- [ ] **Step 1:** `git switch -c universale` da `proposta-miglioramenti`.
- [ ] **Step 2:** `vite.config.js`: `const base = process.env.BASE_PATH || '/canti-liturgici/'`, usato per `base`, `scope`, `start_url` e le icone del manifest. Manifest `name: 'Canti Liturgici'`, `short_name: 'Canti'`, descrizione senza parrocchia.
- [ ] **Step 3:** `index.html`: titolo e OG con "Canti Liturgici", `<meta name="robots" content="noindex">`. Link icone/manifest relativi (`%BASE_URL%`), così cessa anche l'errore manifest in dev.
- [ ] **Step 4:** Navbar: sotto il nome, al posto di "Parrocchia Santa Chiara", il sottotitolo "Archivio canti per cori e musicisti". Tolto il trigger dei 5 tocchi; aggiunta la route `/admin` (pagina vuota segnaposto fino al Task 8). Voce di menu "Area admin" solo se `isAdmin`.
- [ ] **Step 5:** Testo di condivisione delle celebrazioni senza "Parrocchia Santa Chiara" (userà il nome della parrocchia al Task 5).
- [ ] **Step 6:** `deploy.yml`: trigger su `main` invariato; `env: BASE_PATH: /${{ github.event.repository.name }}/` e `VITE_API_URL: ${{ vars.VITE_API_URL }}`.
- [ ] **Step 7:** Verifica: `grep -ri "santa chiara" src index.html vite.config.js` → 0 risultati; `npm run build` ok; `BASE_PATH=/prova/ npm run build` → `dist/index.html` contiene `/prova/`.
- [ ] **Step 8:** Commit `Universale: nome e indirizzo configurabili, niente riferimenti a Santa Chiara`.

### Task 2: Logica dello script (testata in Node)

**Files:**
- Create: `apps-script/Logica.js`, `apps-script/logica.test.js`, `apps-script/carica.js` (helper di test: carica `Logica.js` in un contesto `vm` e restituisce le funzioni)
- Modify: `package.json` → `"test": "node --test \"src/lib/*.test.js\" \"apps-script/*.test.js\""`

**Interfaces (funzioni globali in `Logica.js`, niente import/export: Apps Script non li supporta):**
- `creaSlug(nome: string) → string`: minuscolo, senza accenti, solo `[a-z0-9-]`, trattini singoli, senza trattini ai bordi. "S. Maria Assunta" → `s-maria-assunta`; "San Nicolò" → `san-nicolo`
- `hashPassword(password: string, sale: string, digest: (bytes) => number[]) → string`: esadecimale di `digest(sale + password)`. `digest` viene iniettato (in Apps Script `Utilities.computeDigest`, nei test `crypto`)
- `codiceProposto(titolo: string, ids: string[]) → string`: iniziale del titolo senza accenti, maiuscola + primo numero libero per quel prefisso (es. "Ave Maria" con A1..A26 → `A27`; buchi riempiti: A1, A3 → `A2`)
- `riferimentoProposto(riferimenti: string[], prefisso: string) → string`: stesso calcolo, ma sui riferimenti del raccoglitore di una parrocchia
- `riferimentiIniziali(righeCanti, colonnaRaccoglitore) → [{cantoId, riferimento}]`: per Santa Chiara, dal valore della colonna "Raccoglitore" (se esiste) oppure dall'ID; righe con riferimento vuoto saltate
- `validaRighe(righe) → { ok: true, righe } | { ok: false, errore: string }`: ogni riga ha `momento` (1-60 caratteri) e `cantoId` (esistente, passato come insieme `idValidi`), più `note` opzionali (max 200). Massimo 40 righe. Firma: `validaRighe(righe, idValidi: Set<string>)`
- `sostituisciCelebrazione(tutte: Riga[], parrocchia, celebrazione, nuove: Riga[]) → Riga[]`: toglie le righe di quella parrocchia+celebrazione e aggiunge le nuove con `ordine` 1..n. Non tocca le altre
- `convertiCelebrazioniVecchie(csvRighe: string[][], slug) → Riga[]`: dal formato attuale (`Celebrazione, Momento, Canto_ID, Note`, celebrazione vuota = eredita la precedente, colonne in più ignorate, righe senza Canto_ID saltate) al nuovo
- `tentativiSuperati(conteggio: number) → boolean`: `conteggio >= 5`

- [ ] **Step 1: Test che falliscono** in `apps-script/logica.test.js`, uno per regola:
  - `creaSlug('San Nicolò') === 'san-nicolo'`, `creaSlug('  S. Maria  Assunta ') === 's-maria-assunta'`
  - `hashPassword` deterministico con lo stesso sale, diverso con sale diverso
  - `codiceProposto('Ave Maria', ['A1','A2','B1'])` → `'A3'`; `codiceProposto('Ève', ['E1'])` → `'E2'`; con buco `['A1','A3']` → `'A2'`
  - `riferimentoProposto(['A1','A2'], 'A')` → `'A3'`; `riferimentoProposto([], 'C')` → `'C1'`
  - `riferimentiIniziali`: senza colonna → riferimento = ID per tutti; con colonna → solo le righe compilate
  - `validaRighe` rifiuta: ID inesistente (errore contiene l'ID), momento vuoto, 41 righe
  - `sostituisciCelebrazione` lascia invariate le righe di altre parrocchie e altre celebrazioni *(Review Focus 3)*
  - `convertiCelebrazioniVecchie` sul CSV reale di oggi (fixture copiata da `celeb.csv`): 28 righe, la "Messa 12:15 / Padre Nostro" senza canto è saltata, "ALDO" ignorato (sta in una colonna in più)
- [ ] **Step 2:** `npm test` → FAIL (file mancante).
- [ ] **Step 3:** Implementare `Logica.js` e `carica.js`.
- [ ] **Step 4:** `npm test` → tutti PASS.
- [ ] **Step 5:** Commit `Universale: logica dello script con test`.

### Task 3: Script Apps Script (lettura, scrittura, menu)

**Files:**
- Create: `apps-script/Codice.js`, `apps-script/appsscript.json`

**Interfaces:**
- Consumes: le funzioni di `Logica.js` (Task 2).
- Schede del foglio: `Canti` (come oggi); `Raccoglitori` (`Parrocchia, Canto_ID, Riferimento`); `Parrocchie` (`Slug, Nome, Città, Sale, PasswordHash`); `Celebrazioni` (`Parrocchia, Celebrazione, Ordine, Momento, Canto_ID, Note`); `Proposte` (`Id, Data, Parrocchia, Titolo, Autore, Link, Testo, Note, Nome, Stato, CantoAssegnato`). La vecchia scheda viene rinominata `Celebrazioni (vecchio)`.
- **GET** `?azione=`:
  - `catalogo` → `{ canti: [{ID,Titolo,Autori,Tag,...}] }` (stesse colonne del CSV)
  - `parrocchie` → `{ parrocchie: [{slug, nome, citta}] }`
  - `celebrazioni&parrocchia=<slug>` → `{ parrocchia: {slug,nome,citta}, righe: [{celebrazione, ordine, momento, cantoId, note}], raccoglitore: [{cantoId, riferimento}] }`
- **POST** (corpo `text/plain` con JSON `{azione, ...}`, risposta letta davvero, niente `no-cors`). Ognuna risponde `{ ok: true, ... }` oppure `{ ok: false, errore: "<messaggio in italiano>" }`:
  - `verificaParrocchia {parrocchia, password}`
  - `salvaCelebrazione {parrocchia, password, celebrazione, righe}`
  - `eliminaCelebrazione {parrocchia, password, celebrazione}`
  - `salvaRiferimento {parrocchia, password, cantoId, riferimento}`: riferimento vuoto = tolto dal raccoglitore. Errore se lo stesso riferimento è già usato da un altro canto della parrocchia
  - `proponiCanto {parrocchia?, titolo, autore?, link?, testo?, note?, nome?}`
  - admin `{adminPassword, ...}`: `elencoProposte` (ogni proposta con `codiceProposto`), `accettaProposta {id, codice, tag?}` (crea il canto con il codice scelto; errore se il codice esiste già), `rifiutaProposta {id}`, `creaParrocchia {nome, citta, password}`, `impostaPassword {parrocchia, password}`
- Password sbagliata e parrocchia inesistente danno **lo stesso** errore: "Parrocchia o password non corretti". Dopo 5 tentativi: "Troppi tentativi, riprova tra 10 minuti" *(Review Focus 2)*.
- Le scritture usano `LockService.getScriptLock()` (attesa max 10 s) *(Review Focus 3)*.
- Menu nel foglio "Canti Liturgici": **Prepara database** (crea le schede mancanti, converte le vecchie celebrazioni con `convertiCelebrazioniVecchie` assegnandole allo slug `santa-chiara`, crea la parrocchia "Santa Chiara" senza password, riempie `Raccoglitori` per Santa Chiara con `riferimentiIniziali`) e **Imposta password admin** (`SpreadsheetApp.getUi().prompt`, salva hash e sale nelle Script Properties). Entrambe idempotenti.

- [ ] **Step 1:** Implementare `Codice.js`. Ogni handler fa: valida input → `LockService` (solo scritture) → legge la scheda → logica di `Logica.js` → scrive → risponde con `ContentService` JSON.
- [ ] **Step 2:** Verifica statica: `node -e` carica `Logica.js` + `Codice.js` in un contesto `vm` con stub di `SpreadsheetApp`, `ContentService`, `Utilities`, `CacheService`, `LockService`, `PropertiesService`, che simulano un foglio in memoria con le 4 schede. In `apps-script/codice.test.js`:
  - `doGet({parameter:{azione:'parrocchie'}})` non espone `Sale` né `PasswordHash`
  - `salvaCelebrazione` con password giusta scrive; con password sbagliata non scrive e dà l'errore generico; al 6° tentativo dà "Troppi tentativi"
  - `accettaProposta` con codice `A27` crea il canto e segna la proposta `accettata`; con codice già esistente → `ok:false`
  - `salvaRiferimento` con riferimento già usato da un altro canto → `ok:false`; con riferimento vuoto toglie la riga
  - `proponiCanto` senza titolo → `ok:false`
- [ ] **Step 3:** `npm test` → PASS.
- [ ] **Step 4:** Commit `Universale: script Apps Script con lettura, scrittura protetta e menu`.

### Task 4: Catalogo statico e client API

**Files:**
- Create: `scripts/scarica-catalogo.mjs`, `src/lib/api.js`, `src/lib/api.test.js`
- Modify: `src/context/SongsContext.jsx`, `.github/workflows/deploy.yml`, `.gitignore` (`public/canti.json`)

**Interfaces:**
- Produces:
  - `chiamaApi(azione: string, dati: object, { fetchImpl = fetch, timeoutMs = 15000 } = {}) → Promise<{ ok: boolean, errore?: string, ...}>`: POST `text/plain`. Rete o timeout → `{ ok:false, errore:'Connessione assente o lenta: niente è stato salvato. Riprova.' }`. Risposta non JSON → `{ ok:false, errore:'Risposta non valida dal server.' }`
  - `leggiApi(azione: string, params: object, opts) → Promise<object>`: GET, lancia `Error` in caso di problemi
- `SongsContext` legge `${BASE}canti.json` con `useCachedCsv` (parse = `JSON.parse` + la stessa mappatura delle colonne di `parseCsvData`). Chiave cache `cached_songs_catalog_json`. Nessun riferimento rimasto al CSV pubblicato.
- `scripts/scarica-catalogo.mjs`: legge `VITE_API_URL`, GET `?azione=catalogo`, scrive `public/canti.json`, esce con codice 1 se i canti sono meno di 10 (protezione contro un catalogo vuoto pubblicato per errore).
- `deploy.yml`: step `node scripts/scarica-catalogo.mjs` prima della build; trigger aggiunti `schedule: cron '17 * * * *'` e `workflow_dispatch`. *shortcut: aggiornamento orario; se serve subito, "Run workflow" su GitHub o, più avanti, repository_dispatch dallo script.*

- [ ] **Step 1: Test che falliscono** (`api.test.js`, `fetchImpl` finto):
  - risposta `{ok:true}` → restituita
  - `fetchImpl` che rifiuta → `ok:false` con il messaggio "niente è stato salvato"
  - testo non JSON → `ok:false` con "Risposta non valida"
  - timeout (fetch che non risponde, `timeoutMs: 10`) → `ok:false` *(Review Focus 1)*
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementare `api.js`, lo script del catalogo e la modifica a `SongsContext`.
- [ ] **Step 4:** `npm test` → PASS. In dev, con un `public/canti.json` generato dal CSV di oggi (helper usato una sola volta, non committato): la home mostra 258 canti.
- [ ] **Step 5:** Commit `Universale: catalogo statico da GitHub Action e client API`.

### Task 5: Scelta parrocchia e celebrazioni per parrocchia

**Files:**
- Create: `src/pages/ParishPickerPage.jsx`
- Modify: `src/App.jsx` (route), `src/pages/DailySongsPage.jsx`, `src/pages/SongPage.jsx` (link "indietro" verso la parrocchia), `src/components/Navbar.jsx`, `src/App.css`

**Interfaces:**
- Route: `/celebrazioni` (scelta), `/celebrazioni/:slug?c=<celebrazione>`, `/daily` e `/daily?celebrazione=` → redirect a `/celebrazioni/<ultima parrocchia salvata>` oppure `/celebrazioni`.
- `localStorage`: `parrocchia_attiva` (slug), cache `cached_celebrazioni_<slug>` (JSON), `cached_parrocchie`.
- `DailySongsPage` riceve lo slug, legge `leggiApi('celebrazioni', {parrocchia})` attraverso `useCachedCsv` (parse JSON), raggruppa le righe per `celebrazione` in base a `ordine`. Il parser CSV vecchio viene rimosso da qui (vive in `Logica.js`).
- La pagina di scelta mostra un campo di ricerca (stessa `normalizeText`) e la lista delle parrocchie (nome, città). Se ce n'è una sola, va diretta. Pulsante "Cambia parrocchia" nella pagina celebrazioni.
- Condivisione: `"<Celebrazione> — <Nome parrocchia>"` e link `/celebrazioni/<slug>?c=<celebrazione>`.

- [ ] **Step 1:** Implementare.
- [ ] **Step 1b: Raccoglitore della parrocchia.** Con una parrocchia attiva, la riga dell'archivio e la pagina canto mostrano il riferimento **di quella parrocchia** (sostituisce la logica `riferimentoRaccoglitore` del foglio). Il filtro diventa "Solo nel raccoglitore di <parrocchia>". Senza parrocchia scelta, niente informazioni sul raccoglitore.
- [ ] **Step 2:** Verifica Playwright con lo script intercettato (`page.route` verso `VITE_API_URL` con risposte JSON di prova per due parrocchie, "Santa Chiara" e "San Nicolò"):
  - ricerca "nicolo" trova "San Nicolò" *(Review Focus 4)*
  - scelta → celebrazioni giuste; ricarica offline → stesse celebrazioni dalla cache
  - `#/daily?celebrazione=Adorazione` con parrocchia salvata → redirect corretto
  - canto inesistente → "Canto X non in archivio" *(Review Focus 5)*
  - frecce della pagina canto funzionanti come oggi
- [ ] **Step 3:** Commit `Universale: celebrazioni per parrocchia`.

### Task 6: Modifica delle celebrazioni (password parrocchia)

**Files:**
- Create: `src/pages/EditCelebrationsPage.jsx`, `src/components/SongPicker.jsx`
- Modify: `src/App.jsx`, `src/pages/DailySongsPage.jsx` (pulsante "Modifica"), `src/App.css`

**Interfaces:**
- Route `/celebrazioni/:slug/modifica`. Password chiesta una volta, verificata con `verificaParrocchia` e poi ricordata in `localStorage` (`password_<slug>`), con pulsante "Esci" che la cancella.
- Editor: scelta celebrazione (o "Nuova celebrazione" con nome); righe con momento (campo testo con suggerimenti dei momenti standard: Ingresso, Atto penitenziale, Gloria, Alleluia, Offertorio, Santo, Padre nostro, Pace, Agnello di Dio, Comunione, Finale), canto (`SongPicker`: ricerca con `searchSongs`, mostra ID + titolo), note; pulsanti su/giù, rimuovi, aggiungi riga. Poi "Salva" ed "Elimina celebrazione" (con conferma).
- Nella pagina canto, se la parrocchia è sbloccata: "Aggiungi al raccoglitore" con il riferimento proposto (`riferimentoProposto` sul prefisso dell'ID) modificabile, oppure "Togli dal raccoglitore". Salva con `salvaRiferimento`.
- Salvataggio con `chiamaApi('salvaCelebrazione', …)`. Se riesce: messaggio "Salvato", cache della parrocchia aggiornata subito. Se fallisce: messaggio dell'errore, form intatto *(Review Focus 1)*.

- [ ] **Step 1:** Implementare.
- [ ] **Step 2:** Verifica Playwright con API intercettata: aggiungi al raccoglitore → POST con il riferimento proposto, riga aggiornata; riferimento già usato → messaggio d'errore. Password sbagliata → errore e niente editor; giusta → editor; aggiungi riga con `SongPicker` ("acclamate" → A1), sposta su, salva → corpo POST con righe e ordine attesi; API che risponde 500 → messaggio "niente è stato salvato" e righe ancora presenti; elimina con conferma.
- [ ] **Step 3:** Commit `Universale: modifica delle celebrazioni con password di parrocchia`.

### Task 7: Suggerimenti con conferma vera

**Files:**
- Modify: `src/pages/SuggestPage.jsx`

- [ ] **Step 1:** Campo "Parrocchia" (facoltativo, preselezionato da `parrocchia_attiva`) e campo "Testo" (facoltativo, textarea). Invio con `chiamaApi('proponiCanto', …)`. "Grazie" **solo** se `ok:true`; altrimenti l'errore, con i campi conservati.
- [ ] **Step 2:** Verifica Playwright: risposta ok → card di ringraziamento; rete giù → errore e campi intatti.
- [ ] **Step 3:** Commit `Universale: suggerimenti con conferma reale e parrocchia`.

### Task 8: Pannello admin

**Files:**
- Create: `src/pages/AdminPage.jsx`
- Modify: `src/context/AdminContext.jsx` (via il PIN SHA-256 lato client: lo stato admin = password admin verificata dal server e ricordata in `sessionStorage`), `src/components/AdminModal.jsx` (rimosso), `src/App.jsx`, `src/pages/SongPage.jsx` ("Spartito modificato" visibile con `isAdmin`), `src/App.css`

**Interfaces:**
- `/admin`: login con password admin (verificata da `elencoProposte`). Due sezioni:
  - **Proposte nuove**: titolo, autore, parrocchia, link, testo; campo **codice** già compilato con `codiceProposto` e modificabile; "Accetta" (con tag opzionali) / "Rifiuta"; dopo l'accettazione mostra il codice e "Visibile nell'archivio entro un'ora". Il canto accettato **non** entra in nessun raccoglitore: ogni parrocchia lo aggiunge al suo quando lo stampa.
  - **Parrocchie**: elenco, "Nuova parrocchia" (nome, città, password), "Reimposta password".

- [ ] **Step 1:** Implementare.
- [ ] **Step 2:** Verifica Playwright con API intercettata: login sbagliato → errore; giusto → lista; accetta con codice proposto → mostra il codice; crea parrocchia → appare in elenco; la password non compare mai nell'URL né in `localStorage`.
- [ ] **Step 3:** `grep -rn "ADMIN_PIN_HASH\|canti_admin_auth" src` → 0.
- [ ] **Step 4:** Commit `Universale: pannello amministratore`.

### Task 9: Report qualità dati (Fase 2)

**Files:**
- Create: `scripts/report-dati.mjs`, `docs/universale/report-dati.md` (generato)

- [ ] **Step 1:** Lo script legge `public/canti.json` (o un percorso passato come argomento) e scrive un report con: canti senza testo (ID + titolo), ritornelli tutti in MAIUSCOLO, titoli doppi, tag fuori dal vocabolario noto, spartiti con link non Drive.
- [ ] **Step 2:** Eseguirlo sul catalogo di oggi → report con 97 canti senza testo (numero verificato al Task 0 dell'analisi).
- [ ] **Step 3:** Commit `Universale: report sulla qualità dei dati`.

### Task 10: Messa in funzione con Andrea

**Files:**
- Create: `docs/universale/SETUP.md`
- Modify: `README.md` (sostituisce il README del template Vite)

- [ ] **Step 1:** `SETUP.md`, passo per passo e senza gergo:
  1. Copia del foglio. La fa Claude con lo strumento Drive: "Canti Liturgici — database" nel Drive di Andrea.
  2. Estensioni → Apps Script: incollare `Logica.js`, `Codice.js` e `appsscript.json`.
  3. Ricaricare il foglio → menu "Canti Liturgici" → "Prepara database" → "Imposta password admin".
  4. Esegui il deployment → App web → "Esegui come: me", "Chi può accedere: chiunque" → copia URL.
  5. Nuovo repo GitHub, variabile `VITE_API_URL`, Pages da Actions.
  6. Dal pannello admin: password alla parrocchia "Santa Chiara".
- [ ] **Step 2:** Copiare il foglio con `copy_file` (titolo "Canti Liturgici — database", nel Drive di Andrea). Verificare con `get_file_permissions` che il proprietario della copia sia Andrea.
- [ ] **Step 3:** Andrea esegue i passi 2-4 del SETUP (azioni sul suo account). Con l'URL reale: `curl "<URL>?azione=parrocchie"` → `santa-chiara` presente; `?azione=catalogo` → 258 canti.
- [ ] **Step 4:** Creazione del repo e push. **Prima chiedere conferma ad Andrea** del nome del repo (suggerito `canti-liturgici`) e della visibilità. Poi `gh repo create`, `git push`, `gh variable set VITE_API_URL`, abilitazione di Pages, `gh workflow run`.
- [ ] **Step 5:** Verifica end-to-end sull'indirizzo pubblicato: home 258 canti; `/celebrazioni` → Santa Chiara → Messa 10:30 come oggi; modifica con password → salvataggio → visibile dopo il ricaricamento; proposta → visibile in admin → accettata con il codice proposto nel foglio; il canto nuovo risulta "non nel raccoglitore" per Santa Chiara; aggiunto al raccoglitore con il riferimento proposto → visibile dopo il ricaricamento.
- [ ] **Step 6:** Commit `Universale: guida di messa in funzione`.
