// White card with border and soft shadow (guidelines: components.card)
// flush: no inner padding (for tables that run edge to edge)
export default function Card({ title, action, flush = false, className = '', children }) {
  return (
    <section className={`rounded-lg border border-secondary-200 bg-white shadow-sm ${flush ? '' : 'p-6'} ${className}`}>
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
