// A KPI card: small label, big number, and a line of context underneath
export default function StatTile({ label, value, detail, icon: Icon }) {
  return (
    <div className="rounded-lg border border-secondary-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-secondary-500">{label}</p>
        {Icon && <Icon className="size-5 text-secondary-400" aria-hidden />}
      </div>
      <p className="mt-2 truncate text-2xl font-bold tabular-nums text-secondary-900" title={String(value)}>{value}</p>
      {detail && <p className="mt-1 truncate text-sm text-secondary-500" title={String(detail)}>{detail}</p>}
    </div>
  );
}
