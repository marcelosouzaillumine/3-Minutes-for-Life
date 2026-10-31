import { Fragment } from 'react';

/** Quebra um texto simples em blocos: linha em branco separa parágrafos. */
function splitParagraphs(text: string | null | undefined): string[] {
  return (text ?? '')
    .split(/(?:\r?\n\s*){2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Mostra um texto simples (como as versões infantis) em parágrafos; uma quebra simples vira nova linha dentro do parágrafo. */
export function Paragraphs({ text, className, strong, question }: { text: string | null | undefined; className?: string; strong?: boolean; question?: boolean }) {
  const blocks = splitParagraphs(text);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split(/\r?\n/);
        // `question`: a última linha do último bloco, se for pergunta, ganha destaque próprio.
        const askLast = !!question && i === blocks.length - 1 && lines.length > 1 && lines[lines.length - 1].trim().endsWith('?');
        return (
          <p key={i} className={className}>
            {lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && !(askLast && j === lines.length - 1) && <br />}
                {askLast && j === lines.length - 1 ? <span className="sec-question">{line}</span> : strong ? <strong>{line}</strong> : line}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}
