import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Paragraphs } from '../Paragraphs';

describe('Paragraphs', () => {
  it('separa parágrafos por linha em branco e ignora espaços sobrando', () => {
    expect(renderToStaticMarkup(<Paragraphs text={'Um.\n\n  Dois.\r\n\r\n\nTrês.  '} />)).toBe('<p>Um.</p><p>Dois.</p><p>Três.</p>');
    expect(renderToStaticMarkup(<Paragraphs text={null} />)).toBe('');
    expect(renderToStaticMarkup(<Paragraphs text="   " />)).toBe('');
  });

  it('renderiza um <p> por bloco e uma quebra simples vira nova linha', () => {
    expect(renderToStaticMarkup(<Paragraphs text={'Primeiro.\n\nPergunta 1\nPergunta 2'} />)).toBe(
      '<p>Primeiro.</p><p>Pergunta 1<br/>Pergunta 2</p>',
    );
  });

  it('com question, destaca a última linha só quando ela é uma pergunta', () => {
    expect(renderToStaticMarkup(<Paragraphs text={'Comentário.\nQuem conta histórias?'} question />)).toBe(
      '<p>Comentário.<span class="sec-question">Quem conta histórias?</span></p>',
    );
    expect(renderToStaticMarkup(<Paragraphs text={'Comentário.\nSem pergunta.'} question />)).toBe('<p>Comentário.<br/>Sem pergunta.</p>');
  });

  it('aplica a classe e o negrito pedidos', () => {
    expect(renderToStaticMarkup(<Paragraphs text="Faça isso." className="fam-note" strong />)).toBe(
      '<p class="fam-note"><strong>Faça isso.</strong></p>',
    );
  });
});
