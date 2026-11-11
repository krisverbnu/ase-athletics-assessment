// Write or edit a scouting report (/reports/new, /reports/new?playerId=4, /reports/7/edit).
// Fields follow ASE's report template (scout_report.json) plus venue and Sign/Monitor/Pass.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, X } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PlayerPicker from '../components/common/PlayerPicker';
import { PositionBadge } from '../components/common/Badges';
import { TextAreaField, TextField } from '../components/common/Field';
import { ErrorState, Spinner } from '../components/common/States';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage, getFieldErrors } from '../services/api';
import { getPlayer } from '../services/playerService';
import { createReport, getReport, updateReport } from '../services/reportService';
import { ratingLabel, RECOMMENDATIONS, toInputDate } from '../utils/format';

// The ten categories from ASE's scoutingCategories, with their descriptions as hints
const CATEGORIES = [
  ['technical', 'Ball control, first touch, technique'],
  ['physical', 'Pace, strength, stamina, agility'],
  ['mental', 'Decision making, composure, concentration'],
  ['tactical', 'Positioning, game understanding'],
  ['finishing', 'Goal scoring, composure in front of goal'],
  ['passing', 'Accuracy, range and creativity'],
  ['dribbling', 'Beating opponents with the ball'],
  ['defending', 'Tackling, marking, awareness'],
  ['leadership', 'Communication, influence on teammates'],
  ['workRate', 'Effort, commitment, pressing'],
];
const LIST_FIELDS = ['strengths', 'weaknesses', 'keyMoments'];

const EMPTY = {
  matchDate: '', opponent: '', competition: '', venue: '', result: '', minutesPlayed: '', positionPlayed: '',
  ...Object.fromEntries(CATEGORIES.map(([key]) => [key, 6])),
  overallRating: 6, strengths: '', weaknesses: '', keyMoments: '', recommendation: '', summary: '', notes: '',
};

// Report from the API -> form values (lists become one item per line)
function toForm(r) {
  const form = { ...EMPTY };
  for (const key of Object.keys(EMPTY)) form[key] = r[key] ?? EMPTY[key];
  for (const key of LIST_FIELDS) form[key] = (r[key] || []).join('\n');
  form.matchDate = toInputDate(r.matchDate);
  form.minutesPlayed = r.minutesPlayed ?? '';
  return form;
}

// Form values -> API data
function toPayload(form, playerId) {
  const out = { ...form, playerId };
  for (const key of LIST_FIELDS) out[key] = form[key].split('\n').map((s) => s.trim()).filter(Boolean);
  for (const key of ['competition', 'venue', 'result', 'positionPlayed', 'summary', 'notes']) out[key] = form[key].trim() || null;
  out.minutesPlayed = form.minutesPlayed === '' ? null : Number(form.minutesPlayed);
  for (const [key] of CATEGORIES) out[key] = Number(form[key]);
  out.overallRating = Number(form.overallRating);
  return out;
}

function validate(form, player) {
  const e = {};
  if (!player) e.playerId = 'Choose the player you watched.';
  if (!form.matchDate) e.matchDate = 'Add the match date.';
  if (!form.opponent.trim()) e.opponent = 'Add the opponent.';
  if (!form.recommendation) e.recommendation = 'Choose Sign, Monitor or Pass.';
  return e;
}

function RatingSlider({ id, label, hint, value, onChange }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-secondary-700">{label}</label>
        <span className="text-sm tabular-nums"><span className="font-bold text-secondary-900">{value}</span>
          <span className="text-secondary-500"> · {ratingLabel(value)}</span></span>
      </div>
      {hint && <p className="text-xs text-secondary-500">{hint}</p>}
      <input id={id} type="range" min="1" max="10" step="1" value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer accent-primary-700" />
    </div>
  );
}

function focusFirstError() {
  requestAnimationFrame(() => {
    const field = document.querySelector('[aria-invalid="true"], [data-error="true"]');
    if (field) { field.focus?.(); field.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

export default function ReportForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [player, setPlayer] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const presetPlayerId = Number(params.get('playerId')) || null;
  const [loadState, setLoadState] = useState({ loading: isEdit || Boolean(presetPlayerId), error: null });

  // Edit mode: load the report. New report from a player's page: load that player.
  useEffect(() => {
    if (isEdit) {
      getReport(id)
        .then((r) => {
          if (r.scout.id !== user?.id) {
            setLoadState({ loading: false, error: `Only ${r.scout.name} can edit this report.` });
            return;
          }
          setForm(toForm(r)); setPlayer(r.player); setLoadState({ loading: false, error: null });
        })
        .catch((err) => setLoadState({ loading: false, error: getErrorMessage(err) }));
    } else if (presetPlayerId) {
      getPlayer(presetPlayerId)
        .then((p) => { setPlayer(p); setLoadState({ loading: false, error: null }); })
        .catch(() => setLoadState({ loading: false, error: null })); // just pick a player manually
    }
  }, [id, isEdit, presetPlayerId, user?.id]);

  const field = (name) => ({
    value: form[name],
    error: errors[name],
    onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })),
  });
  const setValue = (name) => (value) => setForm((f) => ({ ...f, [name]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form, player);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) { setFormError('Please fix the highlighted fields.'); focusFirstError(); return; }
    setSaving(true);
    try {
      const saved = isEdit ? await updateReport(id, toPayload(form, player.id)) : await createReport(toPayload(form, player.id));
      toast.success(isEdit ? 'Report updated.' : 'Report saved.');
      navigate(`/reports/${saved.id}`);
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
      setSaving(false);
      focusFirstError();
    }
  }

  if (loadState.loading) return <Spinner label="Loading..." />;
  if (loadState.error) return <ErrorState message={loadState.error} />;

  const backTo = isEdit ? `/reports/${id}` : '/reports';

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-secondary-600 hover:text-primary-700">
        <ArrowLeft className="size-4" aria-hidden /> Back
      </Link>
      <h1 className="text-2xl font-bold text-secondary-900">{isEdit ? 'Edit scouting report' : 'Write a scouting report'}</h1>
      {formError && <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}

      <Card title="Player and match">
        <div className="flex flex-col gap-4">
          {player ? (
            <div className="flex items-center justify-between rounded-md border border-secondary-200 bg-secondary-50 px-4 py-3">
              <div>
                <p className="font-semibold text-secondary-900">{player.name}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-secondary-500"><PositionBadge position={player.position} /> {player.team}</p>
              </div>
              {!isEdit && (
                <button type="button" onClick={() => setPlayer(null)} aria-label="Change player"
                  className="rounded p-1 text-secondary-500 hover:text-secondary-800"><X className="size-5" /></button>
              )}
            </div>
          ) : (
            <PlayerPicker label="Player watched *" onSelect={(p) => { setPlayer(p); setErrors((e) => ({ ...e, playerId: undefined })); }} error={errors.playerId} />
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField label="Match date" type="date" required {...field('matchDate')} />
            <TextField label="Opponent" required placeholder="e.g. Atlético Madrid" {...field('opponent')} />
            <TextField label="Competition" placeholder="e.g. La Liga" {...field('competition')} />
            <TextField label="Venue" placeholder="e.g. Santiago Bernabéu" {...field('venue')} />
            <TextField label="Result" placeholder="e.g. 2-1 Win" {...field('result')} />
            <TextField label="Minutes played" type="number" min="0" max="130" {...field('minutesPlayed')} />
          </div>
        </div>
      </Card>

      <Card title="Ratings (1–10)">
        <p className="-mt-2 mb-5 text-sm text-secondary-500">1–2 very poor · 3–4 poor · 5–6 average · 7–8 good · 9–10 excellent</p>
        <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {CATEGORIES.map(([key, hint]) => (
            <RatingSlider key={key} id={`rating-${key}`} label={key === 'workRate' ? 'Work rate' : key.charAt(0).toUpperCase() + key.slice(1)}
              hint={hint} value={form[key]} onChange={setValue(key)} />
          ))}
        </div>
        <div className="mt-8 border-t border-secondary-200 pt-6">
          <RatingSlider id="rating-overall" label="Overall rating" value={form.overallRating} onChange={setValue('overallRating')} />
        </div>
      </Card>

      <Card title="Assessment">
        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaField label="Strengths" hint="One per line." {...field('strengths')} />
          <TextAreaField label="Weaknesses" hint="One per line." {...field('weaknesses')} />
          <TextAreaField label="Key moments" hint="One per line, e.g. 78': first-time finish for the winner." {...field('keyMoments')} />
          <TextAreaField label="Overall assessment" hint="Your verdict in a few sentences." {...field('summary')} />
        </div>
        <div className="mt-4"><TextAreaField label="Other notes" rows={3} {...field('notes')} /></div>
      </Card>

      <Card title="Recommendation">
        <fieldset data-error={Boolean(errors.recommendation)} tabIndex={-1}>
          <legend className="sr-only">Recommendation</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(RECOMMENDATIONS).map(([value, rec]) => {
              const on = form.recommendation === value;
              return (
                <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 ${on ? 'border-primary-700 bg-primary-50' : 'border-secondary-200 hover:border-secondary-300'}`}>
                  <input type="radio" name="recommendation" value={value} checked={on}
                    onChange={() => { setValue('recommendation')(value); setErrors((e) => ({ ...e, recommendation: undefined })); }}
                    className="size-4 accent-primary-700" />
                  <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${rec.style}`}>{rec.label}</span>
                </label>
              );
            })}
          </div>
          {errors.recommendation && <p className="mt-2 text-sm text-red-600">{errors.recommendation}</p>}
        </fieldset>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link to={backTo}><Button variant="secondary" className="w-full">Cancel</Button></Link>
        <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Save report'}</Button>
      </div>
    </form>
  );
}
