// A short ranked list of players (e.g. "best output per 90"), each linking to their profile
import { Link } from 'react-router';
import { PositionBadge } from '../common/Badges';

export default function RankedList({ items, value, empty = 'No players match these filters.' }) {
  if (!items.length) return <p className="py-6 text-center text-sm text-secondary-500">{empty}</p>;
  return (
    <ol className="divide-y divide-secondary-100">
      {items.map((item, i) => (
        <li key={item.id}>
          <Link to={`/players/${item.id}`} className="flex items-center gap-3 py-2.5 hover:bg-secondary-50">
            <span className="w-5 text-right text-sm font-semibold tabular-nums text-secondary-400">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-secondary-900">{item.name}</p>
              <p className="truncate text-xs text-secondary-500">{item.team}</p>
            </div>
            <PositionBadge position={item.position} />
            <span className="min-w-12 shrink-0 whitespace-nowrap text-right text-sm font-semibold tabular-nums text-secondary-900">{value(item)}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
