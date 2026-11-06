# Messa in funzione di "Canti Liturgici"

Questa guida porta dalla copia del foglio all'app pubblicata. Si fa una volta sola e richiede circa mezz'ora. Il foglio di Luca e la sua app non vengono toccati.

## 1. La copia del foglio

Nel Drive di Andrea c'è il file **"Canti Liturgici — database"**: è una copia di "Canti Luca", ed è il database della nuova app. Da qui in poi i canti si modificano lì.

## 2. Incollare lo script

1. Aprire il foglio "Canti Liturgici — database".
2. Menu **Estensioni → Apps Script**. Si apre un editor con un file `Codice.gs` quasi vuoto.
3. Sostituire tutto il contenuto di `Codice.gs` con quello di [`apps-script/Codice.js`](../../apps-script/Codice.js).
4. Con il **+** accanto a "File" aggiungere un file di script chiamato `Logica` e incollarci [`apps-script/Logica.js`](../../apps-script/Logica.js).
5. Ingranaggio **Impostazioni progetto** → spuntare "Mostra il file manifest appsscript.json nell'editor". Aprire `appsscript.json` e sostituirlo con [`apps-script/appsscript.json`](../../apps-script/appsscript.json).
6. Salvare (icona del dischetto).

## 3. Preparare il database

1. Tornare al foglio e ricaricare la pagina. Dopo qualche secondo compare il menu **Canti Liturgici**.
2. **Canti Liturgici → Prepara database**. Google chiede le autorizzazioni la prima volta: "Rivedi autorizzazioni" → scegliere il proprio account → "Avanzate" → "Vai al progetto" → "Consenti".
   - Rinomina in `Canti` la scheda dei canti (quella con le colonne ID e Titolo). Il nome non va più cambiato.
   - Crea le schede `Raccoglitori`, `Parrocchie`, `Celebrazioni`, `Proposte`.
   - Rinomina la vecchia scheda delle celebrazioni in "Celebrazioni (vecchio)" e ne copia le righe nella parrocchia "Santa Chiara".
   - Crea la parrocchia "Santa Chiara" e mette nel suo raccoglitore tutti i canti di oggi, con riferimento uguale al codice.
   - Si può rilanciare senza danni: non duplica nulla.
3. **Canti Liturgici → Imposta password admin**: scegliere la password per il pannello admin (almeno 8 caratteri). Nel foglio non viene salvata: lo script ne conserva solo l'impronta (hash).

## 4. Pubblicare lo script

1. Nell'editor Apps Script: **Esegui il deployment → Nuovo deployment**.
2. Tipo: **App web**. "Esegui come": **Me**. "Chi può accedere": **Chiunque**.
3. **Esegui il deployment** e copiare l'**URL dell'app web** (finisce con `/exec`).
4. Controllo veloce: aprire nel browser `<URL>?azione=parrocchie`. Deve comparire `santa-chiara`.

Se in futuro si cambia lo script: **Esegui il deployment → Gestisci deployment → modifica (matita) → Versione: nuova**. Così l'URL resta lo stesso.

## 5. Pubblicare l'app

1. Creare il nuovo repository su GitHub e caricarci il codice (branch `main`).
2. **Settings → Secrets and variables → Actions → Variables → New repository variable**: nome `VITE_API_URL`, valore l'URL del punto 4.
3. **Settings → Pages → Source: GitHub Actions**.
4. **Actions → Deploy su GitHub Pages → Run workflow**.

L'app sarà su `https://<utente>.github.io/<nome-repo>/`. Il catalogo dei canti si aggiorna da solo ogni ora. Per vederlo subito dopo una modifica nel foglio basta rilanciare "Run workflow".

## 6. Primo accesso

1. Aprire `https://<utente>.github.io/<nome-repo>/#/admin` ed entrare con la password admin.
2. In **Parrocchie**, su "Santa Chiara": **Reimposta password** e scegliere la password del coro. Va data a Luca e ai coristi che preparano le celebrazioni.
3. Le altre parrocchie si aggiungono da **Nuova parrocchia**. Partono con il raccoglitore vuoto.

## Come funziona, in breve

| Cosa | Chi | Dove |
|---|---|---|
| Leggere canti e celebrazioni | Tutti, senza login | App |
| Modificare le celebrazioni di una parrocchia | Chi ha la password del coro | App → Celebrazioni → Modifica |
| Aggiungere un canto al raccoglitore della parrocchia | Chi ha la password del coro | Pagina del canto |
| Proporre un canto nuovo | Tutti | App → Suggerisci canto |
| Accettare proposte, creare parrocchie | Admin | App → `#/admin` |
| Correggere testi, tag, spartiti | Chi ha accesso al foglio | Foglio Google, scheda Canti |

Dopo 5 password sbagliate in 10 minuti lo script blocca i tentativi per quella parrocchia, o per l'admin, finché non passano i 10 minuti.
