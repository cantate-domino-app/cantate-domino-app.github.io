# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Coro** (pubblico principale): cerca in fretta un canto e ne legge il testo mentre canta, durante la celebrazione e soprattutto alle prove.
- **Musicisti** (organo, chitarra, altri strumenti): oltre al testo cercano accordi o spartito per suonare.
- **Assemblea** (estensione): chi segue la celebrazione cerca il canto e canta insieme al coro.
- Diversi utenti sono **anziani o non vedono bene**, e leggono anche da una certa distanza (telefono o iPad sul leggio).

## Product Purpose

Archivio di canti liturgici con testi, spartiti e link di ascolto, più le liste dei canti per ogni celebrazione (Messa 10:30, 12:15, Adorazione…). Funziona quando un corista trova il canto in pochi secondi e lo legge senza sforzo nel momento in cui serve.

## Positioning

Strumento di lavoro per chi anima la liturgia, fatto da e per una comunità parrocchiale. Nessuno scopo commerciale. Oggi è della Parrocchia Santa Chiara; in futuro diventerà universale e verrà condiviso tra conoscenti con altre parrocchie: archivio comune aperto a tutti, celebrazioni per parrocchia protette da password condivisa, nuovi canti proposti e approvati da un amministratore.

## Operating Context

- Si usa da telefono e da iPad, spesso con poca luce (chiesa) e segnale debole.
- Momenti d'uso: durante la celebrazione e alle prove, con passaggi rapidi da un canto all'altro.
- Lo schermo deve restare acceso mentre si canta o si suona.
- Il coordinatore prepara i canti della celebrazione e li condivide con un link (spesso su WhatsApp).

## Capabilities and Constraints

- PWA React + Vite su GitHub Pages; funziona offline dopo il primo avvio.
- **Costo zero** obbligatorio. Oggi i dati stanno su Google Sheets (CSV pubblicato) e i suggerimenti vanno a uno script Google Apps Script. **Il backend può cambiare in futuro**: non va dato per scontato nel design.
- Ricerca per titolo, autore, ID, parole del testo; filtri per momento della messa e tempo liturgico.
- Testi con ritornello marcato `<RIT>…</RIT>`; spartiti come PDF su Google Drive; gli accordi oggi esistono solo nei PDF.
- UI, testi e commenti in italiano.

## Brand Commitments

- Identità esistente da mantenere: pergamena, rosso amaranto, oro, EB Garamond e Cinzel, tema scuro "veglia".
- Oggi il nome visibile è "Canti Liturgici — Parrocchia Santa Chiara"; il riferimento a Santa Chiara sarà tolto nella versione universale.

## Evidence on Hand

- 258 canti reali nel foglio (161 con testo, 47 con spartito, 256 con YouTube).
- Celebrazioni reali di Santa Chiara (Messa 10:30, Messa 12:15, Adorazione).
- Nessuna testimonianza o statistica d'uso: non inventarne.

## Product Principles

1. Il testo da cantare viene prima di tutto: leggibile a colpo d'occhio, anche da lontano e con poca luce.
2. Ogni gesto in più durante la celebrazione è un costo: arrivare al canto giusto deve richiedere il minimo di tocchi.
3. Funziona sempre, anche offline o con segnale debole.
4. Gratis e semplice da mantenere per volontari non tecnici.

## Accessibility & Inclusion

- Molti utenti anziani o con vista ridotta: testo grande regolabile (fino a 36px), contrasto almeno WCAG AA (meglio AAA per il testo dei canti), aree di tocco ≥ 44px.
- Leggibile su leggio a distanza e in ambienti poco illuminati.
