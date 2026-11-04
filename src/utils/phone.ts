/** Telefone em E.164 (+5541999999999). Sem "+", assume Brasil. Devolve null se não parecer um número válido. */
export function toE164(input: string): string | null {
  const raw = input.trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const full = raw.startsWith('+') ? digits : digits.startsWith('55') && digits.length >= 12 ? digits : `55${digits}`;
  if (!/^[1-9]\d{9,14}$/.test(full)) return null;
  if (full.startsWith('55') && full.length !== 12 && full.length !== 13) return null;
  return `+${full}`;
}

/** Mostra +5541999999999 como +55 (41) 99999-9999; outros países ficam como vieram. */
export function formatPhone(e164: string): string {
  const m = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(e164);
  return m ? `+55 (${m[1]}) ${m[2]}-${m[3]}` : e164;
}
