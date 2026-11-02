import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { FamilyService, activeFamily, type FamilySummary } from '../services/FamilyService';
import '../styles/family.css';

/** Fim da leitura "no seu tempo": marca a leitura para o grupo e, se quiser, deixa uma palavra no mural. */
export function GroupWordCard({ completed, onComplete }: { completed: boolean; onComplete: () => Promise<void> }) {
  const { t } = useTranslation('common');
  const tt = (k: string, d: string) => t(`ritual.${k}`, { defaultValue: d }) as string;
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<FamilySummary[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => { FamilyService.get().then((f) => { if (f) setCurrent(f.id); }).catch(() => {}); FamilyService.list().then((g) => setGroups(g.families)).catch(() => {}); }, []);

  const send = async () => {
    setBusy(true); setError('');
    try {
      if (!completed) await onComplete();
      if (text.trim()) await FamilyService.addPrayer(text.trim());
      window.dispatchEvent(new CustomEvent('family:changed'));
      setSent(true);
    } catch { setError(tt('setupError', 'Não foi possível salvar agora. Tente de novo.')); }
    setBusy(false);
  };

  if (sent) return <section className="group-word"><p className="group-word__title">{tt('wordSent', 'Pronto: o grupo já vê que você leu.')}</p></section>;
  return (
    <section className="group-word">
      <h3 className="group-word__title">{tt('wordTitle', 'Deixe uma palavra para o grupo')}</h3>
      {groups.length > 1 && current && (
        <label className="fam-groupline">{tt('wordTo', 'Para o grupo')}:
          <select value={current} onChange={(e) => { setCurrent(e.target.value); activeFamily.set(e.target.value); }} aria-label={tt('wordTo', 'Para o grupo')}>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </label>
      )}
      <p className="fam-note">{tt('wordHint', 'Opcional. Ao enviar, sua leitura de hoje fica marcada para o grupo.')}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={3} placeholder={tt('wordPlaceholder', 'O que mais tocou você hoje? Ou peça oração por algo.')} aria-label={tt('wordTitle', 'Deixe uma palavra para o grupo')} />
      {error && <p className="fam-error">{error}</p>}
      <button type="button" className="fam-btn fam-btn--primary" disabled={busy} onClick={send}>
        {text.trim() ? tt('wordSend', 'Enviar ao grupo') : tt('wordMark', 'Só marcar que li')}
      </button>
    </section>
  );
}
