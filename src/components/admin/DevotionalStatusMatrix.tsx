import { buildLangMap } from '../../services/AdminContentService';
import { BANDS, type Band } from '../../services/FamilyService';
import { bandLabel } from './KidsBandEditor';

type Version = 'adult' | Band;
type Tone = 'ok' | 'dr' | 'em' | 'st';
type KidsStates = Record<string, Partial<Record<Band, 'draft' | 'published'>>>;

/**
 * Quadro de estado do devocional: cada idioma é uma linha e cada versão (texto adulto e faixas infantis) uma coluna.
 * Mostra de uma vez o que está no ar, serve de seletor (tocar num quadro abre aquela versão) e concentra
 * publicar e despublicar, por idioma ou em todos.
 */
export function DevotionalStatusMatrix({ devotional, languages, kidsStates, lang, version, busy, missing, onPick, onPublish, onUnpublish, onTranslate }: {
  devotional: any;
  languages: any[];
  kidsStates: KidsStates;
  lang: string;
  version: Version;
  busy: boolean;
  /** Idiomas sem nenhuma tradução (códigos), para o botão de traduzir com IA. */
  missing: string[];
  onPick: (iso: string, v: Version) => void;
  onPublish: (iso?: string) => void;
  onUnpublish: (iso?: string) => void;
  onTranslate: (iso: string[]) => void;
}) {
  const langMap = buildLangMap(devotional);

  const adultCell = (l: any): { tone: Tone; text: string } => {
    if (l.is_source) {
      const s = devotional.status;
      if (s === 'published') return { tone: 'ok', text: 'Publicado' };
      if (s === 'scheduled') return { tone: 'dr', text: 'Agendado' };
      if (s === 'archived') return { tone: 'em', text: 'Arquivado' };
      return { tone: 'dr', text: 'Rascunho' };
    }
    const e = langMap[l.iso_code];
    if (!e) return { tone: 'em', text: 'Vazio' };
    if (e.state === 'draft') return { tone: 'dr', text: 'Rascunho' };
    return e.isStale || e.isPossiblyStale ? { tone: 'st', text: 'Desatualizado' } : { tone: 'ok', text: 'Publicado' };
  };

  const kidsCell = (iso: string, b: Band): { tone: Tone; text: string } => {
    const s = kidsStates[iso]?.[b];
    return s === 'published' ? { tone: 'ok', text: 'Publicado' } : s === 'draft' ? { tone: 'dr', text: 'Rascunho' } : { tone: 'em', text: 'Vazio' };
  };

  const cols: { v: Version; label: string }[] = [{ v: 'adult', label: 'Texto adulto' }, ...BANDS.map((b) => ({ v: b as Version, label: bandLabel(b) }))];

  return (
    <section className="dm" aria-label="Onde cada versão está">
      <h3 className="dm__title">Onde cada versão está</h3>
      <div className="dm__scroll">
        <table className="dm__table">
          <thead>
            <tr>
              <th scope="col"><span className="dm__sr">Idioma</span></th>
              {cols.map((c) => <th key={c.v} scope="col">{c.label}</th>)}
              <th scope="col"><span className="dm__sr">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {languages.map((l) => (
              <tr key={l.iso_code}>
                <th scope="row" className="dm__lang">{l.name}{l.is_source && <span className="dm__tag">original</span>}</th>
                {cols.map((c) => {
                  const cell = c.v === 'adult' ? adultCell(l) : kidsCell(l.iso_code, c.v);
                  const on = l.iso_code === lang && c.v === version;
                  return (
                    <td key={c.v}>
                      <button
                        type="button"
                        className={`dm__pill dm__pill--${cell.tone}${on ? ' is-on' : ''}`}
                        aria-pressed={on}
                        aria-label={`${l.name}, ${c.label}: ${cell.text}`}
                        onClick={() => onPick(l.iso_code, c.v)}
                      >{cell.text}</button>
                    </td>
                  );
                })}
                <td className="dm__row-actions">
                  <button type="button" className="dm__btn dm__btn--sm" disabled={busy} onClick={() => onPublish(l.iso_code)}>Publicar</button>
                  <button type="button" className="dm__btn dm__btn--sm dm__btn--danger" disabled={busy} onClick={() => onUnpublish(l.iso_code)}>Despublicar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="dm__foot">
        <p className="dm__note">Toque em um quadro para editar aquela versão. “Despublicar” volta o idioma para rascunho; o texto adulto em português não muda (ele segue o Status do devocional).</p>
        <div className="dm__foot-actions">
          {missing.length > 0 && <button type="button" className="dm__btn" disabled={busy} onClick={() => onTranslate(missing)}>Traduzir com IA ({missing.map((m) => m.toUpperCase()).join(', ')})</button>}
          <button type="button" className="dm__btn dm__btn--danger" disabled={busy} onClick={() => onUnpublish()}>Despublicar em todos os idiomas</button>
          <button type="button" className="dm__btn dm__btn--primary" disabled={busy} onClick={() => onPublish()}>Publicar em todos os idiomas</button>
        </div>
      </div>
    </section>
  );
}
