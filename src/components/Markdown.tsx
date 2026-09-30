import { Fragment } from 'react';
import type { ReactNode } from 'react';

/**
 * Deliberately tiny Markdown renderer: paragraphs, numbered and bulleted
 * lists, `---` rules, **bold** and *italic*. No `dangerouslySetInnerHTML`
 * anywhere, so model output can never inject markup.
 */

function inline(text: string, keyBase: string) {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    const key = `${keyBase}-${i}`;
    i += 1;
    if (token.startsWith('**')) {
      parts.push(
        <strong key={key} className="font-bold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('[')) {
      // Fill-in-the-blank placeholder in a drafted complaint.
      parts.push(
        <mark
          key={key}
          className="bg-warn/20 text-ink px-1 rounded border border-warn/40 font-medium"
        >
          {token.slice(1, -1)}
        </mark>,
      );
    } else {
      parts.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);

  return (
    <div className="space-y-3 leading-relaxed">
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length === 0) return null;

        if (lines.every((l) => /^---+$/.test(l.trim()))) {
          return <hr key={bi} className="border-line" />;
        }

        const ordered = lines.every((l) => /^\s*\d+[.)]\s/.test(l));
        const bulleted = lines.every((l) => /^\s*[-*•]\s/.test(l));

        if (ordered) {
          return (
            <ol key={bi} className="list-decimal ms-6 space-y-1.5">
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*\d+[.)]\s*/, ''), `${bi}-${li}`)}</li>
              ))}
            </ol>
          );
        }
        if (bulleted) {
          return (
            <ul key={bi} className="list-disc ms-6 space-y-1.5">
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*[-*•]\s*/, ''), `${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {inline(l, `${bi}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
