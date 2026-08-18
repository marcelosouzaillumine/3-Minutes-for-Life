export function getTodayInSaoPaulo(): string {
  // Retorna a data no formato YYYY-MM-DD
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}
