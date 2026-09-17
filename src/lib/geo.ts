// Fusos horários do Brasil (IANA) — usado só como sugestão inicial (método de
// pagamento no Contribute, campos de localização no cadastro); o usuário
// sempre pode trocar manualmente. Nenhuma chamada de rede, só o fuso que o
// próprio navegador já expõe.
export const BRAZIL_TIMEZONES = new Set([
  'America/Sao_Paulo', 'America/Bahia', 'America/Fortaleza', 'America/Recife',
  'America/Araguaina', 'America/Maceio', 'America/Belem', 'America/Santarem',
  'America/Manaus', 'America/Boa_Vista', 'America/Porto_Velho', 'America/Cuiaba',
  'America/Campo_Grande', 'America/Rio_Branco', 'America/Eirunepe', 'America/Noronha',
])

export function detectLikelyBrazil(): boolean {
  try {
    return BRAZIL_TIMEZONES.has(Intl.DateTimeFormat().resolvedOptions().timeZone)
  } catch {
    return true // sem suporte a Intl.DateTimeFormat: assume Brasil (comportamento anterior)
  }
}
