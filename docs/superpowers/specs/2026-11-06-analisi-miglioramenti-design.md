# Analisi e proposta di miglioramento — Canti Liturgici

*Data: 6 novembre 2026 — Branch: `proposta-miglioramenti` (nulla di questo tocca `main` finché Luca non decide)*

## 1. Perché questo documento

L'app è di Luca. Andrea vuole proporgli dei miglioramenti senza imporli: tutto viene fatto su un branch separato, così Luca può vedere il risultato e decidere se tenerlo o tornare indietro.

L'obiettivo è triplo:
1. **Grafica** più chiara e più comoda durante la celebrazione e le prove.
2. **Dati e velocità**: capire come funziona il "database" (Google Sheets) e migliorarlo **restando a costo zero**.
3. **Versione universale**: non più legata a Santa Chiara, usabile da altre parrocchie che si passano l'app tra conoscenti.

## 2. Chi la usa e come

- **Coro**: cerca un canto in fretta e legge il testo mentre canta.
- **Musicisti** (organo, chitarra, altri strumenti): oltre al testo vogliono accordi o spartito.
- **Assemblea** (estensione possibile): chi segue la celebrazione può cercare il canto e cantare insieme al coro.
- Dispositivi: **telefono** soprattutto, a volte **iPad**.
- Momenti d'uso: durante la celebrazione e, soprattutto, **alle prove**.

**Cosa funziona già e non va stravolto:** la ricerca (per categorie e per parole del testo, senza accenti, con ordinamento per pertinenza) e l'avvio istantaneo offline dalla copia salvata sul telefono.

**Anti-obiettivi** (cose che renderebbero il lavoro un fallimento anche se "funziona"):
- un restyling più bello ma meno leggibile a colpo d'occhio durante la messa;
- qualunque costo ricorrente (hosting, database a pagamento);
- chiunque possa modificare le celebrazioni di una parrocchia non sua;
- obbligare al login chi vuole solo leggere i canti.

## 3. Stato attuale (fatti verificati)

### Architettura
- React 19 + Vite, PWA installabile, pubblicata su GitHub Pages (`LucaValenz/canti-liturgici-santa-chiara`), deploy automatico a ogni push su `main`.
- **Nessun backend**. Il database è un Google Sheet pubblicato in CSV:
  - foglio `Canti` (gid=0): `ID, Titolo, Autori, Tag, Link Youtube, Spartito Originale, Spartito Modificato, Testo, Note`;
  - foglio `Celebrazioni` (gid=1649967796): `Celebrazione, Momento, Canto_ID, Note`.
- I suggerimenti vanno a uno script Google Apps Script (`SuggestPage.jsx`), in modalità `no-cors`: l'app non sa se l'invio è andato a buon fine, lo dà per scontato.
- La "modalità admin" è un PIN controllato dentro l'app (hash SHA-256), attivata toccando 5 volte "Parrocchia Santa Chiara".

### I dati (scaricati il 6/11/2026)
| Cosa | Numero |
|---|---|
| Canti | 258 |
| Con testo | **161** (97 senza testo) |
| Con link YouTube | 256 |
| Con spartito originale | 47 |
| Con spartito modificato | 2 |
| Accordi come testo | 0 (solo dentro i PDF) |
| Titoli uguali (autori diversi) | 10 |

- Tag più usati: ingresso (77), finale (65), comunione (49), adorazione (39), offertorio (26), quaresima (20)… I tag mescolano due cose diverse: **momento della messa** (ingresso, offertorio…) e **tempo liturgico** (avvento, quaresima, pasqua…).
- Gli ID (A1, all17, san7, jk2…) sono assegnati a mano senza uno schema fisso. Sono però già usati nei link condivisi, quindi **vanno conservati**.
- Il foglio `Celebrazioni` ha colonne extra a destra (una copia della Messa 12:15 con codici tipo E5, JK2, e "ALDO"): viene usato anche come brutta copia. L'app le ignora, ma rendono fragile il formato.
- I testi seguono la convenzione `<RIT>…</RIT>` per il ritornello e `<RIT/>` per "ripeti ritornello". È applicata in modo coerente, ma alcuni canti hanno il ritornello in MAIUSCOLO e altri no.

### Velocità
- Il catalogo è un unico CSV da **~150 KB** che Google serve in **~1,9 s** (misurato). Il foglio celebrazioni pesa 1,3 KB ma impiega lo stesso tempo, perché la lentezza è di Google e non dipende dalla dimensione.
- Dopo il primo avvio l'app parte subito dalla copia in `localStorage` e aggiorna in background. La lentezza si sente al **primo avvio** e con **segnale debole** in chiesa.

## 4. Problemi e miglioramenti trovati

Priorità: **A** = da fare, impatto alto / costo basso · **B** = utile · **C** = quando c'è tempo.

### 4.1 Bug e fragilità del codice
| # | Problema | Dove | Priorità |
|---|---|---|---|
| 1 | Cambiare scheda celebrazione (10:30 → 12:15) **riscarica il CSV** ogni volta: l'effetto dipende da `searchParams`, che cambia a ogni click | `DailySongsPage.jsx:136-217` | A |
| 2 | La ricerca ricalcola la normalizzazione (minuscole, accenti) di **tutti i testi a ogni tasto premuto**. Basta farla una volta sola al caricamento | `HomePage.jsx:49-56` | B |
| 3 | Logica wake lock e logica "cache + aggiornamento in background" **duplicate** in due pagine | `SongPage.jsx`, `DailySongsPage.jsx`, `SongsContext.jsx` | B |
| 4 | Il wake lock si perde se si cambia app o si blocca lo schermo, e non viene riattivato da solo: il corista deve ricordarsi di ripremerlo | stesse pagine | A |
| 5 | Invio suggerimenti senza conferma reale (`no-cors`): se lo script è rotto l'utente vede comunque "Grazie!" | `SuggestPage.jsx:41` | B |
| 6 | README è ancora quello del template Vite | `README.md` | C |

### 4.2 Sicurezza (da sapere, non drammatico)
- **Lo "Spartito Modificato" non è davvero riservato.** Il link Drive sta nel CSV pubblico: chiunque apra il CSV lo vede. Il PIN nasconde solo il pulsante.
- **Il PIN admin si può ricavare.** Se è un PIN corto (4-6 cifre), dal suo hash SHA-256 si risale al valore in pochi secondi. Oggi sblocca solo un pulsante, quindi il danno è nullo. Diventa un problema se in futuro dovesse proteggere modifiche reali: per questo la versione universale **non** deve riusare questo meccanismo (vedi §6).

### 4.3 Dati
- **97 canti senza testo**: è il miglioramento con più valore per il coro. È lavoro di inserimento, non di codice.
- **Separare i tag in due filtri**: "Momento" (ingresso, offertorio, comunione…) e "Tempo liturgico" (avvento, quaresima…). Così si può cercare "comunione + quaresima". Scelta: un vocabolario fisso che l'app smista da sola, senza toccare il foglio (vedi §7).
- **Ripulire il foglio Celebrazioni** dalle colonne extra. Le brutte copie vanno in un'altra scheda non pubblicata.
- **Uniformare i ritornelli** (niente MAIUSCOLO: lo stile del ritornello lo decide l'app).

### 4.4 Velocità (a costo zero)
Il collo di bottiglia è Google, non l'app. Opzioni dalla più semplice alla più efficace:

1. **(A) Ridurre il lavoro inutile**: correggere il bug §4.1-1 e precalcolare la ricerca. Costo quasi nullo.
2. **(B) Catalogo come file statico su GitHub Pages.** Una GitHub Action gratuita scarica il foglio, lo converte in `canti.json` e lo pubblica insieme all'app. GitHub Pages lo serve compresso (~40 KB invece di 150 KB) dalla sua CDN, in decine di millisecondi invece di ~2 s. Il foglio resta il posto dove si modificano i canti.
   - L'aggiornamento parte con un pulsante "Pubblica" (lanciato a mano) oppure da uno script Apps Script quando si modifica il foglio.
   - Rischio: un canto appena aggiunto compare dopo 1-2 minuti invece che subito. Per un catalogo che cambia poche volte a settimana va bene.
   - Il CSV di Google resta come riserva se il JSON non è raggiungibile.
3. Le **celebrazioni** invece cambiano ogni settimana e devono essere fresche: restano lette dal vivo.

**Raccomandazione:** fare subito 1. Fare 2 insieme alla versione universale, perché in quel momento si rifà comunque il modo in cui si leggono i dati.

### 4.5 Esperienza d'uso
- **Wake lock automatico** sulle pagine canto e celebrazione (con interruttore per spegnerlo), riattivato quando si torna sull'app. Oggi è un pulsante "🌙 Schermo Normale" che quasi nessuno capisce.
- **Modalità prova / esecuzione nelle celebrazioni**: passare al canto successivo o precedente con un tocco o uno scorrimento, senza tornare alla lista.
- **Anteprime PDF caricate solo su richiesta**: oggi ogni pagina canto con spartito carica un iframe di Google Drive, pesante su telefono e inutile offline.
- **Barre strumenti**: pulsanti con emoji e testo lungo ("☀️ Schermo Sempre Attivo (ON)") da sostituire con icone chiare e una sola riga compatta.
- **Card canto interamente toccabile** (oggi solo il link "Vedi Canto e Testo →").
- **Font size**: già condivisa tra pagine, bene. Va resa più visibile e con passi più ampi per l'iPad sul leggio.
- **iPad orizzontale**: oggi c'è un solo breakpoint (600px). Sul leggio servirebbe testo su due colonne o margini più larghi.

### 4.6 Accordi (novità, priorità C)
Oggi gli accordi esistono solo nei PDF (47 canti). Proposta per il futuro: una colonna opzionale `Accordi` con il testo in formato ChordPro (`[Do]Acclamate al [Sol]Signore`). L'app la mostra con gli accordi sopra le parole e un pulsante di trasposizione (±1 semitono, capotasto). È una funzione nuova e richiede di trascrivere gli accordi canto per canto, quindi va dopo tutto il resto.

### 4.7 Diritto d'autore
Molti testi e spartiti (Frisina, RnS, Buttazzo…) sono protetti. Dentro una parrocchia l'uso è tollerato. Un archivio aperto a più parrocchie, anche solo tra conoscenti, rende la cosa più visibile. Il documento non blocca il progetto per questo, ma consiglia di:
- non indicizzare l'app sui motori di ricerca (`noindex`);
- non promuoverla pubblicamente;
- preferire link (YouTube, editori) a PDF caricati, dove possibile.

## 5. Restyling (Fase 1, sul branch)

**Fatto con la skill Impeccable**, partendo dall'identità che c'è già, senza buttarla via: pergamena, rosso amaranto, oro, EB Garamond + Cinzel, tema scuro "veglia".

Obiettivi, in ordine di importanza:
1. **Leggibilità del testo durante la celebrazione**: contrasto, interlinea, dimensione, ritornello ben distinto. Il tema scuro deve funzionare in chiesa poco illuminata.
2. **Gerarchia chiara** in home, pagina canto e celebrazioni: una cosa principale per schermata.
3. **Barre strumenti** ripensate (§4.5): icone, wake lock automatico.
4. **Celebrazioni**: lista momento → canto più compatta, testo espandibile, passaggio rapido al canto successivo.
5. **Telefono prima di tutto**, ma con un layout pensato per iPad.
6. Accessibilità: aree tocco ≥ 44px, focus visibile, contrasto AA.

**Fuori dal restyling**: cambi al formato dei fogli, versione universale, accordi. Il restyling resta "Santa Chiara": il nome lo toglie la Fase 3. *(Scelta mia: tenere separati i due cambi rende più facile per Luca accettarne uno solo.)*

Fanno parte del restyling anche le correzioni A di §4.1 (bug 1 e 4), perché toccano le stesse schermate.

## 6. Versione universale (Fase 3)

### Modello deciso con Andrea
- **Un solo archivio canti, uguale per tutti**, senza il nome Santa Chiara. Lettura libera, **senza login**.
- **Suggerimenti**: chiunque propone un canto (indicando la parrocchia). Le proposte finiscono in un **pannello amministratore**, dove l'admin (Luca, Andrea) le accetta e le inserisce. Nessuno scrive direttamente nell'archivio.
- **Celebrazioni per parrocchia**:
  - nella sezione Celebrazioni si sceglie/scrive la propria parrocchia e si vedono le sue celebrazioni (10:30, 12:15, Adorazione…). **La lettura è libera**: serve anche a chi segue dai banchi;
  - **modificare** richiede nome parrocchia + **password condivisa** tra i coristi di quella parrocchia. Niente account personali;
  - una parrocchia che non usa le celebrazioni non deve fare nulla: usa solo l'archivio.
- Diffusione: tra conoscenti, nessuna vendita, nessuna promozione.

### Confermato da Andrea
- **Le parrocchie le registra l'admin**, che assegna anche la password. Evita parrocchie doppie o finte, ed è coerente con la diffusione tra conoscenti.
- Le celebrazioni scelgono i canti **solo dall'archivio comune**. Se un canto manca, lo si propone.
- Gli **ID esistenti restano** (i link condivisi continuano a funzionare). I nuovi canti ricevono un ID assegnato automaticamente.

### Vincolo tecnico chiave
Una password che protegga davvero **deve essere controllata su un server**, non dentro l'app (vedi §4.2). Le due strade gratuite:

| | **A. Google Sheets + Apps Script** | **B. Supabase (piano gratuito)** |
|---|---|---|
| Dove stanno i dati | Lo stesso Google Sheet di oggi, con nuove schede | Database Postgres |
| Lettura | CSV pubblicato o JSON statico (§4.4-2) | API Supabase, veloce |
| Scrittura protetta | Apps Script `doPost` che controlla la password sul server | Funzioni nel database con controllo password |
| Admin | Può lavorare **direttamente nel foglio**, come oggi | Serve per forza un pannello nell'app |
| Costo | Zero, nessun limite rilevante a questa scala | Zero, ma il progetto **si sospende dopo 7 giorni senza uso** e va riattivato a mano |
| Velocità di scrittura | 1-3 s per salvataggio | < 0,5 s |
| Familiarità per Luca | Alta: è quello che usa già | Nuovo strumento |

**Raccomandazione: A.** Resta tutto nel foglio che Luca conosce. Il costo resta zero senza rischio di sospensione. La lentezza riguarda solo il salvataggio (raro), non la lettura.

### Struttura dati proposta (strada A)
Schede del Google Sheet:
- `Canti` — come oggi, pubblicata. Più eventualmente `Momento` e `Tempo` separati (§4.3) e, in futuro, `Accordi`.
- `Parrocchie` — `Nome`, `Slug` (es. `santa-chiara-roma`), `Città`, `PasswordHash`. **Non pubblicata**: solo lo script la legge.
- `Celebrazioni` — `Parrocchia` (slug), `Celebrazione`, `Ordine`, `Momento`, `Canto_ID`, `Note`. Pubblicata (sono dati pubblici).
- `Proposte` — `Data`, `Parrocchia`, `Titolo`, `Autore`, `Link`, `Testo`, `Note`, `Nome`, `Stato` (nuova/accettata/rifiutata). Non pubblicata.

Script Apps Script (uno solo):
- `salvaCelebrazione(parrocchia, password, celebrazione, righe)` → controlla l'hash della password, poi sostituisce le righe di quella celebrazione;
- `proponiCanto(...)` → aggiunge una riga a `Proposte` e risponde davvero con un esito;
- `accettaProposta(adminPassword, id)` → copia in `Canti` con nuovo ID (solo se si fa il pannello in app);
- limite di tentativi per password sbagliata (CacheService), per impedire di provare password a raffica.

L'app ricorda la password della parrocchia sul dispositivo dopo il primo inserimento, così il corista non la riscrive ogni domenica.

### Pannello amministratore
- **Passo 1 (minimo):** l'admin lavora nel foglio. Apre `Proposte`, copia la riga in `Canti`, segna "accettata". Zero codice.
- **Passo 2:** schermata admin nell'app con elenco proposte, "Accetta" / "Rifiuta", e gestione parrocchie (crea, reimposta password).

### Decisioni di Andrea per le Fasi 2-3 (6/11/2026)
- Si fanno insieme **Fase 2** (pulizia dati, suggerimenti con conferma vera, catalogo veloce) e **Fase 3** (versione universale). Gli accordi (Fase 4) restano per dopo.
- La versione universale vive in un **nuovo repository sul GitHub di Andrea**. L'app di Luca resta com'è finché non decidono di spostarsi.
- Il database è una **copia di "Canti Luca" nel Drive di Andrea**. Il foglio di Luca non si tocca.
- **Nome provvisorio**: "Canti Liturgici". Il nome definitivo si decide dopo e va cambiato in un punto solo.
- Andrea ha accesso in modifica al foglio di Luca. Lo strumento Drive a disposizione legge e copia i fogli ma non modifica le celle: le modifiche ai dati passano dallo script Apps Script, attivato da Andrea.

### Nome, indirizzo, link
- Nome neutro (da scegliere) e nuovo indirizzo. Il percorso `/canti-liturgici-santa-chiara/` è scritto a mano in `vite.config.js` (base, manifest, icone) e nei link condivisi: va cambiato ovunque in un colpo solo.
- **Chi ha già installato l'app** con l'indirizzo vecchio deve reinstallarla. Si può lasciare all'indirizzo vecchio una pagina che reindirizza.
- La scelta della parrocchia si ricorda sul dispositivo. Il link condiviso include la parrocchia (`/celebrazioni/santa-chiara-roma?c=Messa%2010:30`).

## 7. Ordine di lavoro proposto

| Fase | Cosa | Dove | Dipende da |
|---|---|---|---|
| **0** | Questo documento | branch `proposta-miglioramenti` | — |
| **1** | Restyling con Impeccable + bug A (§4.1-1, §4.1-4) + UX §4.5 | stesso branch | approvazione documento |
| **2** | Pulizia dati (§4.3) e ricerca precalcolata | foglio + codice | Luca d'accordo |
| **3** | Versione universale (§6) + catalogo statico (§4.4-2) | nuovo branch / repo | decisione di Luca su nome e gestione |
| **4** | Accordi con trasposizione (§4.6) | — | Fase 3 |

Ogni fase si può accettare o rifiutare da sola.

**Il piano di lavoro dettagliato copre solo la Fase 1.** Le fasi successive avranno un piano proprio, dopo che Luca ha visto la Fase 1. Nella Fase 1, wake lock e "cache + aggiornamento" vanno scritti una volta sola come hook condivisi, così la Fase 3 li riusa.

### Come Luca vede il lavoro
Niente pubblicazione online del branch. Andrea mostra il restyling dal suo PC:
- **screenshot prima/dopo** (telefono, iPad, tema chiaro e scuro) preparati alla fine della Fase 1;
- oppure dal vivo con `npm run dev -- --host`, che rende l'app raggiungibile da un telefono collegato alla stessa rete Wi-Fi (`http://<IP del PC>:5173/canti-liturgici-santa-chiara/`).

### Accessi
Andrea oggi non ha accesso in modifica al foglio Google, allo script Apps Script e al repo di Luca: li chiederà prima della Fase 2. La Fase 1 non ne ha bisogno.

### Regole di sicurezza per non rompere l'app di Luca *(scelte mie)*
- **Il foglio Google in uso non si tocca** finché Luca non approva. La Fase 1 non cambia nessun dato. Le Fasi 2 e 3 lavorano su una **copia del foglio** e passano a quello vero solo dopo l'approvazione.
- **Tag "Momento" / "Tempo liturgico"**: li smista l'app con un vocabolario fisso (tempi: avvento, natale, quaresima, palme, giovedì/venerdì santo, pasqua, pentecoste, ognissanti, mariano, san francesco, spirito santo; tutto il resto è "momento"). Nessuna modifica al foglio. Un tag nuovo e sconosciuto finisce tra i momenti.
- **Link vecchi dopo la Fase 3**: all'indirizzo vecchio resta una pagina che traduce `#/song/:id` e `#/daily?celebrazione=` nei nuovi indirizzi, così i link già girati su WhatsApp continuano a funzionare.
- **Nuovi ID automatici** (Fase 3): prefisso che non può collidere con quelli manuali (es. `N` + numero progressivo, controllando che non esista già).

## 8. Lasciato a chi costruisce
- Scelta delle icone e dei dettagli grafici, dentro l'identità esistente.
- Libreria o meno per lo scorrimento tra canti (preferibilmente niente dipendenze nuove).
- Formato esatto del JSON statico e dello script Apps Script.
