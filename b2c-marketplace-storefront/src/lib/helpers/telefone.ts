// ---------------------------------------------------------------------------
// Mascara de telefone brasileiro: (DD) 9999-9999 ou (DD) 99999-9999.
// Guarda so' digitos por tras; a mascara e' apresentacao.
// ---------------------------------------------------------------------------

export function somenteDigitosTelefone(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, 11)
}

export function formatarTelefone(valor: string): string {
  const d = somenteDigitosTelefone(valor)
  if (d.length === 0) return ""
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function telefoneValido(valor: string): boolean {
  const n = somenteDigitosTelefone(valor).length
  return n === 10 || n === 11
}
