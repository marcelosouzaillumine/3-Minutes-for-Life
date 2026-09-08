import { useEffect, useState } from 'react';
import { illumineFetch } from '../../lib/illumine';

type Overview = {
  retention: {
    dau: number;
    wau: number;
    mau: number;
    totalUsers: number;
    dauRate: number;
    wauRate: number;
    mauRate: number;
  };
  funnel: {
    opened: number;
    completed: number;
    favorited: number;
    completionRate: number;
    favoriteRate: number;
  };
  streaks: {
    distribution: { streak: number; users: number }[];
  };
};

export function AdminIdentity() {
  const [data, setData] = useState<Overview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);

  useEffect(() => {
    illumineFetch('/analytics/overview')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch(err => {
        console.error(err);
        setHasError(err.message || 'Erro desconhecido');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const stat = (label: string, value: string | number, sub?: string) => (
    <div style={{ background: 'var(--color-bg-subtle, #f9fafb)', borderRadius: 8, padding: '16px 20px', minWidth: 120 }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-dark)' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>Engajamento</h1>
          <p>Retenção, leituras e favoritos dos últimos 30 dias.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="admin-loading-state">
          <div className="admin-spinner" />
          <p>Carregando métricas...</p>
        </div>
      ) : hasError ? (
        <div className="admin-empty-state">
          <p>Não foi possível carregar os dados: <code>{hasError}</code></p>
          <p style={{ fontSize: '0.85rem', color: '#888', marginTop: 8 }}>
            Verifique se <code>VITE_ILLUMINE_URL</code> está configurado e o gateway está no ar.
          </p>
        </div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Retenção */}
          <div className="admin-section">
            <h3>Retenção de usuários</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
              {stat('Total de usuários', data.retention.totalUsers)}
              {stat('Ativos hoje (DAU)', data.retention.dau, `${data.retention.dauRate}% da base`)}
              {stat('Ativos esta semana (WAU)', data.retention.wau, `${data.retention.wauRate}% da base`)}
              {stat('Ativos este mês (MAU)', data.retention.mau, `${data.retention.mauRate}% da base`)}
            </div>
          </div>

          {/* Funil de leitura */}
          <div className="admin-section">
            <h3>Funil de leitura — últimos 30 dias</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
              {stat('Aberturas', data.funnel.opened)}
              {stat('Concluídas', data.funnel.completed, `${data.funnel.completionRate}% de conclusão`)}
              {stat('Favoritadas', data.funnel.favorited, `${data.funnel.favoriteRate}% de favorito`)}
            </div>
          </div>

          {/* Distribuição de streaks */}
          {data.streaks?.distribution?.length > 0 && (
            <div className="admin-section">
              <h3>Distribuição de streaks</h3>
              <div className="admin-table-container" style={{ marginTop: 12 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Streak</th>
                      <th>Usuários</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.streaks.distribution.map((row, i) => (
                      <tr key={i}>
                        <td>{row.streak} {row.streak === 1 ? 'dia' : 'dias'}</td>
                        <td>{row.users}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
