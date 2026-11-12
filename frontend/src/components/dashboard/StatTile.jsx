// A KPI card: small label, big number, and a line of context underneath.
// Pass `to` to make the whole card a link (e.g. the top scorer opens his profile);
// `linkText` is the small visible cue at the bottom, so it's clear the card can be clicked.
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';

const CARD = 'rounded-lg border border-secondary-200 bg-white p-5 shadow-sm';

export default function StatTile({ label, value, detail, icon: Icon, to, linkText }) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-secondary-500">{label}</p>
        {Icon && <Icon className="size-5 text-secondary-400" aria-hidden />}
      </div>
      <p className="mt-2 truncate text-2xl font-bold tabular-nums text-secondary-900" title={String(value)}>
        {value}
      </p>
      {detail && (
        <p className="mt-1 truncate text-sm text-secondary-500" title={String(detail)}>
          {detail}
        </p>
      )}
    </>
  );

  if (!to) return <div className={CARD}>{body}</div>;

  return (
    <Link
      to={to}
      className={`${CARD} group flex flex-col transition duration-150 hover:border-primary-300 hover:shadow-md motion-safe:hover:-translate-y-0.5`}
    >
      {body}
      {linkText && (
        <span className="mt-auto flex items-center gap-1 pt-3 text-sm font-medium text-primary-700">
          {linkText}
          <ArrowRight className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden />
        </span>
      )}
    </Link>
  );
}
