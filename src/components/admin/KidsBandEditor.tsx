import { useEffect, useState } from 'react';
import { FamilyAdmin, type Band, type KidsDraft } from '../../services/FamilyService';
import { KidsStoryEditor } from './KidsStoryEditor';
import { cleanStory, safeStoryImage, storyToText, validateStory } from '../../utils/kidsStory';
import '../../styles/family.css';

const EMPTY: KidsDraft = { title: '', scriptureFocus: '', whatItSays: '', thinkAbout: '', practice: '', prayer: '', adultGuide: '', story: null, status: 'draft' };
const FIELDS: { key: Exclude<keyof KidsDraft, 'status' | 'story'>; label: string; rows: number }[] = [
  { key: 'title', label: 'Título para esta faixa (até 80 caracteres)', rows: 1 },
  { key: 'scriptureFocus', label: 'Trecho da passagem (opcional)', rows: 2 },
  { key: 'whatItSays', label: 'O que a Bíblia conta', rows: 5 },
  { key: 'thinkAbout', label: 'Para pensar', rows: 4 },
  { key: 'practice', label: 'Para fazer hoje', rows: 3 },
  { key: 'prayer', label: 'Oração', rows: 3 },
  { key: 'adultGuide', label: 'Guia do adulto', rows: 10 },
];

export const bandLabel = (b: Band) => `${b.replace('-', ' a ')} anos`;
const strip = (s?: string | null) => (s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** Versão infantil de uma faixa de idade, em um idioma, com o texto de referência ao lado e a prévia no app. */
/** Como a faixa aparece para a família: título, passagem e os quatro blocos de texto. */
export function KidsBandPreview({ devotional, draft }: { devotional: any; draft: KidsDraft }) {
  return (
    <div className="studio__screen">
      {devotional.scripture_reference && <p className="fam-eyebrow fam-eyebrow--accent">{devotional.scripture_reference}</p>}
      <h4 className="studio__title">{draft.title || devotional.title}</h4>
      {draft.scriptureFocus && <blockquote>{draft.scriptureFocus}</blockquote>}
      <h5>O que a Bíblia conta</h5>
      {draft.story ? <StoryPreview story={draft.story} /> : <p>{draft.whatItSays || '…'}</p>}
      <h5>Para pensar</h5><p>{draft.thinkAbout || '…'}</p>
      <h5>Para fazer hoje</h5><p>{draft.practice || '…'}</p>
      <h5>Oração</h5><p>{draft.prayer || '…'}</p>
    </div>
  );
}

function StoryPreview({ story }: { story: NonNullable<KidsDraft['story']> }) {
  if (story.format === 'panels') {
    return (
      <>
        {story.panels.map((p, i) => (
          <div key={i} className="studio__thumb">
            {safeStoryImage(p.image) && <img src={safeStoryImage(p.image)!} alt="" />}
            <p><strong>{i + 1}.</strong> {p.caption || '…'}{p.speech ? <em> “{p.speech}”</em> : null}</p>
          </div>
        ))}
      </>
    );
  }
  return (
    <>
      {(story.images?.length ? story.images : story.image ? [story.image] : []).map((u, k) => (safeStoryImage(u) ? <img key={k} className="studio__scene" src={safeStoryImage(u)!} alt="" /> : null))}
      <p>{story.setup || '…'}</p>
      <p><strong>{story.question || '…'}</strong></p>
      <ul>{story.options.map((o, i) => <li key={i}>{o || '…'}</li>)}</ul>
      <p>{story.outcome || '…'}</p>
      {story.quote && <blockquote>{story.quote}</blockquote>}
      <p><strong>{story.outcomeQuestion || '…'}</strong></p>
      <p>{story.today || '…'}</p>
      <p><strong>{story.todayQuestion || '…'}</strong></p>
    </>
  );
}

export function KidsBandEditor({ devotional, language, languageName, band, onChanged, onDraft }: {
  devotional: any;
  language: string;
  languageName: string;
  band: Band;
  onChanged: () => void;
  /** Avisa o rascunho atual, para o botão Preview mostrar esta faixa e não o texto adulto. */
  onDraft?: (draft: KidsDraft) => void;
}) {
  const [draft, setDraft] = useState<KidsDraft>(EMPTY);
  const [reference, setReference] = useState<KidsDraft | null>(null);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  // No celular o texto de referência fica recolhido: o que se edita é a faixa escolhida, não o texto adulto.
  const [wide] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(min-width: 960px)').matches);

  useEffect(() => {
    let alive = true;
    setMsg('');
    Promise.all([FamilyAdmin.getKids(devotional.id, language), language === 'pt-BR' ? null : FamilyAdmin.getKids(devotional.id, 'pt-BR')])
      .then(([kids, pt]) => {
        if (!alive) return;
        setDraft(kids[band] ?? { ...EMPTY });
        setReference(pt ? pt[band] : null);
      })
      .catch(() => alive && setMsg('Não foi possível carregar esta faixa.'));
    return () => { alive = false; };
  }, [devotional.id, language, band]);

  useEffect(() => { onDraft?.(draft); }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof KidsDraft, value: string) => setDraft((p) => ({ ...p, [key]: value }) as KidsDraft);

  const save = async (status: 'draft' | 'published') => {
    // Com história, o texto corrido sai dela (é a reserva dos apps antigos e a base de uma tradução).
    const story = draft.story ? cleanStory(draft.story) : null;
    const d = { ...draft, story, whatItSays: story ? storyToText(story) : draft.whatItSays, status };
    const storyError = validateStory(story);
    if (storyError) { setMsg(`Faixa ${bandLabel(band)}: ${storyError}`); return; }
    if (status === 'published' && ![d.whatItSays, d.thinkAbout, d.practice, d.prayer, d.adultGuide].every((x) => x.trim())) {
      setMsg(`Faixa ${bandLabel(band)}: preencha todos os campos, menos o título e o trecho da passagem.`);
      return;
    }
    setSaving(true);
    const ok = await FamilyAdmin.saveKids(devotional.id, band, d, language);
    if (ok) { setDraft(d); onChanged(); }
    setMsg(ok ? `${bandLabel(band)} em ${languageName}: ${status === 'published' ? 'publicada, já aparece no app' : 'salva como rascunho'}.` : 'Não foi possível salvar.');
    setSaving(false);
  };

  const translated = language !== 'pt-BR';
  return (
    <div className="studio__grid">
      <details className="studio__source" open={wide}>
        <summary className="studio__summary">{translated ? `Ver a versão em português desta faixa (${bandLabel(band)})` : 'Ver o texto original do devocional'}</summary>
        <p className="fam-eyebrow">{translated ? `Versão em português desta faixa (${bandLabel(band)}) · traduza com o mesmo sentido` : 'Texto original · a versão infantil mantém esta tese e esta passagem'}</p>
        {!translated || !reference ? (
          <>
            <p><strong>{devotional.scripture_reference}</strong> {devotional.scripture_text}</p>
            {devotional.principle_statement && <p><em>{devotional.principle_statement}</em></p>}
            <p>{strip(devotional.reflection)}</p>
            <p>{strip(devotional.practical_application)}</p>
            <p>{strip(devotional.prayer)}</p>
            {translated && <p className="fam-note">Ainda não há versão em português para esta faixa. Escreva-a primeiro em Português.</p>}
          </>
        ) : (
          FIELDS.filter((f) => reference[f.key]).map((f) => <p key={f.key}><strong>{f.label}</strong><br />{reference[f.key]}</p>)
        )}
      </details>
      <div>
        <div className="fam-form">
          {FIELDS.filter((f) => !(draft.story && f.key === 'whatItSays')).map((f) => (
            <label key={f.key}>{f.label}
              {f.key === 'title'
                ? <input maxLength={80} value={draft.title} placeholder="Ex.: O segredo de Paulo" onChange={(e) => set('title', e.target.value)} />
                : <textarea rows={f.rows} value={draft[f.key]} onChange={(e) => set(f.key, e.target.value)} />}
            </label>
          ))}
        </div>
        <KidsStoryEditor value={draft.story} reference={reference?.story} translated={translated} onChange={(story) => setDraft((p) => ({ ...p, story }))} />
        {msg && <p className="fam-note" role="status">{msg}</p>}
        <div className="studio__actions">
          <button type="button" className="fam-btn fam-btn--secondary" disabled={saving} onClick={() => save('draft')}>Salvar rascunho</button>
          <button type="button" className="fam-btn fam-btn--primary" disabled={saving} onClick={() => save('published')}>Publicar faixa</button>
        </div>
      </div>
      <aside className="studio__phone" aria-label="Prévia">
        <p className="fam-eyebrow">Prévia no app · {bandLabel(band)}</p>
        <KidsBandPreview devotional={devotional} draft={draft} />
      </aside>
    </div>
  );
}

