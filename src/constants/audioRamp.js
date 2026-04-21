/**
 * Única fuente de verdad para rampas del audio principal (bajada/subida).
 * Cambiar solo aquí; App.jsx importa estos valores.
 */
export const MAIN_VOLUME_RAMP_SEC = 1
export const MAIN_NAV_RAMP_MS = Math.round(MAIN_VOLUME_RAMP_SEC * 1000)
