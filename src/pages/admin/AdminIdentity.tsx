import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type TelemetryHealth = {
  identity_state: string;
  event_count: number;
  percentage: number;
};

export function AdminIdentity() {
  const [healthData, setHealthData] = useState<TelemetryHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setIsLoading(true);
        // Em produção, isso seria substituído por uma RPC dedicada (ex: get_telemetry_health)
        // Por enquanto, tentamos ler diretamente se o admin tiver RLS, ou usamos mock de demonstração
        const { data, error } = await supabase.rpc('get_telemetry_health');
        
        if (error) {
          console.warn('RPC get_telemetry_health não encontrada. Mostrando placeholder visual.');
          setHasError(error.message || 'Erro desconhecido');
        } else {
          setHealthData(data || []);
        }
      } catch (err) {
        console.error(err);
        setHasError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>Identity Telemetry</h1>
          <p>Monitoramento contínuo da saúde e continuidade das identidades.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="admin-loading-state">
          <div className="admin-spinner"></div>
          <p>Carregando telemetria de identidade...</p>
        </div>
      ) : hasError ? (
        <div className="admin-empty-state" style={{ textAlign: 'left' }}>
          <h3 style={{ color: 'var(--color-text-dark)', marginBottom: '16px' }}>Status da Implementação</h3>
          <p style={{ marginBottom: '16px' }}>
            Ocorreu um erro ao chamar a função RPC <code>get_telemetry_health</code>.
          </p>
          <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontSize: '0.9rem', color: '#dc2626' }}>
            {hasError}
          </div>
          <p style={{ marginTop: '16px' }}>
            Aguardando a execução da consulta SQL fornecida no relatório no Supabase SQL Editor.
          </p>
        </div>
      ) : (
        <div className="admin-section">
          <h3>Saúde do Tracking</h3>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Estado de Identidade</th>
                  <th>Eventos Registrados</th>
                  <th>Percentual</th>
                </tr>
              </thead>
              <tbody>
                {healthData.length > 0 ? healthData.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: row.identity_state === 'authenticated_without_anonymous' ? '#fee2e2' : '#d1fae5',
                        color: row.identity_state === 'authenticated_without_anonymous' ? '#991b1b' : '#065f46'
                      }}>
                        {row.identity_state}
                      </span>
                    </td>
                    <td>{row.event_count}</td>
                    <td>{row.percentage}%</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-light)' }}>
                      Nenhum evento registrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
