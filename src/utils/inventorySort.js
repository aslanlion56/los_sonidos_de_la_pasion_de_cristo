/** Orden descendente por LUFS (más alto primero); sin dato al final. */
export function compareLufsDesc(a, b) {
  const na = Number.isFinite(a) ? a : Number.NEGATIVE_INFINITY
  const nb = Number.isFinite(b) ? b : Number.NEGATIVE_INFINITY
  if (nb !== na) return nb - na
  return 0
}
