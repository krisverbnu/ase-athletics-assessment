// Side-by-side table: one column per player, one row per metric.
// The best value in each row is highlighted (higher is better, unless the row says otherwise).
export default function CompareTable({ players, rows }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-secondary-200">
            <th scope="col" className="sticky left-0 bg-white py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Metric</th>
            {players.map((p) => (
              <th key={p.id} scope="col" className="px-3 py-3 text-right align-bottom font-semibold text-secondary-900">
                <span className="flex flex-col items-end gap-1.5">
                  <span className="h-1 w-8 rounded-full" style={{ background: p.color }} aria-hidden />
                  {p.name}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-100">
          {rows.map((row) => {
            const raw = players.map((p) => row.value(p));
            const numbers = raw.filter((v) => typeof v === 'number');
            // Only highlight when there's a real contest: 2+ numbers and not all equal
            const best = row.better && numbers.length > 1 && new Set(numbers).size > 1
              ? (row.better === 'low' ? Math.min(...numbers) : Math.max(...numbers))
              : null;
            return (
              <tr key={row.label}>
                <th scope="row" className="sticky left-0 bg-white py-2.5 pr-4 text-left font-medium text-secondary-600">{row.label}</th>
                {raw.map((v, i) => {
                  const isBest = best !== null && v === best;
                  return (
                    <td key={players[i].id} className={`px-3 py-2.5 text-right tabular-nums ${isBest ? 'font-bold text-emerald-700' : 'text-secondary-900'}`}>
                      {v === null || v === undefined ? <span className="text-secondary-400">–</span> : (row.format ? row.format(v) : v)}
                      {isBest && <span className="sr-only"> (best)</span>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
