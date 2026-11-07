// Unico punto in cui si definiscono nome e indirizzi dell'app.
// Letto anche da vite.config.js (in Node import.meta.env non esiste, da qui il ?.).
export const APP_NAME = 'Cantate Domino'
export const APP_SHORT_NAME = 'Cantate Domino'
export const APP_DESCRIPTION = 'Archivio di canti liturgici per cori e musicisti: testi, spartiti e canti delle celebrazioni.'
export const API_URL = import.meta.env?.VITE_API_URL || ''
export const BASE = import.meta.env?.BASE_URL || '/'
