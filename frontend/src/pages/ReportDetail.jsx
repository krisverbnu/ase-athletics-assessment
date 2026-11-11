// One scouting report in full. "Save as PDF" uses the browser's print dialog;
// the sidebar, header and buttons are hidden when printing (print:hidden classes).
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Pencil, Printer, Trash2 } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { PositionBadge, RecommendationBadge } from '../components/common/Badges';
import { ErrorState, PageSkeleton } from '../components/common/States';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks';
import { getErrorMessage } from '../services/api';
import { deleteReport, getReport } from '../services/reportService';
import { formatDate, ratingLabel } from '../utils/format';

const CATEGORIES = ['technical', 'physical', 'mental', 'tactical', 'finishing', 'passing', 'dribbling', 'defending', 'leadership', 'workRate'];
const label = (k) => (k === 'workRate' ? 'Work rate' : k.charAt(0).toUpperCase() + k.slice(1));
const barColour = (v) => (v >= 9 ? 'bg-emerald-500' : v >= 7 ? 'bg-primary-500' : v >= 5 ? 'bg-amber-500' : 'bg-red-500');

function BulletList({ title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-secondary-900">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-secondary-700">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { data: r, loading, error, reload } = useApi(() => getReport(id), [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteReport(id);
      toast.success('Report deleted.');
      navigate('/reports', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (loading) return <PageSkeleton label="Loading report..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const details = [
    ['Match date', formatDate(r.matchDate)], ['Opponent', r.opponent], ['Competition', r.competition],
    ['Venue', r.venue], ['Result', r.result], ['Minutes played', r.minutesPlayed], ['Played as', r.positionPlayed],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '');

  return (
    <div className="flex flex-col gap-6">
      <Link to="/reports" className="inline-flex items-center gap-1 text-sm text-secondary-600 hover:text-primary-700 print:hidden">
        <ArrowLeft className="size-4" aria-hidden /> All reports
      </Link>

      <Card>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Scouting report</p>
            <h1 className="mt-1 text-2xl font-bold text-secondary-900">
              <Link to={`/players/${r.player.id}`} className="hover:text-primary-700">{r.player.name}</Link>
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-secondary-600">
              <PositionBadge position={r.player.position} /> {r.player.team}
            </p>
            <p className="mt-2 text-sm text-secondary-500">By {r.scout.name} · written {formatDate(r.createdAt)}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-4xl font-bold tabular-nums text-secondary-900">{r.overallRating}<span className="text-lg text-secondary-400">/10</span></p>
              <p className="text-sm text-secondary-500">{ratingLabel(r.overallRating)}</p>
            </div>
            <RecommendationBadge value={r.recommendation} />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 print:hidden">
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print / Save as PDF</Button>
          {/* Only the scout who wrote the report can change it (the API enforces this too) */}
          {r.scout.id === user?.id && (<>
            <Link to={`/reports/${r.id}/edit`}><Button variant="secondary" icon={Pencil}>Edit</Button></Link>
            <Button variant="danger" icon={Trash2} onClick={() => setConfirming(true)}>Delete</Button>
          </>)}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3 print:grid-cols-3">
        <Card title="Match">
          <dl className="divide-y divide-secondary-100">
            {details.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2 text-sm">
                <dt className="text-secondary-500">{k}</dt><dd className="text-right font-medium text-secondary-900">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card title="Ratings" className="lg:col-span-2 print:col-span-2">
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {CATEGORIES.map((k) => (
              <div key={k}>
                <div className="flex justify-between text-sm">
                  <dt className="text-secondary-600">{label(k)}</dt>
                  <dd className="font-semibold tabular-nums text-secondary-900">{r[k]}<span className="font-normal text-secondary-400">/10</span></dd>
                </div>
                <div className="mt-1 h-2 rounded-full bg-secondary-100" role="presentation">
                  <div className={`h-2 rounded-full ${barColour(r[k])}`} style={{ width: `${r[k] * 10}%` }} />
                </div>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card title="Assessment">
        <div className="flex flex-col gap-6">
          {r.summary && <p className="text-secondary-800">{r.summary}</p>}
          <div className="grid gap-6 md:grid-cols-2">
            <BulletList title="Strengths" items={r.strengths} />
            <BulletList title="Weaknesses" items={r.weaknesses} />
          </div>
          <BulletList title="Key moments" items={r.keyMoments} />
          {r.notes && (
            <div>
              <h3 className="text-sm font-semibold text-secondary-900">Notes</h3>
              <p className="mt-2 whitespace-pre-line text-sm text-secondary-700">{r.notes}</p>
            </div>
          )}
        </div>
      </Card>

      <ConfirmDialog open={confirming} title="Delete this report?" message="This report will be permanently deleted."
        loading={deleting} onConfirm={handleDelete} onCancel={() => setConfirming(false)} />
    </div>
  );
}
