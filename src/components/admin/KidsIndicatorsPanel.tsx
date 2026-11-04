import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { KidsIndicators } from '../../services/AdminService';

const bandLabel = (band: string) => `${band.replace('-', ' a ')} anos`;
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : '—');

/** Painel só das crianças: cadastro, uso e cobertura de conteúdo por faixa de idade. */
export function KidsIndicatorsPanel({ data }: { data: KidsIndicators | null }) {
  if (!data) return <p className="dash-hint">Não foi possível carregar os indicadores de crianças agora.</p>;
  const { totals, bands } = data;
  if (totals.registeredChildren === 0 && totals.reads === 0) {
    return <p className="dash-hint">Ainda não há crianças cadastradas nem leituras com crianças.</p>;
  }
  const chart = bands.map((b) => ({ label: bandLabel(b.band), Leituras: b.reads, Ativas: b.activeChildren }));

  return (
    <>
      <div className="admin-grid dash-stats">
        <div className="admin-card"><div className="admin-card-title">Crianças cadastradas</div><div className="admin-card-value">{totals.registeredChildren}</div></div>
        <div className="admin-card"><div className="admin-card-title">Crianças que leram</div><div className="admin-card-value">{totals.activeChildren}</div></div>
        <div className="admin-card"><div className="admin-card-title">Leituras com crianças</div><div className="admin-card-value">{totals.reads}</div></div>
        <div className="admin-card"><div className="admin-card-title">Participação</div><div className="admin-card-value">{pct(totals.activeChildren, totals.registeredChildren)}</div></div>
      </div>

      <div style={{ width: '100%', height: 200, margin: '12px 0' }}>
        <ResponsiveContainer>
          <BarChart data={chart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--color-text)' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.85rem' }} />
            <Bar dataKey="Leituras" radius={[6, 6, 0, 0]} fill="var(--color-accent, #c46d53)" maxBarSize={44} />
            <Bar dataKey="Ativas" radius={[6, 6, 0, 0]} fill="#e8c3b6" maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="admin-table-container admin-table-responsive">
        <table className="admin-table">
          <thead>
            <tr><th>Faixa</th><th>Cadastradas</th><th>Ativas</th><th>Leituras</th><th>Voltaram (2+ dias)</th><th>Leituras por criança</th><th>Versões publicadas</th><th>Mais lidos</th></tr>
          </thead>
          <tbody>
            {bands.map((b) => (
              <tr key={b.band}>
                <td data-label="Faixa">{bandLabel(b.band)}</td>
                <td data-label="Cadastradas">{b.registeredChildren}</td>
                <td data-label="Ativas">{b.activeChildren} <small>({pct(b.activeChildren, b.registeredChildren)})</small></td>
                <td data-label="Leituras">{b.reads}</td>
                <td data-label="Voltaram (2+ dias)">{b.returningChildren} <small>({pct(b.returningChildren, b.activeChildren)})</small></td>
                <td data-label="Leituras por criança">{b.avgReadsPerActiveChild.toLocaleString('pt-BR')}</td>
                <td data-label="Versões publicadas">{b.publishedVersions} de {totals.publishedDevotionals} <small>({b.coverage.toLocaleString('pt-BR')}%)</small></td>
                <td data-label="Mais lidos">{b.topDevotionals.length ? b.topDevotionals.map((t) => `${t.title} (${t.reads})`).join(', ') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
