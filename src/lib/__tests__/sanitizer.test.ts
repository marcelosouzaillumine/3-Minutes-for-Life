import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../sanitizer';

describe('Sanitizer Unit Tests (Segurança e Preservação de Conteúdo)', () => {

  it('preserva parágrafo simples com texto', () => {
    const input = '<p>Texto simples de um devocional.</p>';
    const output = sanitizeHtml(input);
    expect(output).toBe('<p>Texto simples de um devocional.</p>');
  });

  it('preserva múltiplos parágrafos completos sem truncamento', () => {
    const input = [
      '<p>Primeiro parágrafo com reflexão importante.</p>',
      '<p>Segundo parágrafo teológico.</p>',
      '<p>Terceiro parágrafo com aplicação prática.</p>'
    ].join('');
    const output = sanitizeHtml(input);
    expect(output).toContain('<p>Primeiro parágrafo com reflexão importante.</p>');
    expect(output).toContain('<p>Segundo parágrafo teológico.</p>');
    expect(output).toContain('<p>Terceiro parágrafo com aplicação prática.</p>');
  });

  it('preserva formatação rica (strong, em, u, span)', () => {
    const input = '<p>Texto com <strong>negrito</strong>, <em>itálico</em>, <u>sublinhado</u> e <span>destaque</span>.</p>';
    const output = sanitizeHtml(input);
    expect(output).toBe('<p>Texto com <strong>negrito</strong>, <em>itálico</em>, <u>sublinhado</u> e <span>destaque</span>.</p>');
  });

  it('preserva listas ordenadas e não ordenadas', () => {
    const input = '<ul><li>Item 1</li><li>Item 2</li></ul><ol><li>Passo 1</li></ol>';
    const output = sanitizeHtml(input);
    expect(output).toBe('<ul><li>Item 1</li><li>Item 2</li></ul><ol><li>Passo 1</li></ol>');
  });

  it('preserva blocos de citação (blockquote) e quebras de linha (br)', () => {
    const input = '<blockquote>Citação inspiradora<br>Segunda linha da citação</blockquote>';
    const output = sanitizeHtml(input);
    expect(output).toBe('<blockquote>Citação inspiradora<br>Segunda linha da citação</blockquote>');
  });

  it('preserva bloco de CTA com atributos data-* autorizados', () => {
    const input = '<div data-type="cta" data-title="Apoio" data-description="Canal de ajuda" data-label="Acessar" data-url="https://3minutes.org/ajuda" data-action=""></div>';
    const output = sanitizeHtml(input);
    expect(output).toContain('data-type="cta"');
    expect(output).toContain('data-title="Apoio"');
    expect(output).toContain('data-description="Canal de ajuda"');
    expect(output).toContain('data-label="Acessar"');
    expect(output).toContain('data-url="https://3minutes.org/ajuda"');
  });

  it('remove scripts maliciosos e tags perigosas', () => {
    const input = '<p>Texto seguro</p><script>alert("hack")</script><iframe src="https://evil.com"></iframe>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('<script>');
    expect(output).not.toContain('<iframe>');
    expect(output).not.toContain('alert');
    expect(output).toContain('<p>Texto seguro</p>');
  });

  it('remove atributos de eventos JavaScript maliciosos (onerror, onclick, onload)', () => {
    const input = '<p onclick="alert(1)">Clique</p><img src="x" onerror="alert(2)" />';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('onclick');
    expect(output).not.toContain('onerror');
    expect(output).not.toContain('<img');
    expect(output).toContain('<p>Clique</p>');
  });

  it('bloqueia protocolos desconhecidos/inseguros', () => {
    const input = '<a href="javascript:alert(1)">Link malicioso</a>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('javascript:');
  });
});
