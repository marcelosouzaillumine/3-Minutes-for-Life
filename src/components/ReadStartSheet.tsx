import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet } from './Sheet';
import { FamilyService, type Band, type Family } from '../services/FamilyService';
import { openRitual } from '../pages/Family';
import { readerForDay } from '../utils/ritual';
import '../styles/family.css';

const ORDER: Band[] = ['4-6', '7-10', '11-13'];
const bandLabel = (b: Band) => b.replace('-', ' a ');

/** Folha de preparo da leitura: quem está à mesa (e, com crianças, a versão) numa tela só, e a leitura começa já no primeiro passo. */
export function ReadStartSheet({ audience, family, plan, onClose, onChanged }: {
  audience: 'adults' | 'kids';
  family: Family;
  plan: boolean;
  onClose: () => void;
  onChanged?: (f: Family) => void;
}) {
  const { t } = useTranslation('common');
  const tt = (k: string, d: string, o?: Record<string, unknown>) => t(`ritual.${k}`, { defaultValue: d, ...o }) as string;
  const kids = audience === 'kids';
  const [fam, setFam] = useState(family);
  const [adults, setAdults] = useState<Set<number>>(() => new Set(family.members.map((_, i) => i)));
  const [present, setPresent] = useState<Set<string>>(() => new Set(family.children.map((c) => c.id)));
  const [lead, setLead] = useState<Band | null>(null);
  const [nick, setNick] = useState('');
  const [band, setBand] = useState<Band>('7-10');
  const [adding, setAdding] = useState(fam.children.length === 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const bands = useMemo(
    () => [...new Set(fam.children.filter((c) => present.has(c.id)).map((c) => c.band))].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)),
    [fam, present],
  );
  const shared = lead && bands.includes(lead) ? lead : bands[0] ?? null;
  const names = fam.members.filter((_, i) => adults.has(i)).map((m) => m.displayName ?? '').filter(Boolean);
  const reader = readerForDay(names, Math.floor(Date.now() / 86_400_000));
  const toggle = <T,>(set: Set<T>, v: T, put: (s: Set<T>) => void) => { const n = new Set(set); if (n.has(v)) n.delete(v); else n.add(v); put(n); };
  const canStart = kids ? present.size > 0 : adults.size > 0;

  const start = () => {
    onClose();
    if (kids) openRitual('daily', 'kids', { intro: false, kidIds: [...present], band: shared ?? undefined });
    else openRitual(plan ? 'plan' : 'daily', 'adults', { intro: false, adultIdx: [...adults] });
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nick.trim() || busy) return;
    setBusy(true); setError('');
    try {
      const before = new Set(fam.children.map((c) => c.id));
      const f = await FamilyService.addChild(nick.trim(), band);
      setFam(f); onChanged?.(f);
      setPresent((p) => { const n = new Set(p); f.children.filter((c) => !before.has(c.id)).forEach((c) => n.add(c.id)); return n; });
      setNick(''); setAdding(false);
    } catch { setError(tt('setupError', 'Não foi possível salvar agora. Tente de novo.')); }
    setBusy(false);
  };

  return (
    <Sheet title={kids ? tt('kidsSheetTitle', 'Quem lê com você?') : tt('groupSheetTitle', 'Quem está à mesa?')} onClose={onClose}>
      <div className="fam-people">
        {kids
          ? fam.children.map((c) => (
              <button key={c.id} type="button" className="fam-person" aria-pressed={present.has(c.id)} onClick={() => toggle(present, c.id, setPresent)}>
                <span className={`fam-avatar fam-avatar--child${present.has(c.id) ? ' is-read' : ''}`}>{c.nickname.slice(0, 2)}</span>
                <span className="fam-person__label">{c.nickname}<small className="fam-person__sub">{bandLabel(c.band)}</small></span>
              </button>
            ))
          : fam.members.map((m, i) => (
              <button key={i} type="button" className="fam-person" aria-pressed={adults.has(i)} onClick={() => toggle(adults, i, setAdults)}>
                <span className={`fam-avatar${adults.has(i) ? ' is-read' : ''}`}>{(m.displayName ?? '?').trim().slice(0, 2)}</span>
                <span className="fam-person__label">{m.isMe ? tt('you', 'você') : m.displayName ?? tt('someone', 'Alguém')}</span>
              </button>
            ))}
        {kids && !adding && (
          <button type="button" className="fam-person" onClick={() => setAdding(true)}>
            <span className="fam-avatar fam-avatar--add">+</span>
            <span className="fam-person__label">{tt('addChild', 'Adicionar criança')}</span>
          </button>
        )}
      </div>

      {kids && adding && (
        <form className="fam-inline" onSubmit={add}>
          <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder={tt('nickname', 'Apelido')} maxLength={20} aria-label={tt('nickname', 'Apelido')} />
          <select value={band} onChange={(e) => setBand(e.target.value as Band)} aria-label={tt('band', 'Faixa de idade')}>
            {ORDER.map((b) => <option key={b} value={b}>{bandLabel(b)} {tt('years', 'anos')}</option>)}
          </select>
          <button type="submit" className="fam-btn fam-btn--secondary" disabled={busy || !nick.trim()}>{tt('addChild', 'Adicionar criança')}</button>
        </form>
      )}
      {error && <p className="fam-error">{error}</p>}

      {kids && shared && (
        <p className="fam-note">
          {tt('sheetVersion', 'Vamos ler a versão de {{band}} anos, a mais nova na mesa.', { band: bandLabel(shared) })}
          {bands.length > 1 && bands.filter((b) => b !== shared).map((b) => (
            <button key={b} type="button" className="fam-link" onClick={() => setLead(b)}> {tt('sheetSwitch', 'Trocar para {{band}}', { band: bandLabel(b) })}</button>
          ))}
        </p>
      )}
      {reader && <p className="fam-note">{tt('reader', '{{name}} lê em voz alta', { name: reader })}</p>}

      <button type="button" className="fam-btn fam-btn--primary fam-cta" disabled={!canStart} onClick={start}>{tt('sheetStart', 'Começar a leitura')}</button>
    </Sheet>
  );
}
