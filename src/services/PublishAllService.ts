import { AdminContentService, buildLangMap } from './AdminContentService';
import { FamilyAdmin, BANDS } from './FamilyService';

export interface PublishReport {
  published: number;
  skipped: string[];
}

const KIDS_REQUIRED = ['whatItSays', 'thinkAbout', 'practice', 'prayer', 'adultGuide'] as const;

/**
 * Publica de uma vez os rascunhos de um devocional: a tradução do texto adulto em cada idioma
 * e as versões infantis (4-6, 7-10, 11-13) de todos os idiomas. Não toca no status do
 * devocional em português e não inventa conteúdo: o que está vazio ou incompleto fica de fora
 * e volta no relatório.
 */
export async function publishAllForDevotional(devo: any, languages: any[]): Promise<PublishReport> {
  const report: PublishReport = { published: 0, skipped: [] };
  const langMap = buildLangMap(devo);
  const label = (iso: string) => languages.find((l) => l.iso_code === iso)?.name ?? iso;

  for (const lang of languages.filter((l) => !l.is_source)) {
    const entry = langMap[lang.iso_code];
    if (!entry || entry.state !== 'draft') continue;
    const t = entry.manual?.status === 'draft' ? entry.manual : entry.ai;
    if (!t) continue;
    try {
      await AdminContentService.saveManualTranslation({
        devotional_id: devo.id,
        language: lang.iso_code,
        title: t.title,
        principle_statement: t.principle_statement,
        scripture_reference: t.scripture_reference,
        scripture_text: t.scripture_text,
        reflection: t.reflection,
        practical_application: t.practical_application,
        prayer: t.prayer,
        content_tip: t.content_tip,
        content_tip_image_url: t.content_tip_image_url,
        content_tip_url: t.content_tip_url,
        support_message: t.support_message,
        support_banner_url: t.support_banner_url,
        support_link_url: t.support_link_url,
        status: 'published',
        source_content_hash: devo.content_hash,
      });
      report.published++;
    } catch (e: any) {
      report.skipped.push(`${devo.title} · ${label(lang.iso_code)} (adulto): ${e?.message ?? 'erro ao publicar'}`);
    }
  }

  for (const lang of languages) {
    const kids = await FamilyAdmin.getKids(devo.id, lang.iso_code);
    for (const band of BANDS) {
      const d = kids[band];
      if (!d || d.status !== 'draft') continue;
      if (!KIDS_REQUIRED.every((k) => String(d[k] ?? '').trim())) {
        report.skipped.push(`${devo.title} · ${label(lang.iso_code)} ${band}: campos da faixa incompletos`);
        continue;
      }
      if (await FamilyAdmin.saveKids(devo.id, band, { ...d, status: 'published' }, lang.iso_code)) report.published++;
      else report.skipped.push(`${devo.title} · ${label(lang.iso_code)} ${band}: não foi possível salvar`);
    }
  }
  return report;
}

export async function publishAll(devos: any[], languages: any[]): Promise<PublishReport> {
  const total: PublishReport = { published: 0, skipped: [] };
  for (const d of devos) {
    const r = await publishAllForDevotional(d, languages);
    total.published += r.published;
    total.skipped.push(...r.skipped);
  }
  return total;
}
