import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FamilyService, type Family } from '../services/FamilyService';
import type { JourneySummary } from '../utils/journey';
import '../styles/family.css';

/** Arquivo de calendário com um evento diário, às 7h a partir de amanhã: funciona sem notificação no aparelho. */
function reminderIcs(title: string, description: string, url: string) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//3 Minutes for Life//PT', 'BEGIN:VEVENT',
    `UID:${day}-3minutes@3minutesforlife.com`, `DTSTAMP:${stamp}`, `DTSTART:${day}T070000`, `DTEND:${day}T071500`,
    'RRULE:FREQ=DAILY', `SUMMARY:${title}`, `DESCRIPTION:${description}`, `URL:${url}`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

/** Fecha a leitura: o registro, a sequência, como está o grupo e um convite para voltar amanhã. */
export function ReadingClosing({ summary }: { summary: JourneySummary | null }) {
  const { t } = useTranslation('common');
  const tt = (k: string, d: string, o?: Record<string, unknown>) => t(`closing.${k}`, { defaultValue: d, ...o }) as string;
  const [family, setFamily] = useState<Family | null>(null);
  useEffect(() => { FamilyService.get().then(setFamily).catch(() => {}); }, []);
  const readers = family ? family.members.filter((m) => m.readToday).length + family.children.filter((c) => c.readToday).length : 0;
  const totalPeople = family ? family.members.length + family.children.length : 0;

  const remind = () => {
    const ics = reminderIcs(tt('eventTitle', 'Ler o devocional de hoje'), tt('eventText', 'Três minutos para parar, refletir e viver melhor.'), window.location.origin);
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = '3-minutes-for-life.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="reading-closing" aria-live="polite">
      <span className="reading-closing__seal" aria-hidden="true">✓</span>
      <h3 className="reading-closing__title">{tt('title', 'Leitura registrada')}</h3>
      {summary && summary.currentStreak >= 2 && <p className="reading-closing__line">{t('journey.streak', { count: summary.currentStreak })}</p>}
      {family && totalPeople > 1 && (
        <p className="reading-closing__line">{tt('group', '{{name}}: {{count}} de {{total}} já leram hoje', { name: family.name, count: readers, total: totalPeople })}</p>
      )}
      <div className="reading-closing__tomorrow">
        <p className="fam-eyebrow">{tt('tomorrow', 'Amanhã')}</p>
        <p>{tt('tomorrowText', 'Um novo devocional chega às 6h.')}</p>
        <button type="button" className="fam-btn fam-btn--secondary" onClick={remind}>{tt('remind', 'Lembrar de ler às 7h')}</button>
      </div>
    </section>
  );
}
