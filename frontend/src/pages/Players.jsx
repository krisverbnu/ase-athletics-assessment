// Player directory: sortable, paginated table (cards on phones).
// Page, sort and order live in the URL (?page=2&sort=age&order=desc),
// so the back button works and a view can be shared as a link.
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowDown, ArrowUp, ArrowUpDown, Plus } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Pagination from '../components/common/Pagination';
import { Avatar, PositionBadge } from '../components/common/Badges';
import { EmptyState, ErrorState, Spinner } from '../components/common/States';
import { useApi } from '../hooks';
import { getPlayers } from '../services/playerService';
import { formatDate, formatMoney } from '../utils/format';

const PAGE_SIZE = 25;
const COLUMNS = [
  { key: 'name', label: 'Player', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'age', label: 'Age', sortable: true, align: 'right' },
  { key: 'team', label: 'Team', sortable: true },
  { key: 'goals', label: 'Goals', sortable: true, align: 'right' },
  { key: 'assists', label: 'Assists', sortable: true, align: 'right' },
  { key: 'marketValue', label: 'Market value', sortable: true, align: 'right' },
  { key: 'contractEnd', label: 'Contract until', sortable: true },
];

export default function Players() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const sort = params.get('sort') || 'name';
  const order = params.get('order') || 'asc';

  const { data, loading, error, reload } = useApi(
    () => getPlayers({ page, limit: PAGE_SIZE, sort, order }),
    [page, sort, order],
  );

  const setQuery = (changes) => setParams({ page, sort, order, ...changes });

  // Click a column: sort by it; click again: flip the direction
  const toggleSort = (key) => setQuery({
    sort: key,
    order: sort === key && order === 'asc' ? 'desc' : key === 'name' || key === 'team' ? 'asc' : 'desc',
    page: 1,
  });

  const SortIcon = ({ column }) => {
    if (sort !== column) return <ArrowUpDown className="size-3.5 text-secondary-400" aria-hidden />;
    return order === 'asc' ? <ArrowUp className="size-3.5" aria-hidden /> : <ArrowDown className="size-3.5" aria-hidden />;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Players</h1>
          <p className="mt-1 text-sm text-secondary-500">Every player in the database, with season stats and contract details.</p>
        </div>
        <Link to="/players/new"><Button icon={Plus}>Add player</Button></Link>
      </div>

      <Card flush className="overflow-hidden">
        {loading && <Spinner label="Loading players..." />}
        {error && <div className="p-6"><ErrorState message={error} onRetry={reload} /></div>}
        {data && data.data.length === 0 && <EmptyState title="No players yet" message="Add the first player to get started." />}

        {data && data.data.length > 0 && (
          <>
            {/* Desktop and tablet: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-700">
                  <tr>
                    {COLUMNS.map((c) => (
                      <th key={c.key} scope="col" className={`px-4 py-3 font-semibold ${c.align === 'right' ? 'text-right' : ''}`}
                        aria-sort={sort === c.key ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}>
                        <button type="button" onClick={() => toggleSort(c.key)}
                          className={`inline-flex items-center gap-1 uppercase hover:text-primary-700 ${sort === c.key ? 'text-primary-700' : ''}`}>
                          {c.label} <SortIcon column={c.key} />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {data.data.map((p) => (
                    <tr key={p.id} onClick={() => navigate(`/players/${p.id}`)} className="cursor-pointer hover:bg-primary-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.name} size="sm" />
                          <div>
                            <Link to={`/players/${p.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-secondary-900 hover:text-primary-700">{p.name}</Link>
                            <p className="text-xs text-secondary-500">{p.nationality}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><PositionBadge position={p.position} /></td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.age}</td>
                      <td className="px-4 py-3">{p.team}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.goals}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.assists}</td>
                      <td className={`px-4 py-3 text-right tabular-nums ${p.marketValue == null ? 'text-secondary-400' : ''}`}>
                        {p.marketValue == null ? 'n/a' : formatMoney(p.marketValue)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(p.contractEnd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phones: one card per player */}
            <ul className="divide-y divide-secondary-100 md:hidden">
              {data.data.map((p) => (
                <li key={p.id}>
                  <Link to={`/players/${p.id}`} className="flex items-center gap-3 px-4 py-4 active:bg-secondary-50">
                    <Avatar name={p.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-secondary-900">{p.name}</p>
                      <p className="truncate text-xs text-secondary-500">{p.team} · {p.age} yrs</p>
                    </div>
                    <div className="text-right">
                      <PositionBadge position={p.position} />
                      <p className="mt-1 text-xs text-secondary-600">{p.goals} G · {p.assists} A</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="border-t border-secondary-200 px-4 py-4">
              <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} limit={PAGE_SIZE}
                onChange={(p) => { setQuery({ page: p }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
