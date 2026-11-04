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
} from 'recharts';
import { queueStatus, QUEUE_TARGET_DAYS, type QueueStatus } from '../../utils/contentQueue';
import { getTodayInSaoPaulo } from '../../utils/date';
import '../../styles/admin-dashboard.css';
import { KidsIndicatorsPanel } from '../../components/admin/KidsIndicatorsPanel';
import { AdminService, periodDays, periodRanges, type PeriodId, type DashboardMetrics, type DailySeriesPoint, type KidsIndicators, type ReadingModes, type ReadingTrends, type SearchTerms } from '../../services/AdminService';

const ACCENT = 'var(--color-accent, #c46d53)';
const GOOD = '#059669';
const BAD = '#dc2626';
const MUTED = '#9ca3af';

const TOPIC_LABELS: Record<string, string> = {
  cansaco: 'Cansaço e falta de forças', ansiedade: 'Ansiedade e medo', tristeza: 'Tristeza e luto',
  gratidao: 'Gratidão e alegria', decisao: 'Decisão e direção', perdao: 'Perdão e culpa',
  esperanca: 'Esperança e fé', recomeco: 'Recomeço e mudança', solidao: 'Solidão e rejeição',
  familia: 'Família e relacionamentos', trabalho: 'Trabalho e propósito', paciencia: 'Paciência e espera',
  oracao: 'Oração', saude: 'Saúde e doença', fracasso: 'Fracasso e vergonha',
};

const MODE_LABELS: Record<string, string> = { individual: 'Individual', grupo: 'Em grupo', criancas: 'Com crianças' };
const MODE_ICONS: Record<string, string> = { individual: '🙏', grupo: '👥', criancas: '🧒' };
const PERIODS: { id: PeriodId; label: string; phrase: string }[] = [
  { id: 'today', label: 'Hoje', phrase: 'de hoje' },
  { id: '7d', label: '7 dias', phrase: 'dos últimos 7 dias' },
  { id: '30d', label: '30 dias', phrase: 'dos últimos 30 dias' },
];
const bandLabel = (band: string) => `${band.replace('-', ' a ')} anos`;

// Só as etapas que o gateway mede. Testemunhou / Respondido / Retornou não têm fonte de dados
// (apareciam sempre como 0) e voltam quando houver.
const funnelChartData = (metrics: DashboardMetrics) => [
  { label: 'Acessou', value: metrics.funnel.accessed },
  { label: 'Compartilhou', value: metrics.funnel.shared },
];

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [dailySeries, setDailySeries] = useState<DailySeriesPoint[]>([]);
  const [readingTrends, setReadingTrends] = useState<ReadingTrends | null>(null);
  const [queue, setQueue] = useState<QueueStatus | null>(null);
  const [searchTerms, setSearchTerms] = useState<SearchTerms | null>(null);
  const [readingModes, setReadingModes] = useState<ReadingModes | null>(null);
  const [kidsIndicators, setKidsIndicators] = useState<KidsIndicators | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [period, setPeriod] = useState<PeriodId>('7d');

  const fetchMetrics = async () => {
    setIsLoading(true);
    setHasError(false);

    // Período atual e o anterior de mesmo tamanho (para as setas de tendência).
    const { start, end, prevStart, prevEnd } = periodRanges(period);

    const [data, series] = await Promise.all([
      AdminService.getDashboardMetrics(start, end, { startDate: prevStart, endDate: prevEnd }),
      AdminService.getDashboardDailySeries(start, end),
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

  // O que as pessoas procuram: acompanha o seletor de período.
  useEffect(() => {
    AdminService.getSearchTerms(periodDays(period)).then(setSearchTerms);
  }, [period]);

  // Modos de leitura (individual, grupo, crianças): acompanha o seletor de período.
  useEffect(() => {
    const { start, end } = periodRanges(period);
    AdminService.getReadingModes(start, end).then(setReadingModes);
    AdminService.getKidsIndicators(start, end).then(setKidsIndicators);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  // Fila de conteúdo: dias à frente com devocional publicado.
  useEffect(() => {
    AdminService.getPublishedDates().then((dates) => setQueue(dates ? queueStatus(dates, getTodayInSaoPaulo()) : null));
  }, []);

  // Histórico global de leituras — dado vitalício, não muda com o seletor de período.
  useEffect(() => {
    AdminService.getReadingTrends().then(setReadingTrends);
  }, []);

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

  // O gateway já devolve a taxa em % por dia N (1, 7, 14, 30), de todo o histórico.
  const retentionChartData = metrics.retention.map(r => ({
    label: `D${r.day}`,
    window: r.day === 1 ? 'no dia seguinte à primeira leitura' : `no dia ${r.day} após a primeira leitura`,
    value: r.rate,
    users: r.users,
  }));
  const day1 = metrics.retention.find(r => r.day === 1);

  // O gateway devolve '—' quando não acha o título do devocional; trata como ausente.
  const topContentTitle = (item: { devotional_title?: string | null; content_id?: string }) => {
    const title = item.devotional_title?.trim();
    return title && title !== '—' ? title : 'Devocional não identificado';
  };
  const truncateLabel = (text: string, max = 26) => (text.length > max ? text.slice(0, max - 1) + '…' : text);
  const topContentChartData = metrics.top_content.map(item => ({
    label: truncateLabel(topContentTitle(item)),
    full: topContentTitle(item),
    opens: item.opens,
  }));

  const funnelData = funnelChartData(metrics);

  // Resumo em frase (Modelo C): tudo calculado dos dados já carregados.
  const periodPhrase = PERIODS.find(p => p.id === period)?.phrase ?? '';
  const fmt = (n: number) => n.toLocaleString('pt-BR');
  const plural = (n: number, one: string, many: string) => `${fmt(n)} ${n === 1 ? one : many}`;
  const { current: readsNow, previous: readsBefore } = metrics.intelligence.reads;
  const readsChange = readsBefore > 0 ? Math.round(((readsNow - readsBefore) / readsBefore) * 100) : null;
  const sharedModes = readingModes && readingModes.total > 0
    ? readingModes.modes.filter(m => m.mode !== 'individual').reduce((sum, m) => sum + m.reads, 0)
    : null;
  const sharedPct = sharedModes !== null && readingModes ? Math.round((sharedModes / readingModes.total) * 100) : null;
  const bestDay = dailySeries.length > 1
    ? dailySeries.reduce((best, d) => (d.reads > best.reads ? d : best), dailySeries[0])
    : null;
  const halfIdx = Math.floor(dailySeries.length / 2);
  const firstHalf = dailySeries.slice(0, halfIdx).reduce((sum, d) => sum + d.reads, 0);
  const secondHalf = dailySeries.slice(halfIdx).reduce((sum, d) => sum + d.reads, 0);
  const halfChange = dailySeries.length >= 4 && firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : null;
  const returnNextDay = day1 && day1.users > 0 ? Math.round(day1.rate) : null;

  return (
    <div className="dash">
      <div className="admin-header">
        <div>
          <h1>Intelligence Center</h1>
          <p>Visão gerencial de alcance, engajamento e relacionamento.</p>
        </div>
        <div className="dash-seg" role="group" aria-label="Período">
          {PERIODS.map(p => (
            <button
              key={p.id}
              type="button"
              className={period === p.id ? 'is-on' : ''}
              aria-pressed={period === p.id}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <section className="dash-story" aria-label={`Resumo ${periodPhrase}`}>
        <div className="dash-story__eyebrow">O resumo {periodPhrase}</div>
        <p className="dash-story__text">
          {readsNow > 0 ? (
            <>
              <em>{plural(readsNow, 'leitura', 'leituras')}</em>
              {readsChange !== null && <>, {Math.abs(readsChange)}% {readsChange >= 0 ? 'a mais' : 'a menos'} que no período anterior</>}
              .
              {sharedPct !== null && sharedPct > 0 && <> <em>{sharedPct}%</em> foram feitas em grupo ou com crianças.</>}
            </>
          ) : (
            <>Ainda não houve leituras {periodPhrase}.</>
          )}
        </p>
        <div className="dash-story__chips">
          {bestDay && bestDay.reads > 0 && (
            <span className="dash-chip">
              🔥 Melhor dia:{' '}
              <b>{new Date(`${bestDay.day}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}, {plural(bestDay.reads, 'leitura', 'leituras')}</b>
            </span>
          )}
          {returnNextDay !== null && (
            <span className="dash-chip">🔁 <b>{returnNextDay}%</b> voltam no dia seguinte</span>
          )}
          {queue && queue.missing.length > 0 && (
            <span className="dash-chip dash-chip--warn">⚠️ <b>{plural(queue.missing.length, 'dia', 'dias')}</b> sem devocional na fila</span>
          )}
        </div>
      </section>

      <div className="admin-grid dash-stats">
        <div className="admin-card">
          <div className="admin-card-title">Usuários Cadastrados</div>
          <div className="admin-card-value">{fmt(metrics.total_users)}</div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Usuários Ativos</div>
          <div className="admin-card-value">
            {fmt(metrics.intelligence.active_users.current)}
            {renderTrend(metrics.intelligence.active_users.current, metrics.intelligence.active_users.previous)}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Leituras</div>
          <div className="admin-card-value">
            {fmt(metrics.intelligence.reads.current)}
            {renderTrend(metrics.intelligence.reads.current, metrics.intelligence.reads.previous)}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Compartilhamentos</div>
          <div className="admin-card-value">
            {fmt(metrics.intelligence.shares.current)}
            {renderTrend(metrics.intelligence.shares.current, metrics.intelligence.shares.previous)}
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
        {halfChange !== null && (
          <div className="dash-insight">
            <b>Em resumo:</b> na segunda metade do período houve {Math.abs(halfChange)}% {halfChange >= 0 ? 'mais' : 'menos'} leituras que na primeira.
          </div>
        )}
      </div>

      {/* ---------------- FUNIL ---------------- */}
      <div className="admin-section">
        <h3>Jornada da Comunidade</h3>
        <p className="dash-hint">Da primeira visita até o retorno</p>
        <ol className="dash-steps">
          {funnelData.map((step, i) => {
            return (
              <li className="dash-step" key={step.label}>
                <span className="dash-step__dot">{i + 1}</span>
                <span className="dash-step__text">
                  {step.label}
                  <small>{i === 0 ? '100%' : `${calcConversion(step.value, metrics.funnel.accessed)} de quem acessou`}</small>
                </span>
                <b>{fmt(step.value)}</b>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="admin-dashboard-columns">
        <div className="admin-section">
          <h3>Retenção</h3>
          <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginBottom: '12px' }}>
            De todos que leram pela primeira vez há pelo menos N dias, quantos % voltaram a ler exatamente
            no dia N. Cada barra é independente das outras e considera todo o histórico — não muda com o período.
          </p>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <BarChart data={retentionChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--color-text)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  formatter={(value: any, _n: any, ctx: any) => [`${value}% de ${ctx?.payload?.users} pessoas`, `Voltou ${ctx?.payload?.window}`]}
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
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: metrics.community.pending_testimonials === null ? MUTED : metrics.community.pending_testimonials > 0 ? BAD : GOOD }}>
                {metrics.community.pending_testimonials ?? '—'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', border: '1px solid var(--color-border)', padding: '16px', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Pedidos de Oração Pendentes</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Aguardando oração</div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: metrics.community.pending_prayers === null ? MUTED : metrics.community.pending_prayers > 0 ? BAD : GOOD }}>
                {metrics.community.pending_prayers ?? '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- HISTÓRICO GLOBAL DE LEITURAS ---------------- */}
      {readingTrends && (
        <div className="admin-section">
          <h3>Histórico Global de Leituras</h3>
          <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginBottom: '12px' }}>
            Total acumulado desde o início — não muda com o seletor de período acima.
            "Leituras Únicas" conta 1 vez por usuário+devocional; "Aberturas" conta toda vez que a tela foi aberta (inclui reaberturas e o histórico importado de antes da migração).
          </p>

          <div className="admin-grid" style={{ marginBottom: '20px' }}>
            <div className="admin-card">
              <div className="admin-card-title">Total de Leituras Únicas (vitalício)</div>
              <div className="admin-card-value">{readingTrends.global_total_reads}</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-title">Total de Aberturas (vitalício)</div>
              <div className="admin-card-value">{readingTrends.global_total_opens}</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-title">Média Diária de Aberturas</div>
              <div className="admin-card-value">{readingTrends.avg_opens_per_day}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', marginTop: '2px' }}>
                {readingTrends.global_total_opens} aberturas ÷ {readingTrends.days_since_first_open} dias
              </div>
            </div>
            <div className="admin-card">
              <div className="admin-card-title">Média de Leituras por Devocional</div>
              <div className="admin-card-value">{readingTrends.avg_reads_per_devotional}</div>
            </div>
          </div>

          <h4 style={{ fontSize: '0.9rem', margin: '0 0 8px 0' }}>Últimos 12 meses</h4>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={readingTrends.monthly} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(m: string) => m.slice(5)}
                  tick={{ fontSize: 11, fill: 'var(--color-text-light)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(value: any) => [value, 'Leituras']}
                  labelFormatter={(m: any) => new Date(`${m}-01T00:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                />
                <Bar dataKey="reads" name="Leituras" radius={[6, 6, 0, 0]} fill={ACCENT} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {readingTrends.yearly.length > 0 && (
            <>
              <h4 style={{ fontSize: '0.9rem', margin: '20px 0 8px 0' }}>Por Ano — Taxa de Crescimento</h4>
              <div className="admin-table-container admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ano</th>
                      <th>Leituras</th>
                      <th>Crescimento vs. ano anterior</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readingTrends.yearly.map(y => (
                      <tr key={y.year}>
                        <td data-label="Ano">{y.year}</td>
                        <td data-label="Leituras">{y.reads}</td>
                        <td data-label="Crescimento">
                          {y.growth_rate === null
                            ? '—'
                            : (
                              <span style={{ color: y.growth_rate >= 0 ? GOOD : BAD, fontWeight: 600 }}>
                                {y.growth_rate >= 0 ? '↑' : '↓'} {Math.abs(y.growth_rate)}%
                              </span>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <h4 style={{ fontSize: '0.9rem', margin: '20px 0 8px 0' }}>Aberturas — Últimos 12 meses</h4>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={readingTrends.monthly_opens} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(m: string) => m.slice(5)}
                  tick={{ fontSize: 11, fill: 'var(--color-text-light)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(value: any) => [value, 'Aberturas']}
                  labelFormatter={(m: any) => new Date(`${m}-01T00:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                />
                <Bar dataKey="opens" name="Aberturas" radius={[6, 6, 0, 0]} fill={GOOD} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {readingTrends.yearly_opens.length > 0 && (
            <>
              <h4 style={{ fontSize: '0.9rem', margin: '20px 0 8px 0' }}>Aberturas por Ano — Taxa de Crescimento</h4>
              <div className="admin-table-container admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ano</th>
                      <th>Aberturas</th>
                      <th>Crescimento vs. ano anterior</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readingTrends.yearly_opens.map(y => (
                      <tr key={y.year}>
                        <td data-label="Ano">{y.year}</td>
                        <td data-label="Aberturas">{y.opens}</td>
                        <td data-label="Crescimento">
                          {y.growth_rate === null
                            ? '—'
                            : (
                              <span style={{ color: y.growth_rate >= 0 ? GOOD : BAD, fontWeight: 600 }}>
                                {y.growth_rate >= 0 ? '↑' : '↓'} {Math.abs(y.growth_rate)}%
                              </span>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {queue && (
        <div className="admin-section">
          <h3>Fila de devocionais</h3>
          <p style={{ color: queue.level === 'ok' ? GOOD : queue.level === 'warning' ? '#b45309' : BAD, fontWeight: 600 }}>
            {queue.level === 'ok'
              ? `Tudo certo: há devocional publicado para os próximos ${QUEUE_TARGET_DAYS} dias.`
              : queue.covered_days === 0
                ? 'Atenção: não há devocional publicado para hoje.'
                : `Há devocional publicado só para os próximos ${queue.covered_days} ${queue.covered_days === 1 ? 'dia' : 'dias'}. A meta é ${QUEUE_TARGET_DAYS}.`}
          </p>
          {queue.missing.length > 0 && (
            <p style={{ fontSize: 13, color: MUTED }}>
              Sem devocional em: {queue.missing.map((d) => d.slice(8, 10) + '/' + d.slice(5, 7)).join(', ')}.
            </p>
          )}
        </div>
      )}

      <div className="admin-section">
        <h3>Como as pessoas leem</h3>
        <p className="dash-hint">Cada leitura concluída no período</p>
        {readingModes && readingModes.total > 0 ? (
          <>
            <div className="dash-modes">
              {readingModes.modes.map(m => {
                const pct = Math.round((m.reads / readingModes.total) * 100);
                return (
                  <div className="dash-mode" key={m.mode}>
                    <span className="dash-mode__icon" aria-hidden="true">{MODE_ICONS[m.mode] ?? '📖'}</span>
                    <span className="dash-mode__body">
                      {MODE_LABELS[m.mode] ?? m.mode}
                      <small>{plural(m.reads, 'leitura', 'leituras')}</small>
                      <span className="dash-mode__bar"><i style={{ width: `${pct}%` }} /></span>
                    </span>
                    <b>{pct}%</b>
                  </div>
                );
              })}
            </div>
            {readingModes.bands.length > 0 && (
              <>
                <h4 className="dash-subtitle">Versões usadas com as crianças</h4>
                <div className="dash-bands">
                  {readingModes.bands.map(b => (
                    <span key={b.band}><b>{b.reads}</b>{bandLabel(b.band)}</span>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <p className="dash-hint">Ainda sem leituras por modo neste período.</p>
        )}
      </div>

      <div className="admin-section">
        <h3>Crianças por faixa de idade</h3>
        <KidsIndicatorsPanel data={kidsIndicators} />
      </div>

      <div className="admin-section">
        <h3>O que as pessoas procuram</h3>
        {searchTerms && searchTerms.total > 0 ? (
          <>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', margin: '0 0 12px' }}>
              {searchTerms.total} {searchTerms.total === 1 ? 'busca' : 'buscas'} no período
              {searchTerms.without_results > 0 && <> · {searchTerms.without_results} sem nenhum resultado</>}.
              Só as palavras são guardadas, nunca a frase inteira.
            </p>
            <div className="admin-table-container admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr><th>Palavra</th><th>Buscas</th><th>Sem resultado</th></tr>
                </thead>
                <tbody>
                  {searchTerms.terms.map(t => (
                    <tr key={t.term}>
                      <td data-label="Palavra">{t.term}</td>
                      <td data-label="Buscas">{t.count}</td>
                      <td data-label="Sem resultado">{t.without_results > 0 ? t.without_results : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {searchTerms.topics.length > 0 && (
              <div className="admin-table-container admin-table-responsive" style={{ marginTop: '16px' }}>
                <table className="admin-table">
                  <thead><tr><th>Tema</th><th>Buscas</th></tr></thead>
                  <tbody>
                    {searchTerms.topics.map(t => (
                      <tr key={t.topic}>
                        <td data-label="Tema">{TOPIC_LABELS[t.topic] ?? t.topic}</td>
                        <td data-label="Buscas">{t.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-light)' }}>
            Ainda não houve buscas neste período.
          </div>
        )}
      </div>

      <div className="admin-section">
        <h3>Top Conteúdos (Engajamento)</h3>
        {topContentChartData.length > 0 ? (
          <>
            <div style={{ width: '100%', height: Math.max(140, topContentChartData.length * 42) }}>
              <ResponsiveContainer>
                <BarChart data={topContentChartData} layout="vertical" margin={{ top: 4, right: 36, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={170}
                    interval={0}
                    tick={{ fontSize: 11, fill: 'var(--color-text)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: any) => [value, 'Leituras']}
                    labelFormatter={(_label: any, payload: any) => payload?.[0]?.payload?.full ?? _label}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                  />
                  <Bar dataKey="opens" radius={[0, 6, 6, 0]} fill={MUTED} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="admin-table-container admin-table-responsive" style={{ marginTop: '16px' }}>
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
                      <td data-label="Devocional">
                        {topContentTitle(item)}
                      </td>
                      <td data-label="Leituras">{item.opens}</td>
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
