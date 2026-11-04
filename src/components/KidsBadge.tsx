import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { illumineAuth } from '../lib/illumine';
import { FamilyService } from '../services/FamilyService';

// Uma consulta por idioma; as listas só leem o resultado.
const cache = new Map<string, Promise<Record<string, string[]>>>();
export const loadKidsAvailability = (language: string) => {
  let p = cache.get(language);
  if (!p) {
    p = FamilyService.kidsAvailable(language).catch(() => { cache.delete(language); return {}; });
    cache.set(language, p);
  }
  return p;
};

/** Selo da versão para crianças nas listas (categorias, busca e dias dos planos): disponível ou indisponível. */
export function KidsBadge({ devotionalId }: { devotionalId: string }) {
  const { t, i18n } = useTranslation('common');
  const [bands, setBands] = useState<string[] | null | undefined>(undefined);

  useEffect(() => {
    if (!illumineAuth.isAuthenticated()) return;
    let alive = true;
    loadKidsAvailability(i18n.language).then((m) => { if (alive) setBands(m[devotionalId] ?? null); });
    return () => { alive = false; };
  }, [devotionalId, i18n.language]);

  if (bands === undefined) return null;
  return bands
    ? <span className="kids-badge kids-badge--on" title={bands.map((b) => b.replace('-', ' a ')).join(' · ')}>{t('kidsBadge.on', 'Versão para crianças')}</span>
    : <span className="kids-badge kids-badge--off">{t('kidsBadge.off', 'Crianças: indisponível')}</span>;
}
