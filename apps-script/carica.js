// Solo per i test: Apps Script non ha import/export, quindi i file dello script
// si caricano in un contesto vm e le funzioni globali diventano proprietà del contesto.
import { readFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'

export function carica(file, globali = {}) {
    const contesto = createContext({ ...globali })
    for (const nome of [].concat(file)) {
        runInContext(readFileSync(new URL(nome, import.meta.url), 'utf8'), contesto, { filename: nome })
    }
    return contesto
}
