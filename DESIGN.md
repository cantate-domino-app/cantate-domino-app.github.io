---
name: Canti Liturgici
description: Archivio di canti liturgici da leggere sul leggio, durante la messa e alle prove.
colors:
  rubric: "#8b261e"
  rubric-hover: "#6d1b14"
  rubric-soft: "#f6e7e3"
  on-rubric: "#ffffff"
  gold: "#8a5b0f"
  gold-soft: "#f9f1de"
  ink: "#2b231d"
  muted: "#6e6053"
  bg: "#f5f0e6"
  surface: "#fcfaf4"
  bar: "#ede6d6"
  line: "#dfd4bf"
  chorus: "#efe7d6"
  danger: "#a1251b"
  success: "#1e6b3d"
  success-soft: "#e3efe6"
  veglia-rubric: "#e0a33a"
  veglia-rubric-hover: "#ecb85c"
  veglia-rubric-soft: "rgba(224, 163, 58, 0.14)"
  veglia-on-rubric: "#141210"
  veglia-ink: "#f0e8da"
  veglia-muted: "#a89a89"
  veglia-bg: "#141210"
  veglia-surface: "#1d1915"
  veglia-bar: "#1a1714"
  veglia-line: "#38312a"
  veglia-chorus: "#241f1a"
  veglia-gold-soft: "rgba(224, 163, 58, 0.12)"
  veglia-danger: "#f08a7e"
  veglia-success: "#7fcf9b"
typography:
  display:
    fontFamily: "Cinzel, EB Garamond, Georgia, serif"
    fontSize: "1.6rem"
    fontWeight: 700
    lineHeight: 1.15
  wordmark:
    fontFamily: "Cinzel, EB Garamond, Georgia, serif"
    fontSize: "1.15rem"
    fontWeight: 700
    letterSpacing: "0.03em"
  headline:
    fontFamily: "EB Garamond, Palatino Linotype, Book Antiqua, Palatino, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.15
  title:
    fontFamily: "EB Garamond, Palatino Linotype, Book Antiqua, Palatino, Georgia, serif"
    fontSize: "1.2rem"
    fontWeight: 600
    lineHeight: 1.2
  lyrics:
    fontFamily: "EB Garamond, Palatino Linotype, Book Antiqua, Palatino, Georgia, serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "EB Garamond, Palatino Linotype, Book Antiqua, Palatino, Georgia, serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "EB Garamond, Palatino Linotype, Book Antiqua, Palatino, Georgia, serif"
    fontSize: "0.95rem"
    fontWeight: 400
  label:
    fontFamily: "Cinzel, EB Garamond, Georgia, serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.12em"
rounded:
  badge: "4px"
  chorus: "10px"
  md: "12px"
  search: "14px"
  sheet: "20px"
  pill: "999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  tap: "44px"
  row: "68px"
components:
  button-primary:
    backgroundColor: "{colors.rubric}"
    textColor: "{colors.on-rubric}"
    rounded: "{rounded.pill}"
    padding: "0 1.1rem"
    height: "{spacing.tap}"
  button-primary-hover:
    backgroundColor: "{colors.rubric-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 1.1rem"
    height: "{spacing.tap}"
  icon-button:
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    size: "{spacing.tap}"
  icon-button-on:
    backgroundColor: "{colors.rubric-soft}"
    textColor: "{colors.rubric}"
  chip-filter:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 0.9rem"
    height: "40px"
  chip-filter-active:
    backgroundColor: "{colors.rubric}"
    textColor: "{colors.on-rubric}"
  celebration-tab:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 1.1rem"
    height: "{spacing.tap}"
  celebration-tab-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.search}"
    padding: "0 3.25rem 0 2.9rem"
    height: "54px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.7rem 0.9rem"
    height: "52px"
  song-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    padding: "0.6rem 0 0.6rem 1rem"
    height: "{spacing.row}"
  chorus-block:
    backgroundColor: "{colors.chorus}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chorus}"
  rubric:
    textColor: "{colors.rubric}"
    typography: "{typography.label}"
  stepper-next:
    backgroundColor: "{colors.rubric}"
    textColor: "{colors.on-rubric}"
    rounded: "{rounded.md}"
    padding: "0.35rem 0.75rem"
    height: "56px"
  notes-box:
    backgroundColor: "{colors.gold-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.9rem 1rem"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    width: "440px"
---

# Design System: Canti Liturgici

## Overview

**Creative North Star: "Il messale sul leggio"**

Il sistema è costruito come una pagina di libro liturgico appoggiata su un leggio: fondo pergamena, testo in inchiostro scuro, e tutto ciò che *indica* (il momento della messa, il numero di strofa, il segno ℟ del ritornello, l'intestazione di una sezione) composto come rubrica, in maiuscoletto Cinzel rosso amaranto. Il testo da cantare non è mai in rosso; le indicazioni non sono mai in inchiostro. Questa separazione è l'unica idea decorativa del sistema e regge tutta la gerarchia.

La densità è quella di uno strumento di lavoro: l'archivio è a righe con filetti sottili, non a schede; la celebrazione è una lista compatta che si apre sul canto che serve; la pagina del canto è una colonna stretta di testo grande allineato a sinistra. Le barre (in alto, in basso, menu laterale) hanno un tono di pergamena più scuro e un filetto, mai un'ombra. La profondità compare solo per ciò che si sovrappone davvero alla pagina: menu laterale e finestre.

Il tema scuro, "veglia", non è un'inversione meccanica: la pergamena diventa legno bruciato quasi nero, l'inchiostro diventa avorio e la rubrica passa dal rosso all'oro, perché il rosso amaranto su fondo scuro non regge il contrasto in chiesa con poca luce. Le icone sono disegnate a tratto, tutte con lo stesso spessore, e prendono il colore dal testo.

**Key Characteristics:**
- Rubrica rossa (oro in veglia) in maiuscoletto Cinzel per ogni indicazione; testo da cantare in inchiostro EB Garamond.
- Testo dei canti grande (22px di partenza, regolabile da 16 a 36px), interlinea 1.5, allineato a sinistra, con numero di strofa e ℟ nel margine.
- Ritornello in grassetto su un fondo pergamena più carico, che sporge appena oltre il testo.
- Superfici piatte separate da filetti; ombra solo per menu e finestre sovrapposti.
- Aree di tocco di almeno 44px, righe d'archivio da 68px, righe di celebrazione da 72px.
- Icone SVG a tratto (1.8) su griglia 24, colore `currentColor`.

## Colors

Pergamena calda e inchiostro bruno, con un solo accento che cambia natura col tema: rosso amaranto di giorno, oro in veglia.

### Primary
- **Rosso Amaranto di Rubrica** (rubric): il colore delle rubriche (momento, numero di strofa, ℟, intestazioni di sezione), dei link, del contorno di focus, dell'azione principale (pulsante pieno, "canto successivo") e del filtro selezionato. Diventa più scuro (rubric-hover) al passaggio del puntatore.
- **Velo di Rubrica** (rubric-soft): fondo rosato appena percettibile per hover di righe e pulsanti icona, per lo stato "acceso" di un pulsante icona (schermo sempre acceso, dimensione testo), per la voce attiva del menu e per l'alone di focus dei campi.
- **Oro di Veglia** (veglia-rubric): nel tema scuro sostituisce il rosso in tutti i ruoli della rubrica; sul pieno oro il testo è quasi nero (veglia-on-rubric).

### Secondary
- **Oro Scurito** (gold): oro abbassato per restare leggibile su pergamena; usato solo per i segnali dell'amministratore (stato admin nel menu, nome dello spartito modificato).
- **Fondo Oro** (gold-soft): fondo dei riquadri di note (note del canto, note della celebrazione).

### Neutral
- **Inchiostro** (ink): testo da cantare, titoli, etichette dei pulsanti. In veglia diventa avorio (veglia-ink).
- **Inchiostro Sbiadito** (muted): autori in corsivo, conteggi, segnaposto, icone di servizio (chevron, cerca, play nella riga).
- **Pergamena** (bg): fondo della pagina.
- **Carta Chiara** (surface): righe dell'archivio e della celebrazione, campi, pulsanti secondari, finestre.
- **Pergamena di Bordo** (bar): barra dell'app, barra del canto, pannello dimensione testo, barra in basso tra i canti, menu laterale.
- **Filetto** (line): tutti i bordi e divisori a 1px.
- **Fondo Ritornello** (chorus): solo il blocco del ritornello.
- **Errore / Conferma** (danger, success, success-soft): messaggi d'errore e PIN errato; conferma "link copiato" e invio del suggerimento riuscito.

### Named Rules
**La Regola della Rubrica.** Ciò che si canta è in inchiostro; ciò che indica è in rubrica. Un testo da cantare non prende mai il colore rubric, e un'indicazione liturgica non è mai composta in inchiostro.

**La Regola della Veglia.** Nel tema scuro la rubrica è oro, non rosso: ogni uso di rubric si risolve in veglia-rubric, e il testo sopra un pieno oro è veglia-on-rubric, mai bianco.

## Typography

**Display Font:** Cinzel (con EB Garamond, Georgia, serif)
**Body Font:** EB Garamond (con Palatino Linotype, Book Antiqua, Palatino, Georgia, serif)

**Character:** Cinzel, maiuscolo lapidario, è riservato alle voci che *nominano*: rubriche, marchio, titoli di pagina e di finestra. EB Garamond porta tutto ciò che si legge e si canta, in tondo e corsivo, con pesi 400 e 600 (700 caricato ma usato solo da Cinzel).

### Hierarchy
- **Display** (Cinzel 700, 1.6rem, 1.15): titoli di pagina ("Celebrazioni", "Suggerisci un canto"); a 1.2rem per i titoli delle finestre.
- **Wordmark** (Cinzel 700, 1.15rem, spaziatura 0.03em): nome dell'app nella barra; sotto, il nome della parrocchia in Garamond 0.85rem sbiadito.
- **Headline** (Garamond 600, 2rem, 2.4rem da 600px, 1.15): titolo del canto. Titoli in minuscolo naturale, non in maiuscolo.
- **Title** (Garamond 600, 1.2rem nell'archivio, 1.25rem nella celebrazione, 1.2): titolo del canto in una riga.
- **Lyrics** (Garamond 400, 22px di partenza, da 16 a 36px a passi scelti dall'utente, 1.5): testo del canto; il ritornello passa a 600. Colonna massima 44rem.
- **Body** (Garamond 400, 18px, 1.5): testo d'interfaccia.
- **Meta** (Garamond 400 corsivo, 0.95rem, sbiadito): autori sotto i titoli; 1.1rem sotto il titolo del canto.
- **Label / Rubrica** (Cinzel 700, 0.75rem, spaziatura 0.12em, maiuscolo): momento della messa, tag e ID sopra il titolo, intestazione "Spartiti e ascolto"; 0.68rem nella barra in basso. L'ID nella riga d'archivio usa Cinzel 700 0.8rem con spaziatura 0.04em.

### Named Rules
**La Regola del Maiuscoletto.** Cinzel e il maiuscolo si usano solo per rubriche, marchio e titoli di pagina o finestra. I titoli dei canti e il testo restano in Garamond con le maiuscole naturali.

**La Regola dei Numeri nel Margine.** Numero di strofa e ℟ stanno in una colonna di margine larga 1.6em, a 0.8em in rubrica 600; il testo resta allineato a sinistra su un unico filo.

## Layout

Una sola colonna su telefono, con margini laterali di 1rem per liste e controlli e 1.5rem per la pagina del canto. Il contenuto si ferma a 1080px; testo del canto e intestazione a 44rem; il modulo di suggerimento a 40rem. Le liste (archivio, celebrazione) vanno da bordo a bordo su telefono, con righe piene di carta chiara separate da filetti.

Il ritmo usa multipli di rem: 0.5 e 0.75 dentro i controlli, 1 tra blocchi, 1.25-2 tra sezioni (con filetto sopra le sezioni della pagina canto). Filtri e schede di celebrazione scorrono in orizzontale senza barra di scorrimento visibile; i filtri hanno un'etichetta fissa a sinistra ("Momento", "Tempo liturgico").

La barra del canto è appiccicata in alto; quando si arriva da una celebrazione una barra fissa in basso (precedente / posizione / successivo, griglia 1fr auto 1fr) porta da un canto all'altro, e la pagina aggiunge 6rem di spazio sotto. Tutte le barre rispettano le aree sicure dello schermo.

Da 600px le finestre diventano centrate invece che ancorate in basso, e il titolo del canto cresce. Da 900px l'archivio passa a due colonne di righe dentro un riquadro con filetto e angoli di 12px, la celebrazione si chiude nello stesso riquadro, i margini della pagina salgono a 1.5rem e la barra in basso si allinea alla colonna di 1080px.

**La Regola delle Righe.** L'archivio e la celebrazione sono liste di righe con filetto, non griglie di schede: su un telefono devono stare 6-7 canti in uno schermo.

## Elevation & Depth

Il sistema è piatto. La gerarchia di superficie è tonale: pergamena (bg) per la pagina, carta chiara (surface) per righe e campi, pergamena di bordo (bar) per le barre, sempre con un filetto da 1px. Un'unica ombra morbida e scura, calda nel tema chiaro e più densa in veglia, compare solo sul menu laterale aperto e sulle finestre (admin, installazione su iPhone), sopra un velo bruno semitrasparente.

### Shadow Vocabulary
- **Sovrapposizione** (`box-shadow: 0 10px 30px -12px rgba(43, 35, 29, 0.35)`; in veglia `0 12px 32px -10px rgba(0, 0, 0, 0.7)`): menu laterale aperto e finestre.
- **Alone di focus** (`box-shadow: 0 0 0 3px var(--rubric-soft)`): campi di ricerca, testo e PIN a fuoco, insieme al bordo in rubrica.

### Named Rules
**La Regola della Pagina Piatta.** Righe, barre, pulsanti e riquadri non hanno ombra. L'ombra significa "questo sta sopra la pagina" e appartiene solo a menu e finestre.

## Shapes

Forme morbide ma sobrie. Angoli di 12px per pulsanti icona, righe interne, riquadri note, anteprima PDF, campi e finestre su schermi larghi; 10px per il blocco del ritornello e le note della celebrazione; 14px per la barra di ricerca; capsula piena (999px) per pulsanti testuali, filtri e schede di celebrazione; 20px in alto per le finestre ancorate in basso; 4px per il piccolo badge "Admin". Il focus da tastiera è un contorno di 3px in rubrica a 2px di distanza, con angoli di 6px.

I bordi sono sempre filetti da 1px in line; l'unico filetto tratteggiato separa le righe delle risorse (YouTube, spartiti) nella pagina canto. Le icone sono a tratto 1.8 con estremità arrotondate.

## Components

### Buttons
Calmi e leggibili: capsule in Garamond 600 da 1rem, altezza minima 44px.
- **Shape:** capsula (999px), padding orizzontale 1.1rem, icona e testo distanziati 0.45rem.
- **Primary:** pieno rubrica con testo on-rubric; più scuro al passaggio. Usato per l'azione principale di ogni contesto: Installa, Invia, Sblocca, "Apri canto e spartiti" nella celebrazione, Ascolta quando il canto non ha testo.
- **Secondary:** carta chiara con filetto e testo in inchiostro; il filetto scurisce a muted al passaggio.
- **Stato completato:** bordo e testo success su success-soft ("Link copiato").
- **Disabilitato:** opacità 0.55.
- **Pulsante icona:** quadrato 44px, angoli 12px, senza fondo; velo di rubrica al passaggio; quando è acceso (`aria-pressed`) velo di rubrica e icona in rubrica.
- **Torna indietro:** link in rubrica 600 da 1.05rem con chevron, testo troncato con puntini.

### Chips
- **Filtri dell'archivio:** capsule da 40px, carta chiara con filetto, Garamond 500 1rem con iniziale maiuscola. Selezionato: pieno rubrica, testo on-rubric, peso 600.
- **Schede di celebrazione:** capsule da 44px, Garamond 600 1.05rem. Selezionata: pieno inchiostro con testo pergamena (non rubrica).

### Cards / Containers
- **Corner Style:** 12px (10px per note di celebrazione).
- **Background:** gold-soft per le note; surface con filetto per la conferma di invio e l'anteprima PDF.
- **Shadow Strategy:** nessuna (vedi Elevation & Depth).
- **Internal Padding:** 0.9rem 1rem per le note; 2.5rem 1.5rem per la conferma.

### Inputs / Fields
- **Style:** carta chiara, filetto, angoli 12px, altezza minima 52px, testo 1.05rem. La ricerca è più grande: 54px, testo 1.1rem, angoli 14px, lente a sinistra e pulsante di cancellazione a destra in muted. Il PIN admin è centrato, 1.8rem, spaziato 0.4em, su fondo pergamena, altezza 60px.
- **Focus:** bordo in rubrica e alone di 3px in rubric-soft, senza contorno del browser.
- **Error:** messaggio in danger 600; il banner d'errore del modulo ha filetto danger e testo danger.
- **Etichette:** Garamond 600; "facoltativo" in 400 sbiadito; asterisco obbligatorio in rubrica.

### Navigation
- **Barra dell'app:** pergamena di bordo con filetto in basso; pulsante menu, marchio in Cinzel con nome della parrocchia sotto, pulsante tema (luna / sole) a destra.
- **Menu laterale:** pannello da sinistra largo fino a 300px (85vw), scorre in 0.25s con curva `cubic-bezier(0.16, 1, 0.3, 1)`; voci da 52px, Garamond 600 1.15rem; voce attiva con velo di rubrica e testo in rubrica. In fondo installazione, tema e stato admin in oro corsivo.
- **Barra del canto:** appiccicata in alto, torna indietro a sinistra, pulsanti icona (dimensione testo, schermo acceso, condividi) a destra. Il pannello della dimensione testo si apre sotto, sullo stesso fondo, con − / valore in px / +.
- **Barra tra i canti:** fissa in basso. "Precedente" senza fondo con rubrica rossa e titolo in inchiostro; "successivo" pieno rubrica allineato a destra, con rubrica e titolo nel colore on-rubric; al centro la posizione "3 / 10" in cifre tabellari sbiadite.
- **Finestre:** foglio ancorato in basso su telefono (angoli 20px in alto, sale in 0.3s), centrato sopra 600px; chiusura con pulsante icona in alto a destra.

### Rubrica
Il componente firma. Cinzel 700 0.75rem, spaziatura 0.12em, maiuscolo, in rubric. Compare: sopra ogni titolo nella lista della celebrazione (il momento della messa); sopra il titolo del canto (momento e ID se si arriva da una celebrazione, altrimenti fino a due tag e l'ID, separati da " · "); come intestazione della sezione "Spartiti e ascolto"; nella barra tra i canti. Nella colonna di margine del testo i numeri di strofa e ℟ usano lo stesso colore ma in Garamond 600 a 0.8em.

### Ritornello
Blocco con fondo chorus, angoli 10px, testo 600; sporge oltre la colonna del testo di min(0.6em, 0.75rem) per lato, così non esce dal margine con testo grande. Un ritornello ripetuto senza testo diventa una riga "℟. Ritornello" interamente in rubrica a 0.85em. Per i lettori di schermo il ritornello è annunciato con un'etichetta nascosta.

### Riga d'archivio
Riga piena di carta chiara alta almeno 68px: colonna di 3rem con l'ID in Cinzel rubrica, poi titolo (title) e autore (meta). Tutta la riga apre il canto; un pulsante play da 52px a destra, in muted (rubrica al passaggio), apre l'ascolto. Velo di rubrica al passaggio.

### Riga di celebrazione
Pulsante a tutta larghezza alto almeno 72px: rubrica del momento, titolo a 1.25rem, autore; chevron in muted a destra. Si apre in un pannello con note, testo del canto e azioni. Un canto non trovato resta nella lista con titolo in 400 sbiadito, senza chevron e senza hover.

## Do's and Don'ts

### Do:
- **Do** componi ogni indicazione liturgica (momento, numero di strofa, ℟, intestazione di sezione) come rubrica: Cinzel 700 maiuscolo in rubric.
- **Do** lascia il testo da cantare in inchiostro, Garamond 400 a 22px di partenza, interlinea 1.5, allineato a sinistra, regolabile da 16 a 36px.
- **Do** separa superfici con filetti da 1px in line e con il cambio di tono bg / surface / bar.
- **Do** tieni ogni area toccabile ad almeno 44px; le righe principali stanno a 52-72px.
- **Do** usa le icone SVG a tratto di Icon.jsx (griglia 24, tratto 1.8, `currentColor`), sempre accompagnate da un nome accessibile.
- **Do** in veglia risolvi ogni rubrica in oro e metti testo quasi nero sopra i pieni oro.
- **Do** rispetta `prefers-reduced-motion`: menu e finestre compaiono senza scorrere.

### Don't:
- **Don't** mettere in rubrica il testo da cantare o un titolo di canto, e non comporre un'indicazione liturgica in inchiostro.
- **Don't** scrivere titoli di canto in maiuscolo o in Cinzel: Cinzel è per rubriche, marchio e titoli di pagina.
- **Don't** trasformare archivio o celebrazione in griglie di schede con ombra.
- **Don't** usare emoji o caratteri come icone nei pulsanti; il segno ℟ è un segno liturgico tipografico, non un'icona.
- **Don't** usare il rosso amaranto nel tema scuro, né testo bianco sopra l'oro.
- **Don't** dare ombra a righe, barre o pulsanti: l'ombra è solo di menu e finestre.
- **Don't** centrare il testo del canto.
