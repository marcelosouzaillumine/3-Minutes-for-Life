import { useEffect, useState } from 'react';
import { illumineFetch } from '../../lib/illumine';
import { PlansStudio } from './AdminPlans';
import '../../styles/family.css';

export interface Row { id: string; title: string; publicationDate: string; scriptureReference?: string | null; scriptureText?: string | null; principleStatement?: string | null; reflection?: string; practicalApplication?: string | null; prayer?: string | null }

function useDevotionals() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    illumineFetch('/devotionals?status=published&perPage=500')
      .then((r) => (r.ok ? r.json() : { devotionals: [] }))
      .then((b) => setRows(((b.devotionals ?? []) as Row[]).sort((a, c) => String(c.publicationDate).localeCompare(String(a.publicationDate)))))
      .catch(() => setError('Não foi possível carregar os devocionais.'));
  }, []);
  return { rows, error };
}

/** Planos para as famílias. As versões infantis dos devocionais agora ficam no editor de Conteúdo. */
export function AdminKids() {
  const { rows, error } = useDevotionals();
  return (
    <div className="admin-section studio">
      <h3>Planos</h3>
      {error && <p className="fam-error">{error}</p>}
      <PlansStudio rows={rows} />
    </div>
  );
}
