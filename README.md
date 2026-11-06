# Canti Liturgici

Archivio di canti liturgici per cori e musicisti: testi, spartiti, link YouTube e i canti delle celebrazioni di ogni parrocchia. È una PWA che si installa sul telefono e funziona anche offline. È gratuita e non è in vendita.

## Come è fatta

- **Database**: un foglio Google. Uno script Apps Script ([`apps-script/`](apps-script/)) lo legge e lo scrive. Le password sono verificate dallo script, mai nel browser.
- **Catalogo canti**: una GitHub Action lo scarica ogni ora in `public/canti.json` ([`scripts/scarica-catalogo.mjs`](scripts/scarica-catalogo.mjs)). Così l'app si apre subito.
- **App**: React + Vite, pubblicata su GitHub Pages.

La messa in funzione passo per passo è in [`docs/universale/SETUP.md`](docs/universale/SETUP.md).

## Comandi

```bash
npm run dev       # server di sviluppo
npm test          # test (logica dello script e librerie)
npm run lint
npm run build     # serve VITE_API_URL e, se diverso, BASE_PATH (default /canti-liturgici/)
node scripts/report-dati.mjs > docs/universale/report-dati.md   # report qualità dati
```

In sviluppo `public/canti.json` si genera con `VITE_API_URL=<url dello script> node scripts/scarica-catalogo.mjs`.
