// White card with border and soft shadow (guidelines: components.card)
// flush: no inner padding (for tables that run edge to edge)
// min-w-0: lets the card shrink inside a grid, so wide tables scroll inside it instead of widening the page
export default function Card({ title, action, flush = false, className = '', children }) {
  return (
    <section
      className={`min-w-0 rounded-lg border border-secondary-200 bg-white shadow-sm ${flush ? '' : 'p-4 sm:p-6'} ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="text-base font-semibold text-secondary-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
