// Formatos compartidos para tablas y listas

// "5 nov 2026" (con hora completa disponible en el tooltip)
export function formatShortDate(value, lang = 'es') {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatFullDate(value, lang = 'es') {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString(lang === 'en' ? 'en-GB' : 'es-ES')
}
