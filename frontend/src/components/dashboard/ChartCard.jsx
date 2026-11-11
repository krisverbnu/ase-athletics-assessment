// A card for one chart: title, the question it answers, the chart, and a CSV download
// of the exact numbers behind it (bonus: "export capabilities for chart data", and an
// accessible alternative for anyone who can't read the colours).
import { Download } from 'lucide-react';

export default function ChartCard({ title, subtitle, onExport, className = '', children }) {
  return (
    <section className={`flex flex-col rounded-lg border border-secondary-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-secondary-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-secondary-500">{subtitle}</p>}
        </div>
        {onExport && (
          <button type="button" onClick={onExport} aria-label={`Download data for ${title} as CSV`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-secondary-600 hover:bg-secondary-100">
            <Download className="size-4" aria-hidden /> CSV
          </button>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}
