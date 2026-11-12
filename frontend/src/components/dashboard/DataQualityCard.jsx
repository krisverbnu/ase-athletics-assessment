// "Data quality" panel: how complete each field is, and how gaps are handled.
// Being upfront about missing data is what makes the other numbers trustworthy.
import { Info } from 'lucide-react';

const DOCS_URL = 'https://github.com/krisverbnu/ase-athletics-assessment/blob/main/docs/data-quality.md';

export default function DataQualityCard({ quality, dataDate }) {
  const { totalPlayers, coverage } = quality;
  return (
    <section id="data-quality" className="scroll-mt-24 rounded-lg border border-secondary-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 size-5 shrink-0 text-primary-700" aria-hidden />
        <div>
          <h2 className="text-base font-semibold text-secondary-900">Data quality</h2>
          <p className="mt-0.5 text-sm text-secondary-500">
            How complete the source data is for the {totalPlayers} players shown, and how gaps are handled.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* Coverage meters: one row per field */}
        <dl className="flex flex-col gap-3">
          {coverage.map((c) => {
            const pct = totalPlayers ? Math.round((c.count / totalPlayers) * 100) : 0;
            return (
              <div key={c.key}>
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-secondary-700">{c.label}</dt>
                  <dd className="tabular-nums text-secondary-900">
                    <span className="font-semibold">{c.count}</span> of {totalPlayers}
                    <span className="text-secondary-500"> ({pct}%)</span>
                  </dd>
                </div>
                <div className="mt-1 h-2 rounded-full bg-secondary-100" role="presentation">
                  <div className="h-2 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </dl>

        {/* The rules applied to the gaps */}
        <div>
          <h3 className="text-sm font-semibold text-secondary-900">How gaps are handled</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-secondary-700">
            <li>
              Missing values are shown as <span className="font-medium">"Not available"</span>, never as zero, and are
              sorted last.
            </li>
            <li>
              Market values are <span className="font-medium">not estimated</span>: 12 known values are too few to model
              the rest reliably.
            </li>
            <li>
              Salaries have no unit in the source; they're treated as{' '}
              <span className="font-medium">weekly, in EUR</span> (matches the detailed file).
            </li>
            <li>
              The data is a snapshot from <span className="font-medium">{dataDate}</span>. The contracts card shows both
              that date and today, side by side.
            </li>
            <li>
              Both player files were merged into one database; a retired player was excluded and an orphaned scout
              report re-linked.
            </li>
          </ul>
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm font-medium text-primary-700 underline hover:text-primary-900"
          >
            Read the full data notes
          </a>
        </div>
      </div>
    </section>
  );
}
