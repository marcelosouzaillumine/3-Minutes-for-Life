import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { AdminService, type DashboardMetrics, type DailySeriesPoint } from '../../services/AdminService';

const ACCENT = '#c46d53';
const ACCENT_SOFT = '#e8c3b6';
const GOOD = '#059669';
const BAD = '#dc2626';
const MUTED = '#9ca3af';

const funnelChartData = (metrics: DashboardMetrics) => [
  { label: 'Acessou', value: metrics.funnel.accessed },
  { label: 'Leu', value: metrics.funnel.read },
  { label: 'Compartilhou', value: metrics.funnel.shared },
  { label: 'Testemunhou', value: metrics.funnel.testified },
  { label: 'Respondido', value: metrics.funnel.responded },
  { label: 'Retornou', value: metrics.funnel.returned },
];

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [dailySeries, setDailySeries] = useState<DailySeriesPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [period, setPeriod] = useState('7d'); // 'today', '7d', '30d'

  // BUGFIX (auditoria Intelligence Center): toISOString() sempre converte
  // para UTC, o que pode fazer o filtro "Hoje" incluir/excluir eventos perto
  // da meia-noite de forma diferente do que o admin vê no relógio local
  // (ex: Brasil é UTC-3). Usamos os componentes de data locais em vez disso.
  const toLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchMetrics = async () => {
    setIsLoading(true);
    setHasError(false);

    // Calcula as datas com base no período
    const end = new Date();
    const start = new Date();

    if (period === '7d') {
      start.setDate(end.getDate() - 7);
    } else if (period === '30d') {
      start.setDate(end.getDate() - 30);
    }
    // period === 'today': start = end, já é o valor inicial de `start`.

    const startDateStr = toLocalDateString(start);
    const endDateStr = toLocalDateString(end);

    const [data, series] = await Promise.all([
      AdminService.getDashboardMetrics(startDateStr, endDateStr),
      AdminService.getDashboardDailySeries(startDateStr, endDateStr),
    ]);

    if (data) {
      setMetrics(data);
      setDailySeries(series);
    } else {
      setHasError(true);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  if (isLoading) {
    return (
      <div className="admin-loading-state">
        <div className="admin-spinner"></div>
        <p>Carregando inteligência da comunidade...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="admin-error-state">
        <h3>Oops!</h3>
        <p>Não foi possível atualizar os dados do Dashboard.</p>
        <button
          onClick={fetchMetrics}
          style={{ marginTop: '16px', padding: '8px 16px', background: 'var(--color-accent)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="admin-empty-state">
        Ainda não há dados suficientes para compor este Dashboard.
      </div>
    );
  }

  // Componentes auxiliares de cálculo visual
  const renderTrend = (current: number, previous: number) => {
    if (previous === 0) {
      // Antes: mostrava "—" mesmo quando current > 0, escondendo um
      // crescimento real (0 -> N é o sinal mais interessante que existe).
      if (current > 0) return <span className="admin-trend up">Novo</span>;
      return <span className="admin-trend neutral">—</span>;
    }
    const diff = current - previous;
    const percent = Math.abs((diff / previous) * 100).toFixed(1);

    if (diff > 0) return <span className="admin-trend up">↑ {percent}%</span>;
    if (diff < 0) return <span className="admin-trend down">↓ {percent}%</span>;
    return <span className="admin-trend neutral">0%</span>;
  };

  const calcConversion = (current: number, prevStep: number) => {
    if (prevStep === 0) return "0%";
    return `${((current / prevStep) * 100).toFixed(1)}%`;
  };

  const calcRetentionPct = (retained: number, cohort: number) => {
    if (cohort === 0) return 0;
    return Number(((retained / cohort) * 100).toFixed(1));
  };

  const retentionChartData = [
    { label: 'D1', window: 'dia 1', value: calcRetentionPct(metrics.retention.d1, metrics.retention.cohort_size) },
    { label: 'D3', window: 'dias 2–3', value: calcRetentionPct(metrics.retention.d3, metrics.retention.cohort_size) },
    { label: 'D7', window: 'dias 4–7', value: calcRetentionPct(metrics.retention.d7, metrics.retention.cohort_size) },
    { label: 'D30', window: 'dias 8–30', value: calcRetentionPct(metrics.retention.d30, metrics.retention.cohort_size) },
  ];

  const topContentChartData = metrics.top_content.map(item => ({
    label: item.devotional_title || (item.content_id ? item.content_id.split('-')[0] + '…' : 'Sem título'),
    opens: item.opens,
  }));

  const funnelData = funnelChartData(metrics);

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>Intelligence Center</h1>
          <p>Visão gerencial de alcance, engajamento e relacionamento.</p>
        </div>
        <div className="admin-period-selector">
          <select value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="today">Hoje</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
          </select>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-card">
          <div className="admin-card-title">Usuários Ativos</div>
          <div className="admin-card-value">
            {metrics.intelligence.active_users.current}
            {renderTrend(metrics.intelligence.active_users.current, metrics.intelligence.active_users.previous)}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Leituras</div>
          <div className="admin-card-value">
            {metrics.intelligence.reads.current}
            {renderTrend(metrics.intelligence.reads.current, metrics.intelligence.reads.previous)}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Compartilhamentos</div>
          <div className="admin-card-value">
            {metrics.intelligence.shares.current}
            {renderTrend(metrics.intelligence.shares.current, metrics.intelligence.shares.previous)}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Testemunhos Recebidos</div>
          <div className="admin-card-value">
            {metrics.intelligence.testimonials.current}
            {renderTrend(metrics.intelligence.testimonials.current, metrics.intelligence.testimonials.previous)}
          </div>
        </div>
      </div>

      {/* ---------------- TENDÊNCIA DIÁRIA ---------------- */}
      <div className="admin-section">
        <h3>Tendência do período</h3>
        {dailySeries.length > 1 ? (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <AreaChart data={dailySeries} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="readsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="activeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOOD} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={GOOD} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="day"
                  tickFormatter={(d: string) => d.slice(5).replace('-', '/')}
                  tick={{ fontSize: 11, fill: 'var(--color-text-light)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(d: any) => new Date(`${d}T00:00:00`).toLocaleDateString('pt-BR')}
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                />
                <Area type="monotone" dataKey="reads" name="Leituras" stroke={ACCENT} fill="url(#readsFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="active_users" name="Usuários ativos" stroke={GOOD} fill="url(#activeFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-light)' }}>
            Período curto demais para exibir tendência diária.
          </div>
        )}
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: ACCENT, marginRight: 6 }}></span>Leituras</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: GOOD, marginRight: 6 }}></span>Usuários ativos</span>
        </div>
      </div>

      {/* ---------------- FUNIL ---------------- */}
      <div className="admin-section">
        <h3>Jornada da Comunidade</h3>
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={funnelData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={92}
                tick={{ fontSize: 12, fill: 'var(--color-text)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: any) => [value, 'Usuários']}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={26}>
                {funnelData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? ACCENT : ACCENT_SOFT} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="admin-funnel-container" style={{ marginTop: '4px' }}>
          {funnelData.map((step, i) => {
            const prev = i === 0 ? metrics.funnel.accessed : funnelData[i - 1].value;
            return (
              <div className="admin-funnel-step" key={step.label}>
                <div className="admin-funnel-info">
                  <div className="admin-funnel-label">{step.label}</div>
                  <div className="admin-funnel-value">{step.value}</div>
                </div>
                <div className="admin-funnel-rate">{i === 0 ? '100%' : calcConversion(step.value, prev)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="admin-dashboard-columns">
        <div className="admin-section">
          <h3>Retenção da Coorte</h3>
          <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginBottom: '12px' }}>
            Base de {metrics.retention.cohort_size} usuários novos neste período. Cada barra é uma janela
            própria (ex.: D3 = voltou entre o dia 2 e o dia 3) — não é cumulativo com as anteriores.
          </p>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <BarChart data={retentionChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--color-text)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  formatter={(value: any, _n: any, ctx: any) => [`${value}%`, `Retornou (${ctx?.payload?.window})`]}
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={ACCENT} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-section">
          <h3>Comunidade &amp; Moderação</h3>
          <p style={{ color: 'var(--color-text-light)', fontSize: '0.78rem', marginBottom: '12px' }}>
            Backlog atual — não muda com o período selecionado acima.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', border: '1px solid var(--color-border)', padding: '16px', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Testemunhos Pendentes</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Aguardando leitura</div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: metrics.community.pending_testimonials > 0 ? BAD : GOOD }}>
                {metrics.community.pending_testimonials}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', border: '1px solid var(--color-border)', padding: '16px', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Respostas Atrasadas</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>&gt; 48h sem resposta</div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: metrics.community.delayed_responses > 0 ? BAD : GOOD }}>
                {metrics.community.delayed_responses}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h3>Top Conteúdos (Engajamento)</h3>
        {topContentChartData.length > 0 ? (
          <>
            <div style={{ width: '100%', height: Math.max(140, topContentChartData.length * 42) }}>
              <ResponsiveContainer>
                <BarChart data={topContentChartData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={160}
                    tick={{ fontSize: 11, fill: 'var(--color-text)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: any) => [value, 'Leituras']}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                  />
                  <Bar dataKey="opens" radius={[0, 6, 6, 0]} fill={MUTED} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="admin-table-container" style={{ marginTop: '16px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Devocional</th>
                    <th>Leituras</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.top_content.map((item, index) => (
                    <tr key={index}>
                      <td>
                        {item.devotional_title
                          || (item.content_id ? item.content_id.split('-').slice(0, 3).join('-') + '...' : '—')}
                      </td>
                      <td>{item.opens}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-light)' }}>
            Não houve leitura de devocionais neste período.
          </div>
        )}
      </div>

    </div>
  );
}
