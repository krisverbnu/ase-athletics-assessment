// All scouting reports, newest match first, filterable by player, scout and recommendation.
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ConfirmDialog from '../components/common/ConfirmDialog';
import PlayerPicker from '../components/common/PlayerPicker';
import { PositionBadge, RecommendationBadge } from '../components/common/Badges';
import { SelectField } from '../components/common/Field';
import { EmptyState, ErrorState, Spinner } from '../components/common/States';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks';
import { getErrorMessage } from '../services/api';
import { deleteReport, getReports } from '../services/reportService';
import { formatDate, RECOMMENDATIONS } from '../utils/format';

export default function Reports() {
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const playerId = Number(params.get('playerId')) || undefined;
  const scoutId = Number(params.get('scoutId')) || undefined;
  const recommendation = params.get('recommendation') || undefined;
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error, reload } = useApi(
    () => getReports({ playerId, scoutId, recommendation, limit: 100 }),
    [playerId, scoutId, recommendation],
  );
  // Unfiltered list, only to build the "Scout" dropdown from everyone who has written a report
  const { data: all } = useApi(() => getReports({ limit: 100 }), [data?.meta.total]);
  const scouts = [...new Map((all?.data || []).map((r) => [r.scout.id, r.scout])).values()]
    .sort((a, b) => a.name.localeCompare(b.name));

  const setFilter = (changes) => {
    const next = { playerId, scoutId, recommendation, ...changes };
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v).map(([k, v]) => [k, String(v)])));
  };
  const filterPlayer = data?.data.find((r) => r.player.id === playerId)?.player;
  const hasFilters = playerId || scoutId || recommendation;

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteReport(toDelete.id);
      toast.success('Report deleted.');
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Scouting reports</h1>
          <p className="mt-1 text-sm text-secondary-500">Match observations from the scouting team.</p>
        </div>
        <Link to="/reports/new"><Button icon={Plus}>Write a report</Button></Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          {playerId ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-secondary-700">Player</span>
              <span className="inline-flex h-12 items-center justify-between rounded-md border border-secondary-300 bg-secondary-50 px-4 text-sm">
                {filterPlayer?.name || `Player #${playerId}`}
                <button type="button" onClick={() => setFilter({ playerId: undefined })} aria-label="Clear player filter"
                  className="text-secondary-500 hover:text-secondary-800"><X className="size-4" /></button>
              </span>
            </div>
          ) : (
            <PlayerPicker label="Player" placeholder="Any player" onSelect={(p) => setFilter({ playerId: p.id })} />
          )}
          <SelectField label="Scout" placeholder="Any scout" value={scoutId || ''}
            onChange={(e) => setFilter({ scoutId: Number(e.target.value) || undefined })}
            options={[...(user ? [{ value: user.id, label: `Me (${user.name})` }] : []),
              ...scouts.filter((s) => s.id !== user?.id).map((s) => ({ value: s.id, label: s.name }))]} />
          <SelectField label="Recommendation" placeholder="Any" value={recommendation || ''}
            onChange={(e) => setFilter({ recommendation: e.target.value || undefined })}
            options={Object.entries(RECOMMENDATIONS).map(([value, r]) => ({ value, label: r.label }))} />
        </div>
        {hasFilters && (
          <button type="button" onClick={() => setParams({})} className="mt-4 text-sm font-medium text-primary-700 underline">Clear filters</button>
        )}
      </Card>

      {loading && <Spinner label="Loading reports..." />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.data.length === 0 && (
        <Card>
          <EmptyState title={hasFilters ? 'No reports match these filters' : 'No reports yet'}
            message={hasFilters ? 'Try removing a filter.' : 'Write the first scouting report.'}
            action={!hasFilters && <Link to="/reports/new"><Button size="sm">Write a report</Button></Link>} />
        </Card>
      )}

      {data && data.data.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.data.map((r) => (
            <li key={r.id}>
              <Card className="flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/players/${r.player.id}`} className="text-lg font-semibold text-secondary-900 hover:text-primary-700">{r.player.name}</Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-secondary-500">
                      <PositionBadge position={r.player.position} /><span>{r.player.team}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums text-secondary-900">{r.overallRating}<span className="text-sm font-medium text-secondary-400">/10</span></p>
                    <RecommendationBadge value={r.recommendation} />
                  </div>
                </div>
                <p className="text-sm text-secondary-600">
                  vs <span className="font-medium text-secondary-900">{r.opponent}</span> · {formatDate(r.matchDate)}
                  {r.competition && ` · ${r.competition}`}
                </p>
                {r.summary && <p className="line-clamp-2 text-sm text-secondary-700">{r.summary}</p>}
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-secondary-100 pt-3">
                  <p className="text-xs text-secondary-500">By {r.scout.name}</p>
                  <div className="flex gap-1">
                    <Link to={`/reports/${r.id}`} aria-label={`View report on ${r.player.name}`} className="rounded-md p-2 text-secondary-600 hover:bg-secondary-100"><Eye className="size-4" /></Link>
                    <Link to={`/reports/${r.id}/edit`} aria-label={`Edit report on ${r.player.name}`} className="rounded-md p-2 text-secondary-600 hover:bg-secondary-100"><Pencil className="size-4" /></Link>
                    <button type="button" onClick={() => setToDelete(r)} aria-label={`Delete report on ${r.player.name}`} className="rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog open={Boolean(toDelete)} title="Delete this report?"
        message={toDelete ? `The report on ${toDelete.player.name} (vs ${toDelete.opponent}) will be permanently deleted.` : ''}
        loading={deleting} onConfirm={handleDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}
