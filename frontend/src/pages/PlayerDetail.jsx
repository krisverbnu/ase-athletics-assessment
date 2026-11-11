import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, ClipboardPlus, GitCompare, Pencil, Trash2 } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { Avatar, PositionBadge, RecommendationBadge } from '../components/common/Badges';
import { EmptyState, ErrorState, Spinner } from '../components/common/States';
import AttributeBars from '../components/players/AttributeBars';
import { MonthlyFormChart, ValueHistoryChart } from '../components/players/MiniCharts';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks';
import { getErrorMessage } from '../services/api';
import { deletePlayer, getPlayer } from '../services/playerService';
import { formatDate, formatMoney, per90 } from '../utils/format';

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-lg bg-secondary-50 p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-secondary-500">{label}</dt>
      <dd className="mt-1 text-2xl font-bold tabular-nums text-secondary-900">{value ?? '–'}</dd>
      {hint && <p className="text-xs text-secondary-500">{hint}</p>}
    </div>
  );
}

// One label/value line. `note` is small print under the value (e.g. where it came from).
function InfoRow({ label, value, note }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-secondary-500">{label}</dt>
      <dd className="text-right">
        <span className={value == null ? 'text-secondary-400' : 'font-medium text-secondary-900'}>{value ?? 'Not available'}</span>
        {note && <span className="block text-xs font-normal text-secondary-500">{note}</span>}
      </dd>
    </div>
  );
}

// Where the market value came from: the source data, a user, or nowhere yet
function marketValueNote(p) {
  if (p.marketValue == null) {
    return <>Not in the source data · <Link to={`/players/${p.id}/edit`} className="text-primary-700 underline">add it</Link></>;
  }
  const latest = p.marketValues.at(-1);
  return latest ? `ASE detailed data · valued ${formatDate(latest.date)}` : 'Entered in this app';
}


export default function PlayerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { data: player, loading, error, reload } = useApi(() => getPlayer(id), [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deletePlayer(id);
      toast.success(`${player.name} was deleted.`);
      navigate('/players', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (loading) return <Spinner label="Loading player..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const p = player;
  const isKeeper = p.position === 'Goalkeeper';
  const reportCount = p.reports.length;

  return (
    <div className="flex flex-col gap-6">
      <Link to="/players" className="inline-flex items-center gap-1 text-sm text-secondary-600 hover:text-primary-700">
        <ArrowLeft className="size-4" aria-hidden /> All players
      </Link>

      {/* Header */}
      <Card>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <Avatar name={p.name} size="lg" />
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">{p.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-secondary-600">
                <PositionBadge position={p.position} />
                {p.detailedPosition && p.detailedPosition !== p.position && <span>{p.detailedPosition}</span>}
                <span aria-hidden>·</span><span>{p.team}</span>
                {p.league && <><span aria-hidden>·</span><span>{p.league}</span></>}
              </div>
              <p className="mt-1 text-sm text-secondary-500">
                {p.nationality} · {p.age} years{p.jerseyNumber ? ` · #${p.jerseyNumber}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/compare?ids=${p.id}`}><Button variant="secondary" icon={GitCompare}>Compare</Button></Link>
            <Link to={`/reports/new?playerId=${p.id}`}><Button variant="secondary" icon={ClipboardPlus}>Write report</Button></Link>
            <Link to={`/players/${p.id}/edit`}><Button variant="secondary" icon={Pencil}>Edit</Button></Link>
            <Button variant="danger" icon={Trash2} onClick={() => setConfirming(true)}>Delete</Button>
          </div>
        </div>
      </Card>

      {/* Season stats */}
      <Card title="Season 2024-25">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Appearances" value={p.appearances} />
          <Stat label="Minutes" value={p.minutesPlayed.toLocaleString('en-GB')} />
          {isKeeper ? (
            <>
              <Stat label="Clean sheets" value={p.cleanSheets} />
              <Stat label="Saves" value={p.saves} />
              <Stat label="Conceded" value={p.goalsConceded} />
              <Stat label="Pass accuracy" value={p.passAccuracy != null ? `${p.passAccuracy}%` : null} />
            </>
          ) : (
            <>
              <Stat label="Goals" value={p.goals} hint={`${per90(p.goals, p.minutesPlayed)} per 90`} />
              <Stat label="Assists" value={p.assists} hint={`${per90(p.assists, p.minutesPlayed)} per 90`} />
              <Stat label="Shots on target" value={p.totalShots ? `${p.shotsOnTarget}/${p.totalShots}` : null} />
              <Stat label="Pass accuracy" value={p.passAccuracy != null ? `${p.passAccuracy}%` : null} />
            </>
          )}
        </dl>
        <p className="mt-3 text-xs text-secondary-500">
          Cards: {p.yellowCards} yellow, {p.redCards} red
          {!isKeeper && p.tacklesWon != null && ` · Tackles won: ${p.tacklesWon}`}
          {!isKeeper && p.dribblesCompleted != null && ` · Dribbles: ${p.dribblesCompleted}`}
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Attributes" className="lg:col-span-2">
          <AttributeBars attributes={p.attributes} isKeeper={isKeeper} />
        </Card>
        <Card title="Contract & market">
          <dl className="divide-y divide-secondary-100">
            <InfoRow label="Market value" value={p.marketValue != null ? formatMoney(p.marketValue) : null} note={marketValueNote(p)} />
            <InfoRow label="Weekly salary" value={p.contractSalary != null ? formatMoney(p.contractSalary) : null}
              note={p.contractSalary != null ? 'Unit assumed: weekly, EUR' : null} />
            <InfoRow label="Contract until" value={formatDate(p.contractEnd)} />
            <InfoRow label="Preferred foot" value={p.preferredFoot} />
            <InfoRow label="Height / weight" value={p.height ? `${p.height} cm / ${p.weight} kg` : null} />
          </dl>
          <p className="mt-3 text-xs text-secondary-500">
            Figures from the 2024-25 source data. <Link to="/dashboard#data-quality" className="underline">About the data</Link>
          </p>
        </Card>
      </div>

      {(p.marketValues.length > 1 || p.monthlyForm.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {p.marketValues.length > 1 && <Card title="Market value over time"><ValueHistoryChart history={p.marketValues} /></Card>}
          {p.monthlyForm.length > 0 && <Card title="Goals and assists by month"><MonthlyFormChart form={p.monthlyForm} /></Card>}
        </div>
      )}

      <Card title={`Scouting reports (${reportCount})`}>
        {reportCount === 0 ? (
          <EmptyState title="No reports yet" message="Scouting reports about this player will appear here." />
        ) : (
          <ul className="divide-y divide-secondary-100">
            {p.reports.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link to={`/reports/${r.id}`} className="text-sm font-semibold text-secondary-900 hover:text-primary-700">vs {r.opponent} · {formatDate(r.matchDate)}</Link>
                  <p className="text-xs text-secondary-500">By {r.scout.name}{r.competition ? ` · ${r.competition}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums">{r.overallRating}/10</span>
                  <RecommendationBadge value={r.recommendation} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={confirming}
        title={`Delete ${p.name}?`}
        message={reportCount
          ? `This also deletes ${reportCount} scouting report${reportCount > 1 ? 's' : ''}, plus their value history and form data. This can't be undone.`
          : "Their attributes, value history and form data are deleted too. This can't be undone."}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
