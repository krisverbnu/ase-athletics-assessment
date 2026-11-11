// Player directory: search, filters, sortable paginated table (cards on phones), CSV export.
// Search, filters, page and sort all live in the URL (?q=real&position=Forward&page=2...),
// so the back button works, refreshing keeps your view, and a view can be shared as a link.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, GitCompare, Plus, Search, SearchX, SlidersHorizontal, Users, X } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Highlight from '../components/common/Highlight';
import Pagination from '../components/common/Pagination';
import { Avatar, PositionBadge } from '../components/common/Badges';
import { EmptyState, ErrorState, ListSkeleton } from '../components/common/States';
import ActiveFilters from '../components/filters/ActiveFilters';
import FilterPanel from '../components/filters/FilterPanel';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks';
import { getErrorMessage } from '../services/api';
import { getPlayers } from '../services/playerService';
import { downloadCsv } from '../utils/csv';
import { countActive, filtersToParams, loadSavedFilters, readFilters, saveFilters } from '../utils/filters';
import { formatDate, formatMoney } from '../utils/format';

const PAGE_SIZE = 25;
const MAX_COMPARE = 4;
const COLUMNS = [
  { key: 'name', label: 'Player' },
  { key: 'position', label: 'Position' },
  { key: 'age', label: 'Age', align: 'right' },
  { key: 'team', label: 'Team' },
  { key: 'goals', label: 'Goals', align: 'right' },
  { key: 'assists', label: 'Assists', align: 'right' },
  { key: 'marketValue', label: 'Market value', align: 'right' },
  { key: 'contractEnd', label: 'Contract until' },
];

// Text columns start A to Z; number columns start biggest first (scouts want top scorers first)
const defaultOrder = (key) => (['name', 'team', 'position'].includes(key) ? 'asc' : 'desc');

// The tick box used in both the table and the phone cards
function CompareBox({ player, checked, disabled, onToggle }) {
  return (
    // The padding around the box makes a ~40px tap target on phones; the negative margin
    // keeps it looking the same size. stopPropagation stops the tap opening the player.
    <label className="-m-3 inline-flex cursor-pointer p-3" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={() => onToggle(player.id)}
        aria-label={`Select ${player.name} for comparison`}
        className="size-4 cursor-pointer accent-primary-700 disabled:cursor-not-allowed" />
    </label>
  );
}

export default function Players() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const sort = params.get('sort') || 'name';
  const order = params.get('order') || 'asc';
  const q = params.get('q') || '';
  const filters = readFilters(params);
  const activeCount = countActive(filters);

  const [searchText, setSearchText] = useState(q);
  const [showFilters, setShowFilters] = useState(activeCount > 0);
  const [exporting, setExporting] = useState(false);
  const [compareIds, setCompareIds] = useState([]); // players ticked for comparison

  const toggleCompare = (id) => setCompareIds((ids) => (ids.includes(id)
    ? ids.filter((x) => x !== id)
    : ids.length < MAX_COMPARE ? [...ids, id] : ids));

  // Write a new view into the URL. Anything not mentioned in `changes` stays as it is.
  const setView = (changes) => {
    const next = { page, sort, order, q, filters, ...changes };
    setParams({
      page: String(next.page),
      sort: next.sort,
      order: next.order,
      ...(next.q && { q: next.q }),
      ...filtersToParams(next.filters),
    });
  };

  // Coming back to /players with no filters in the URL? Restore the ones from this session.
  useEffect(() => {
    const saved = loadSavedFilters();
    if (saved && !params.toString()) setParams(new URLSearchParams(saved), { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Remember the current view for this browser tab (bonus: filter persistence)
  useEffect(() => { saveFilters(params.toString()); }, [params]);

  // Debounce: only search 300 ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.trim() !== q) setView({ q: searchText.trim(), page: 1 });
    }, 300);
    return () => clearTimeout(timer);
  });

  const filterKey = JSON.stringify(filtersToParams(filters));
  const { data, loading, error, reload } = useApi(
    () => getPlayers({ page, limit: PAGE_SIZE, sort, order, q, ...filters }),
    [page, sort, order, q, filterKey],
  );

  const toggleSort = (key) => setView({
    sort: key,
    order: sort === key ? (order === 'asc' ? 'desc' : 'asc') : defaultOrder(key),
    page: 1,
  });

  const clearAll = () => { setSearchText(''); setView({ q: '', filters: readFilters(new URLSearchParams()), page: 1 }); };

  // Export every player matching the current search and filters, not just this page
  async function handleExport() {
    setExporting(true);
    try {
      const { data: rows } = await getPlayers({ page: 1, limit: 100, sort, order, q, ...filters });
      downloadCsv('ase-players.csv', rows, [
        { label: 'Name', value: (p) => p.name },
        { label: 'Position', value: (p) => p.position },
        { label: 'Age', value: (p) => p.age },
        { label: 'Team', value: (p) => p.team },
        { label: 'Nationality', value: (p) => p.nationality },
        { label: 'Appearances', value: (p) => p.appearances },
        { label: 'Goals', value: (p) => p.goals },
        { label: 'Assists', value: (p) => p.assists },
        { label: 'Minutes', value: (p) => p.minutesPlayed },
        { label: 'Market value (EUR)', value: (p) => p.marketValue },
        { label: 'Weekly salary (EUR, assumed)', value: (p) => p.contractSalary },
        { label: 'Contract end', value: (p) => p.contractEnd?.slice(0, 10) },
      ]);
      toast.success(`Exported ${rows.length} players.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  const SortIcon = ({ column }) => {
    if (sort !== column) return <ArrowUpDown className="size-3.5 text-secondary-400" aria-hidden />;
    return order === 'asc' ? <ArrowUp className="size-3.5" aria-hidden /> : <ArrowDown className="size-3.5" aria-hidden />;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Players</h1>
          <p className="mt-1 text-sm text-secondary-500">Search, filter and sort every player in the database.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Download} loading={exporting} onClick={handleExport} disabled={!data?.meta.total}>Export CSV</Button>
          <Link to="/players/new"><Button icon={Plus}>Add player</Button></Link>
        </div>
      </div>

      {/* Search + filter toggle */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-secondary-400" aria-hidden />
          <input
            type="text"
            enterKeyHint="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by name, team or nationality..."
            aria-label="Search players"
            className="h-12 w-full rounded-md border border-secondary-300 bg-white pl-12 pr-12 text-sm focus:border-primary-500 focus:outline-none focus:ring-3 focus:ring-primary-500/15"
          />
          {searchText && (
            <button type="button" onClick={() => setSearchText('')} aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-secondary-400 hover:text-secondary-700">
              <X className="size-5" />
            </button>
          )}
        </div>
        <Button variant={showFilters ? 'primary' : 'secondary'} icon={SlidersHorizontal} className="h-12"
          onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} aria-controls="filter-panel">
          Filters{activeCount > 0 && ` (${activeCount})`}
        </Button>
      </div>

      {showFilters && (
        <Card className="motion-safe:animate-slide-down">
          <div id="filter-panel">
            <FilterPanel filters={filters} onChange={(next) => setView({ filters: next, page: 1 })} />
          </div>
        </Card>
      )}

      <ActiveFilters filters={filters} onChange={(next) => setView({ filters: next, page: 1 })} onClearAll={clearAll} />

      {/* Phones have no column headers to click, so sorting is a dropdown */}
      <label className="flex items-center gap-2 text-sm text-secondary-700 md:hidden">
        Sort by
        <select value={`${sort}:${order}`} onChange={(e) => { const [s, o] = e.target.value.split(':'); setView({ sort: s, order: o, page: 1 }); }}
          className="flex-1 rounded-md border border-secondary-300 bg-white px-3 py-2.5">
          <option value="name:asc">Name (A–Z)</option>
          <option value="goals:desc">Most goals</option>
          <option value="assists:desc">Most assists</option>
          <option value="marketValue:desc">Highest market value</option>
          <option value="age:asc">Youngest</option>
          <option value="age:desc">Oldest</option>
          <option value="contractEnd:asc">Contract ending soonest</option>
        </select>
      </label>

      <Card flush className="overflow-hidden">
        {loading && <ListSkeleton label="Loading players..." />}
        {error && <div className="p-6"><ErrorState message={error} onRetry={reload} /></div>}
        {data && data.data.length === 0 && (q || activeCount
          ? <EmptyState icon={SearchX} title="No players match" message="Try a different search, or remove some filters."
              action={<Button variant="secondary" size="sm" onClick={clearAll}>Clear search and filters</Button>} />
          : <EmptyState icon={Users} title="No players yet" message="Add the first player to get started."
              action={<Link to="/players/new"><Button size="sm" icon={Plus}>Add player</Button></Link>} />)}

        {data && data.data.length > 0 && (
          <>
            {/* Desktop and tablet: table */}
            <div className="relative hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-700">
                  <tr>
                    <th scope="col" className="w-10 py-3 pl-4"><span className="sr-only">Compare</span></th>
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
                    <tr key={p.id} onClick={() => navigate(`/players/${p.id}`)} className="cursor-pointer transition-colors duration-150 hover:bg-primary-50/60">
                      <td className="py-3 pl-4">
                        <CompareBox player={p} checked={compareIds.includes(p.id)} onToggle={toggleCompare}
                          disabled={!compareIds.includes(p.id) && compareIds.length >= MAX_COMPARE} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.name} size="sm" />
                          <div>
                            <Link to={`/players/${p.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-secondary-900 hover:text-primary-700">
                              <Highlight text={p.name} query={q} />
                            </Link>
                            <p className="text-xs text-secondary-500"><Highlight text={p.nationality} query={q} /></p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><PositionBadge position={p.position} /></td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.age}</td>
                      <td className="px-4 py-3"><Highlight text={p.team} query={q} /></td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.goals}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.assists}</td>
                      <td className={`px-4 py-3 text-right tabular-nums ${p.marketValue == null ? 'text-secondary-400' : ''}`}
                        title={p.marketValue == null ? 'Not provided in the source data' : undefined}>
                        {p.marketValue == null ? <>n/a<span className="sr-only"> (not provided in the source data)</span></> : formatMoney(p.marketValue)}
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
                <li key={p.id} className="flex items-center">
                  <div className="flex items-center self-stretch pl-4">
                    <CompareBox player={p} checked={compareIds.includes(p.id)} onToggle={toggleCompare}
                      disabled={!compareIds.includes(p.id) && compareIds.length >= MAX_COMPARE} />
                  </div>
                  {/* min-w-0 lets long names shorten with "..." instead of pushing the badge off screen */}
                  <Link to={`/players/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-4 active:bg-secondary-50">
                    <Avatar name={p.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-secondary-900"><Highlight text={p.name} query={q} /></p>
                      <p className="truncate text-xs text-secondary-500"><Highlight text={p.team} query={q} /> · {p.age} yrs</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <PositionBadge position={p.position} />
                      <p className="mt-1 text-xs text-secondary-600">{p.goals} G · {p.assists} A</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="border-t border-secondary-200 px-4 py-4">
              <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} limit={PAGE_SIZE}
                onChange={(p) => { setView({ page: p }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </div>
          </>
        )}
      </Card>

      {/* Floating bar once players are ticked */}
      {compareIds.length > 0 && (
        <div className="sticky bottom-4 z-20 mx-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-lg bg-secondary-800 px-4 py-3 text-white shadow-xl">
          <p className="text-sm">
            <span className="font-semibold">{compareIds.length}</span> of {MAX_COMPARE} selected
            {compareIds.length < 2 && <span className="text-secondary-300 max-[25rem]:hidden"> · pick at least 2</span>}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => setCompareIds([])} className="px-2 text-sm text-secondary-300 hover:text-white">Clear</button>
            <Link to={`/compare?ids=${compareIds.join(',')}`} aria-disabled={compareIds.length < 2}
              onClick={(e) => compareIds.length < 2 && e.preventDefault()}>
              <Button icon={GitCompare} size="sm" disabled={compareIds.length < 2}>Compare</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
