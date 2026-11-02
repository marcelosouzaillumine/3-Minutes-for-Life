import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet } from './Sheet';
import { DevotionalService } from '../services/DevotionalService';
import { getTodayInSaoPaulo } from '../utils/date';
import { BandPicker } from './BandPicker';
import { FamilyService, activeFamily, type Band, type Family, type FamilySummary } from '../services/FamilyService';
import { openRitual } from '../pages/Family';
import { readerForDay } from '../utils/ritual';
import '../styles/family.css';

const ORDER: Band[] = ['0-3', '4-6', '7-10', '11-13'];
const bandLabel = (b: Band) => b.replace('-', ' a ');

/** Folha de preparo da leitura: quem está à mesa (e, com crianças, a versão) numa tela só, e a leitura começa já no primeiro passo. */
export function ReadStartSheet({ audience, family, plan, devotionalId, inline = false, onClose, onChanged }: {
  audience: 'adults' | 'kids';
  family: Family;
  plan: boolean;
  /** Devocional escolhido fora do Hoje (Explorar, planos); sem isso vale o do dia. */
  devotionalId?: string;
  /** Dentro da página (aba Crianças), sem a folha por cima: a escolha e o começo ficam numa tela só. */
  inline?: boolean;
  onClose: () => void;
  onChanged?: (f: Family) => void;
}) {
  const { t, i18n } = useTranslation('common');
  const tt = (k: string, d: string, o?: Record<string, unknown>) => t(`ritual.${k}`, { defaultValue: d, ...o }) as string;
  const kids = audience === 'kids';
  // Grupo à distância: cada um lê a rolagem de hoje no seu tempo. A escolha fica lembrada.
  const [mode, setMode] = useState<'together' | 'alone'>(() => {
    try { return localStorage.getItem('ritual.groupMode') === 'alone' ? 'alone' : 'together'; } catch { return 'together'; }
  });
  const pick = (m: 'together' | 'alone') => { setMode(m); try { localStorage.setItem('ritual.groupMode', m); } catch { /* sem armazenamento */ } };
  const alone = !kids && !devotionalId && mode === 'alone';
  const [fam, setFam] = useState(family);
  const [adults, setAdults] = useState<Set<number>>(() => new Set(family.members.map((_, i) => i)));
  const [present, setPresent] = useState<Set<string>>(() => new Set(family.children.map((c) => c.id)));
  const [lead, setLead] = useState<Band | null>(null);
  const [nick, setNick] = useState('');
  const [band, setBand] = useState<Band>('7-10');
  const [adding, setAdding] = useState(fam.children.length === 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Quem está em mais de um grupo (família, célula…) escolhe aqui para qual deles lê.
  const [groups, setGroups] = useState<FamilySummary[]>([]);
  useEffect(() => { FamilyService.list().then((g) => setGroups(g.families)).catch(() => {}); }, []);
  const switchGroup = async (id: string) => {
    activeFamily.set(id);
    const f = await FamilyService.get();
    if (!f) return;
    setFam(f); onChanged?.(f);
    setAdults(new Set(f.members.map((_, i) => i)));
    setPresent(new Set(f.children.map((c) => c.id)));
    setLead(null);
  };

  // Faixas com versão aprovada neste devocional e idioma. Sem isso a folha prometeria uma idade que a leitura não tem.
  const [avail, setAvail] = useState<Set<Band> | null>(null);
  useEffect(() => {
    if (!kids) return;
    let alive = true;
    (async () => {
      const id = devotionalId ?? (await DevotionalService.getDailyDevotional(getTodayInSaoPaulo(), i18n.language)).id;
      const v = await FamilyService.getKids(id, i18n.language);
      if (alive) setAvail(new Set(v.map((x) => x.band)));
    })().catch(() => { if (alive) setAvail(null); });
    return () => { alive = false; };
  }, [kids, devotionalId, i18n.language]);

  const presentBands = useMemo(
    () => [...new Set(fam.children.filter((c) => present.has(c.id)).map((c) => c.band))].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)),
    [fam, present],
  );
  const bands = avail ? presentBands.filter((b) => avail.has(b)) : presentBands;
  const missing = avail ? presentBands.filter((b) => !avail.has(b)) : [];
  // A escolha mostra todas as versões que existem neste devocional (inclusive de uma idade que ninguém na mesa tem); começa na mais nova de quem está à mesa.
  const options = avail ? ORDER.filter((b) => avail.has(b)) : presentBands;
  const shared = lead && options.includes(lead) ? lead : bands[0] ?? options[0] ?? null;
  const names = fam.members.filter((_, i) => adults.has(i)).map((m) => m.displayName ?? '').filter(Boolean);
  const reader = readerForDay(names, Math.floor(Date.now() / 86_400_000));
  const toggle = <T,>(set: Set<T>, v: T, put: (s: Set<T>) => void) => { const n = new Set(set); if (n.has(v)) n.delete(v); else n.add(v); put(n); };
  const canStart = kids ? present.size > 0 && (!avail || options.length > 0) : alone || adults.size > 0;

  const start = () => {
    onClose();
    if (alone) {
      try { sessionStorage.setItem('hoje.read', 'group'); } catch { /* sem armazenamento */ }
      window.dispatchEvent(new CustomEvent('app:tab', { detail: 'home' }));
      window.dispatchEvent(new Event('hoje:read'));
      return;
    }
    if (kids) openRitual('daily', 'kids', { intro: false, kidIds: [...present], band: shared ?? undefined, devotionalId });
    else openRitual(plan ? 'plan' : 'daily', 'adults', { intro: false, adultIdx: [...adults], devotionalId });
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

  const body = (
    <>
      {groups.length > 1 && (
        <label className="fam-groupline">{tt('groupLine', 'Grupo')}:
          <select value={fam.id} onChange={(e) => { switchGroup(e.target.value).catch(() => {}); }} aria-label={tt('groupLine', 'Grupo')}>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </label>
      )}
      {!kids && !devotionalId && (
        <div className="fam-people" role="tablist" aria-label={tt('groupHowTitle', 'Como o grupo vai ler?')}>
          <button type="button" className={`fam-chip${!alone ? ' is-on' : ''}`} aria-pressed={!alone} onClick={() => pick('together')}>{tt('modeTogether', 'Estamos juntos agora')}</button>
          <button type="button" className={`fam-chip${alone ? ' is-on' : ''}`} aria-pressed={alone} onClick={() => pick('alone')}>{tt('modeAlone', 'Cada um no seu tempo')}</button>
        </div>
      )}
      {alone && <p className="fam-note">{tt('aloneHint', 'Você lê agora, no seu ritmo. Ao terminar, o grupo vê que você leu.')}</p>}

      {!alone && <div className="fam-people">
        {kids
          ? fam.children.map((c) => (
              <button key={c.id} type="button" className="fam-person" aria-pressed={present.has(c.id)} onClick={() => toggle(present, c.id, setPresent)}>
                <span className={`fam-avatar fam-avatar--child${present.has(c.id) ? ' is-read' : ''}`}>{c.nickname.slice(0, 2)}</span>
                <span className="fam-person__label">{c.nickname}<small className="fam-person__sub">{[bandLabel(c.band), c.readToday ? tt('readTodayShort', 'leu hoje ✓') : null].filter(Boolean).join(' · ')}</small></span>
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
            <span className="fam-person__label">{tt('addShort', 'Adicionar')}</span>
          </button>
        )}
      </div>}

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

      {kids && shared && (options.length > 1 ? (
        <>
          <p className="fam-note">{tt('sharedVersion', 'Todos ouvem a mesma leitura. Qual versão?')}</p>
          <BandPicker
            bands={options}
            value={shared}
            names={Object.fromEntries(options.map((b) => [b, fam.children.filter((c) => present.has(c.id) && c.band === b).map((c) => c.nickname)]))}
            years={tt('years', 'anos')}
            ariaLabel={tt('sharedVersion', 'Todos ouvem a mesma leitura. Qual versão?')}
            onPick={setLead}
          />
        </>
      ) : (
        <p className="fam-note">{tt('sheetVersionOne', 'Vamos ler a versão de {{band}} anos.', { band: bandLabel(shared) })}</p>
      ))}
      {kids && missing.length > 0 && (
        <p className="fam-note">
          {options.length > 0
            ? tt('sheetMissing', 'Ainda não há versão de {{band}} anos para este devocional.', { band: missing.map(bandLabel).join(' e ') })
            : tt('sheetNone', 'Este devocional ainda não tem versão para a idade de quem está na mesa ({{band}} anos).', { band: missing.map(bandLabel).join(' e ') })}
        </p>
      )}
      {reader && !alone && <p className="fam-note">{tt('reader', '{{name}} lê em voz alta', { name: reader })}</p>}

      <button type="button" className="fam-btn fam-btn--primary fam-cta" disabled={!canStart} onClick={start}>{alone ? tt('aloneStart', 'Ler agora') : tt('sheetStart', 'Começar a leitura')}</button>
    </>
  );
  return inline ? <div className="fam-startinline">{body}</div> : (
    <Sheet title={kids ? tt('kidsSheetTitle', 'Quem lê com você?') : alone ? tt('groupHowTitle', 'Como o grupo vai ler?') : tt('groupSheetTitle', 'Quem está à mesa?')} onClose={onClose}>
      {body}
    </Sheet>
  );
}
