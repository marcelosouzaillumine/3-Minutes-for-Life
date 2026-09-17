import { useEffect, useState } from 'react';

// Taxa usada só se a API de câmbio falhar — aproximada, não é referência
// financeira. O valor real vem de api.frankfurter.dev em runtime.
export const FALLBACK_BRL_TO_USD_RATE = 0.18;

export async function fetchBrlToUsdRate(): Promise<number> {
  try {
    const res = await fetch('https://api.frankfurter.dev/v1/latest?from=BRL&to=USD');
    if (!res.ok) throw new Error('rate fetch failed');
    const data = await res.json();
    const rate = data?.rates?.USD;
    return typeof rate === 'number' && rate > 0 ? rate : FALLBACK_BRL_TO_USD_RATE;
  } catch {
    return FALLBACK_BRL_TO_USD_RATE;
  }
}

/** Busca a taxa BRL->USD uma vez ao montar. Retorna null enquanto carrega. */
export function useBrlToUsdRate(): number | null {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchBrlToUsdRate().then(r => { if (!cancelled) setRate(r); });
    return () => { cancelled = true; };
  }, []);

  return rate;
}

/** Formata um valor em R$ como string em USD (ex: "$1.92"), ou null se a taxa ainda não carregou. */
export function formatUsdFromBrl(brlAmount: number, rate: number | null): string | null {
  if (rate === null || !Number.isFinite(brlAmount)) return null;
  return `$${(brlAmount * rate).toFixed(2)}`;
}
