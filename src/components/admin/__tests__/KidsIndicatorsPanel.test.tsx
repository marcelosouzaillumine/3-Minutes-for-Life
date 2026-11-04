import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { KidsIndicatorsPanel } from '../KidsIndicatorsPanel';
import type { KidsIndicators } from '../../../services/AdminService';

const band = (b: string, o: Partial<KidsIndicators['bands'][number]> = {}) => ({
  band: b, registeredChildren: 0, families: 0, activeChildren: 0, reads: 0, readingDays: 0, returningChildren: 0,
  avgReadsPerActiveChild: 0, publishedVersions: 0, coverage: 0, topDevotionals: [], ...o,
});

describe('painel de crianças', () => {
  it('avisa quando não há dados', () => {
    expect(renderToStaticMarkup(<KidsIndicatorsPanel data={null} />)).toContain('Não foi possível');
    const empty: KidsIndicators = { totals: { registeredChildren: 0, activeChildren: 0, reads: 0, publishedDevotionals: 5 }, bands: [band('0-3')] };
    expect(renderToStaticMarkup(<KidsIndicatorsPanel data={empty} />)).toContain('Ainda não há crianças');
  });

  it('mostra uma linha por faixa com participação, retorno e cobertura', () => {
    const data: KidsIndicators = {
      totals: { registeredChildren: 4, activeChildren: 3, reads: 9, publishedDevotionals: 10 },
      bands: [
        band('0-3', { registeredChildren: 1 }),
        band('7-10', { registeredChildren: 3, activeChildren: 3, reads: 9, returningChildren: 2, avgReadsPerActiveChild: 3, publishedVersions: 5, coverage: 50, topDevotionals: [{ devotionalId: 'd1', title: 'Zaqueu', reads: 6 }] }),
      ],
    };
    const html = renderToStaticMarkup(<KidsIndicatorsPanel data={data} />);
    expect(html).toContain('7 a 10 anos');
    expect(html).toContain('75%'); // 3 de 4 cadastradas leram
    expect(html).toContain('5 de 10');
    expect(html).toContain('Zaqueu (6)');
  });
});
