import { useEffect, useState } from 'react';
import { AdminService, type DashboardMetrics } from '../../services/AdminService';

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [period, setPeriod] = useState('7d'); // 'today', '7d', '30d'

  const fetchMetrics = async () => {
    setIsLoading(true);
    setHasError(false);
    
    // Calcula as datas com base no período
    const end = new Date();
    const start = new Date();
    
    if (period === 'today') {
      start.setDate(end.getDate());
    } else if (period === '7d') {
      start.setDate(end.getDate() - 7);
    } else if (period === '30d') {
      start.setDate(end.getDate() - 30);
    }
    
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];

    const data = await AdminService.getDashboardMetrics(startDateStr, endDateStr);
    
    if (data) {
      setMetrics(data);
    } else {
      setHasError(true);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
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
    if (previous === 0) return <span className="admin-trend neutral">—</span>;
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
  
  const calcRetention = (retained: number, cohort: number) => {
    if (cohort === 0) return "0%";
    return `${((retained / cohort) * 100).toFixed(1)}%`;
  }

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

      <div className="admin-section">
        <h3>Jornada da Comunidade</h3>
        <div className="admin-funnel-container">
          <div className="admin-funnel-step">
            <div className="admin-funnel-info">
              <div className="admin-funnel-label">Acessou</div>
              <div className="admin-funnel-value">{metrics.funnel.accessed}</div>
            </div>
            <div className="admin-funnel-rate">100%</div>
          </div>
          
          <div className="admin-funnel-step">
            <div className="admin-funnel-info">
              <div className="admin-funnel-label">Leu</div>
              <div className="admin-funnel-value">{metrics.funnel.read}</div>
            </div>
            <div className="admin-funnel-rate">{calcConversion(metrics.funnel.read, metrics.funnel.accessed)}</div>
          </div>
          
          <div className="admin-funnel-step">
            <div className="admin-funnel-info">
              <div className="admin-funnel-label">Compartilhou</div>
              <div className="admin-funnel-value">{metrics.funnel.shared}</div>
            </div>
            <div className="admin-funnel-rate">{calcConversion(metrics.funnel.shared, metrics.funnel.read)}</div>
          </div>
          
          <div className="admin-funnel-step">
            <div className="admin-funnel-info">
              <div className="admin-funnel-label">Testemunhou</div>
              <div className="admin-funnel-value">{metrics.funnel.testified}</div>
            </div>
            <div className="admin-funnel-rate">{calcConversion(metrics.funnel.testified, metrics.funnel.shared)}</div>
          </div>
          
          <div className="admin-funnel-step">
            <div className="admin-funnel-info">
              <div className="admin-funnel-label">Respondido</div>
              <div className="admin-funnel-value">{metrics.funnel.responded}</div>
            </div>
            <div className="admin-funnel-rate">{calcConversion(metrics.funnel.responded, metrics.funnel.testified)}</div>
          </div>
          
          <div className="admin-funnel-step">
            <div className="admin-funnel-info">
              <div className="admin-funnel-label">Retornou</div>
              <div className="admin-funnel-value">{metrics.funnel.returned}</div>
            </div>
            <div className="admin-funnel-rate">{calcConversion(metrics.funnel.returned, metrics.funnel.responded)}</div>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-columns">
        <div className="admin-section">
          <h3>Retenção da Coorte</h3>
          <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginBottom: '24px' }}>
            Base {metrics.retention.cohort_size} usuários novos neste período.
          </p>
          <div className="admin-retention-grid">
            <div className="admin-retention-item">
              <div style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginBottom: '8px' }}>D1</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{calcRetention(metrics.retention.d1, metrics.retention.cohort_size)}</div>
            </div>
            <div className="admin-retention-item">
              <div style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginBottom: '8px' }}>D3</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{calcRetention(metrics.retention.d3, metrics.retention.cohort_size)}</div>
            </div>
            <div className="admin-retention-item">
              <div style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginBottom: '8px' }}>D7</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{calcRetention(metrics.retention.d7, metrics.retention.cohort_size)}</div>
            </div>
            <div className="admin-retention-item">
              <div style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginBottom: '8px' }}>D30</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{calcRetention(metrics.retention.d30, metrics.retention.cohort_size)}</div>
            </div>
          </div>
        </div>

        <div className="admin-section">
          <h3>Comunidade & Moderação</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', border: '1px solid var(--color-border)', padding: '16px', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Testemunhos Pendentes</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Aguardando leitura</div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: metrics.community.pending_testimonials > 0 ? '#dc2626' : '#059669' }}>
                {metrics.community.pending_testimonials}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', border: '1px solid var(--color-border)', padding: '16px', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Respostas Atrasadas</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>&gt; 48h sem resposta</div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: metrics.community.delayed_responses > 0 ? '#dc2626' : '#059669' }}>
                {metrics.community.delayed_responses}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h3>Top Conteúdos (Engajamento)</h3>
        {metrics.top_content.length > 0 ? (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Devocional ID</th>
                  <th>Leituras</th>
                </tr>
              </thead>
              <tbody>
                {metrics.top_content.map((item, index) => (
                  <tr key={index}>
                    <td>{item.content_id.split('-').slice(0, 3).join('-')}...</td>
                    <td>{item.opens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-light)' }}>
            Não houve leitura de devocionais neste período.
          </div>
        )}
      </div>

    </div>
  );
}
