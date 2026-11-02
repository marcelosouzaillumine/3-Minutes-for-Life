// Só para desenvolvimento: abre o "Ler juntos" de verdade com dados de exemplo, sem rede nem login.
// Uso: npm run dev e abra /dev/demo-historia.html?band=4-6 (ou 7-10, 11-13); &lang=en para outro idioma.
// Todo fetch é interceptado aqui: nada chega à API de produção.
import { createRoot } from 'react-dom/client';
import '../src/i18n/config';
import i18n from '../src/i18n/config';
import { FamilyRitual } from '../src/components/FamilyRitual';
import stories from './demo-historia.json';

const q = new URLSearchParams(location.search);
const band = (['4-6', '7-10', '11-13'].includes(q.get('band') ?? '') ? q.get('band') : '7-10') as '4-6' | '7-10' | '11-13';
const noStory = q.get('story') === 'off';
if (q.get('lang')) i18n.changeLanguage(q.get('lang')!);
try { localStorage.setItem('ritual.audience', 'kids'); } catch { /* sem armazenamento */ }

const guide = 'Leiam um quadro por vez e deixe a criança dizer o que vê.\n\nPara conversar à mesa:\n- Que presente você já ganhou sem merecer?\n- Por que o Lutero escreveu as 95 ideias?\n\nAtividade em família:\nEmbrulhem um papel com a palavra “graça” e abram juntos.\n\nOração em família:\nPai, obrigado pelo teu presente. Amém.';
const family = {
  id: 'f1', name: 'Família Souza', meetingTime: '19h30', role: 'owner', inviteCode: 'DEMO-0000',
  members: [{ displayName: 'Marcelo', role: 'owner', isMe: true, readToday: false }],
  children: [{ id: 'c1', nickname: 'Davi', band }], week: { days: [], streak: 2 }, plan: null,
};
const devotional = {
  id: 'demo-reforma', publicationDate: new Date().toISOString(), title: 'A Reforma Protestante', status: 'published',
  scriptureReference: 'Romanos 1.17', scriptureText: '[texto da passagem na tradução do app]',
  reflection: '<p>Texto do adulto.</p>', principleStatement: 'A Palavra de Deus é para todos.', translations: [], shareAssets: [],
};
const kids = [{
  band, title: { '4-6': 'A Bíblia é para todos', '7-10': 'O presente que não se compra', '11-13': 'Quem decide o que é verdade?' }[band],
  scriptureFocus: null, whatItSays: 'Texto de reserva da faixa.', thinkAbout: 'Pensar?', practice: 'Fazer.', prayer: 'Orar.', adultGuide: guide,
  story: noStory ? null : (stories as Record<string, unknown>)[band], status: 'published',
}];
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } });
window.fetch = (async (input: RequestInfo | URL) => {
  const u = String(input);
  if (u.includes('/families/me') && !u.includes('/prayers')) return json({ family });
  if (u.includes('/devotionals/date/') || /\/devotionals\/[^/]+\?/.test(u)) return json(devotional);
  if (/\/devotionals\/[^/]+\/kids/.test(u)) return json({ versions: kids });
  return json({}, 404);
}) as typeof fetch;

createRoot(document.getElementById('root')!).render(<FamilyRitual source="daily" onClose={() => { location.href = location.pathname + location.search; }} />);
