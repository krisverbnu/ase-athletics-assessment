// Player comparison: pick 2 to 4 players and see them side by side.
// The selection lives in the URL (/compare?ids=4,12,33), so the page can be shared as a link.
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Download, Link2, X } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PlayerPicker from '../components/common/PlayerPicker';
import { EmptyState, ErrorState, Spinner } from '../components/common/States';
import CompareTable from '../components/compare/CompareTable';
import { AttributeRadar, TimeLines } from '../components/compare/CompareCharts';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks';
import { getPlayer } from '../services/playerService';
import { downloadCsv } from '../utils/csv';
import { CORE_ATTRIBUTES, formatDate, formatMoney, SERIES_COLORS } from '../utils/format';

const MAX_PLAYERS = 4;
const per90 = (count, minutes) => (minutes > 0 ? Math.round((count / minutes) * 90 * 100) / 100 : null);
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// The rows for each tab. "better" says which direction wins the highlight.
const TABS = {
  performance: {
    label: 'Performance',
    rows: [
      { label: 'Position', value: (p) => p.position },
      { label: 'Team', value: (p) => p.team },
      { label: 'Age', value: (p) => p.age },
      { label: 'Appearances', value: (p) => p.appearances, better: 'high' },
      { label: 'Minutes', value: (p) => p.minutesPlayed, better: 'high', format: (v) => v.toLocaleString('en-GB') },
      { label: 'Goals', value: (p) => p.goals, better: 'high' },
      { label: 'Assists', value: (p) => p.assists, better: 'high' },
      { label: 'Goals per 90', value: (p) => per90(p.goals, p.minutesPlayed), better: 'high', format: (v) => v.toFixed(2) },
      { label: 'Assists per 90', value: (p) => per90(p.assists, p.minutesPlayed), better: 'high', format: (v) => v.toFixed(2) },
      { label: 'Shots on target', value: (p) => p.shotsOnTarget, better: 'high' },
      { label: 'Pass accuracy', value: (p) => p.passAccuracy, better: 'high', format: (v) => `${v}%` },
      { label: 'Tackles won', value: (p) => p.tacklesWon, better: 'high' },
      { label: 'Yellow cards', value: (p) => p.yellowCards, better: 'low' },
      { label: 'Red cards', value: (p) => p.redCards, better: 'low' },
    ],
  },
  attributes: {
    label: 'Attributes',
    rows: [...CORE_ATTRIBUTES, 'finishing', 'crossing', 'longShots', 'positioning', 'diving', 'handling', 'reflexes']
      .map((a) => ({ label: a === 'longShots' ? 'Long shots' : capital(a), value: (p) => p.attributes?.[a] ?? null, better: 'high' })),
  },
  market: {
    label: 'Market',
    rows: [
      { label: 'Market value', value: (p) => p.marketValue, better: 'high', format: formatMoney },
      { label: 'Weekly salary (assumed)', value: (p) => p.contractSalary, format: formatMoney },
      { label: 'Contract until', value: (p) => p.contractEnd, format: formatDate },
      { label: 'Goals + assists per €10K salary', value: (p) => (p.contractSalary ? Math.round(((p.goals + p.assists) / p.contractSalary) * 10000 * 10) / 10 : null), better: 'high' },
    ],
  },
};

export default function Compare() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const ids = (params.get('ids') || '').split(',').map(Number).filter(Boolean).slice(0, MAX_PLAYERS);
  const tab = TABS[params.get('tab')] ? params.get('tab') : 'performance';
  const [limitWarning, setLimitWarning] = useState(false);

  // Fetch the full profile of each selected player (attributes, value history, monthly form)
  const { data: fetched, loading, error, reload } = useApi(
    () => Promise.all(ids.map((id) => getPlayer(id))),
    [ids.join(',')],
  );

  // Give each player a colour by their position in the selection
  const players = (fetched || []).map((p, i) => ({ ...p, color: SERIES_COLORS[i] }));

  const setIds = (next) => setParams({ ...(next.length && { ids: next.join(',') }), ...(tab !== 'performance' && { tab }) });
  const add = (player) => {
    if (ids.length >= MAX_PLAYERS) { setLimitWarning(true); return; }
    setLimitWarning(false);
    setIds([...ids, player.id]);
  };
  const remove = (id) => { setLimitWarning(false); setIds(ids.filter((x) => x !== id)); };
  const setTab = (key) => setParams({ ...(ids.length && { ids: ids.join(',') }), ...(key !== 'performance' && { tab: key }) });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied. Anyone logged in can open this comparison.');
    } catch {
      toast.error('Could not copy automatically. Copy the address bar instead.');
    }
  }

  const exportCsv = () => downloadCsv(`comparison-${tab}.csv`, TABS[tab].rows, [
    { label: 'Metric', value: (row) => row.label },
    ...players.map((p) => ({ label: p.name, value: (row) => row.value(p) })),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Compare players</h1>
          <p className="mt-1 text-sm text-secondary-500">Pick 2 to 4 players to see them side by side.</p>
        </div>
        {players.length >= 2 && (
          <div className="flex gap-2">
            <Button variant="secondary" icon={Link2} onClick={copyLink}>Copy link</Button>
            <Button variant="secondary" icon={Download} onClick={exportCsv}>Export CSV</Button>
          </div>
        )}
      </div>

      {/* Selection: search to add, chips to remove */}
      <Card>
        <PlayerPicker label="Add a player" placeholder={ids.length >= MAX_PLAYERS ? 'Maximum of 4 players reached' : 'Type a name...'}
          excludeIds={ids} onSelect={add} disabled={ids.length >= MAX_PLAYERS} />
        {limitWarning && <p className="mt-2 text-sm text-amber-700">You can compare up to 4 players. Remove one to add another.</p>}
        {players.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Selected players">
            {players.map((p) => (
              <li key={p.id} className="inline-flex items-center gap-2 rounded-full border border-secondary-200 bg-white py-1 pl-3 pr-1 text-sm">
                <span className="size-2.5 rounded-full" style={{ background: p.color }} aria-hidden />
                <Link to={`/players/${p.id}`} className="font-medium text-secondary-900 hover:text-primary-700">{p.name}</Link>
                <button type="button" onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`}
                  className="rounded-full p-1 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-700"><X className="size-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {loading && ids.length > 0 && <Spinner label="Loading players..." />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {!loading && players.length < 2 && (
        <Card>
          <EmptyState title={players.length ? 'Add one more player' : 'No players selected yet'}
            message="Search above, or tick players on the Players page and press Compare." />
        </Card>
      )}

      {!loading && players.length >= 2 && (
        <>
          {/* Tabs */}
          <div role="tablist" aria-label="Metric category" className="flex gap-1 rounded-lg bg-secondary-100 p-1 sm:w-fit">
            {Object.entries(TABS).map(([key, t]) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                className={`min-w-0 flex-1 rounded-md px-2 py-2 text-sm font-medium sm:flex-none sm:px-4 ${tab === key ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-600 hover:text-secondary-900'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div role="tabpanel" className="grid gap-6 lg:grid-cols-5">
            <Card title={`${TABS[tab].label}: side by side`} className="lg:col-span-3">
              <CompareTable players={players} rows={TABS[tab].rows.filter((r) => players.some((p) => r.value(p) != null))} />
              <p className="mt-3 text-xs text-secondary-500">The best value in each row is shown in bold green.</p>
            </Card>
            <Card title={tab === 'performance' ? 'Goals + assists by month' : tab === 'attributes' ? 'Attribute profile' : 'Market value over time'}
              className="lg:col-span-2">
              <TabChart tab={tab} players={players} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function TabChart({ tab, players }) {
  if (tab === 'attributes') return <AttributeRadar players={players} />;

  const series = players.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    points: tab === 'performance'
      ? p.monthlyForm.map((m) => ({ time: new Date(m.month).getTime(), value: m.goals + m.assists }))
      : p.marketValues.map((v) => ({ time: new Date(v.date).getTime(), value: v.value })),
  })).filter((s) => s.points.length > 0);

  if (series.length === 0) {
    return <EmptyState title="No history for these players"
      message={tab === 'performance' ? 'Monthly form is only available for 12 players in the source data.' : 'Valuation history is only available for 12 players in the source data.'} />;
  }
  return (
    <>
      <TimeLines series={series} valueFormat={tab === 'market' ? formatMoney : (v) => v} valueLabel={tab === 'performance' ? 'G+A' : null} />
      {series.length < players.length && (
        <p className="mt-2 text-xs text-secondary-500">
          Not shown (no history in the data): {players.filter((p) => !series.some((s) => s.id === p.id)).map((p) => p.name).join(', ')}.
        </p>
      )}
    </>
  );
}
