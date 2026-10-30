import { Fragment } from 'react';

/** Quebra um texto simples em blocos: linha em branco separa parágrafos. */
function splitParagraphs(text: string | null | undefined): string[] {
  return (text ?? '')
    .split(/(?:\r?\n\s*){2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Mostra um texto simples (como as versões infantis) em parágrafos; uma quebra simples vira nova linha dentro do parágrafo. */
export function Paragraphs({ text, className, strong }: { text: string | null | undefined; className?: string; strong?: boolean }) {
  return (
    <>
      {splitParagraphs(text).map((block, i) => (
        <p key={i} className={className}>
          {block.split(/\r?\n/).map((line, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {strong ? <strong>{line}</strong> : line}
            </Fragment>
          ))}
        </p>
      ))}
    </>
  );
}
