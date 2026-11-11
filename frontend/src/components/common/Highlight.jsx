// Wraps the parts of `text` that match `query` in a yellow <mark>.
// "Kane" with query "ka" -> <mark>Ka</mark>ne
export default function Highlight({ text, query }) {
  if (!query) return text;

  // Escape symbols like "." or "(" so they're searched as normal characters
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Split the text around every match, keeping the matches (the brackets do that)
  const parts = String(text).split(new RegExp(`(${safe})`, 'gi'));

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="rounded bg-amber-200 px-0.5 text-secondary-900">{part}</mark>
      : part,
  );
}
