/**
 * Renders strings that use **double asterisks** as emphasis (no full markdown).
 */
export function RichLine({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/\*\*/);
  if (parts.length === 1) {
    return <span className={className}>{text}</span>;
  }
  return (
    <span className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-foreground">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

export function RichParagraphs({ text, paragraphClassName }: { text: string; paragraphClassName: string }) {
  const blocks = text.split(/\n\n/).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => (
        <p key={i} className={paragraphClassName}>
          <RichLine text={block} />
        </p>
      ))}
    </>
  );
}
