// One form for both "Add player" (/players/new) and "Edit player" (/players/:id/edit)
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { SelectField, TextField } from '../components/common/Field';
import { ErrorState, Spinner } from '../components/common/States';
import { useToast } from '../context/ToastContext';
import { getErrorMessage, getFieldErrors } from '../services/api';
import { createPlayer, getPlayer, updatePlayer } from '../services/playerService';
import { POSITIONS, toInputDate } from '../utils/format';

const ATTRIBUTES = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
const NUMBER_FIELDS = ['age', 'height', 'weight', 'jerseyNumber', 'appearances', 'goals', 'assists', 'minutesPlayed',
  'yellowCards', 'redCards', 'passAccuracy', 'contractSalary', 'marketValue'];

const EMPTY = {
  name: '', position: '', age: '', team: '', league: '', nationality: '', height: '', weight: '',
  preferredFoot: '', jerseyNumber: '', appearances: '0', goals: '0', assists: '0', minutesPlayed: '0',
  yellowCards: '0', redCards: '0', passAccuracy: '', contractSalary: '', contractEnd: '', marketValue: '',
  attributes: Object.fromEntries(ATTRIBUTES.map((a) => [a, '50'])),
};

// API data -> form values (inputs always hold strings)
function toForm(p) {
  const form = { ...EMPTY };
  for (const key of Object.keys(EMPTY)) {
    if (key === 'attributes') continue;
    form[key] = p[key] == null ? '' : String(p[key]);
  }
  form.contractEnd = toInputDate(p.contractEnd);
  form.attributes = Object.fromEntries(ATTRIBUTES.map((a) => [a, String(p.attributes?.[a] ?? 50)]));
  return form;
}

// Form values -> API data (empty text becomes null, numbers become numbers)
function toPayload(form) {
  const out = {};
  for (const [key, value] of Object.entries(form)) {
    if (key === 'attributes') continue;
    if (NUMBER_FIELDS.includes(key)) out[key] = value === '' ? null : Number(value);
    else out[key] = value === '' ? null : value.trim();
  }
  out.attributes = Object.fromEntries(ATTRIBUTES.map((a) => [a, Number(form.attributes[a])]));
  // Required counters can't be null
  for (const k of ['appearances', 'goals', 'assists', 'minutesPlayed', 'yellowCards', 'redCards']) out[k] ??= 0;
  return out;
}

// Instant checks in the browser; the API validates again (never trust only the browser)
function validate(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Name is required.';
  if (!f.position) e.position = 'Choose a position.';
  if (!f.age || f.age < 15 || f.age > 50) e.age = 'Age must be between 15 and 50.';
  if (!f.team.trim()) e.team = 'Team is required.';
  if (f.nationality.trim().length < 2) e.nationality = 'Nationality is required.';
  if (f.passAccuracy !== '' && (f.passAccuracy < 0 || f.passAccuracy > 100)) e.passAccuracy = 'Must be between 0 and 100.';
  return e;
}

// After a failed submit, move the cursor (and the screen) to the first field to fix.
// Waits one frame so React has drawn the red error states first.
function focusFirstError() {
  requestAnimationFrame(() => {
    const field = document.querySelector('[aria-invalid="true"]');
    if (field) {
      field.focus();
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

export default function PlayerForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadState, setLoadState] = useState({ loading: isEdit, error: null });

  // Edit mode: load the player and fill the form
  useEffect(() => {
    if (!isEdit) return;
    getPlayer(id)
      .then((p) => { setForm(toForm(p)); setLoadState({ loading: false, error: null }); })
      .catch((err) => setLoadState({ loading: false, error: getErrorMessage(err) }));
  }, [id, isEdit]);

  const field = (name) => ({
    value: form[name],
    error: errors[name],
    onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })),
  });

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) {
      setFormError('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }
    setSaving(true);
    try {
      const saved = isEdit ? await updatePlayer(id, toPayload(form)) : await createPlayer(toPayload(form));
      toast.success(isEdit ? 'Player updated.' : `${saved.name} was added.`);
      navigate(`/players/${saved.id}`);
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
      setSaving(false);
      focusFirstError();
    }
  }

  if (loadState.loading) return <Spinner label="Loading player..." />;
  if (loadState.error) return <ErrorState message={loadState.error} />;

  const backTo = isEdit ? `/players/${id}` : '/players';

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-secondary-600 hover:text-primary-700">
        <ArrowLeft className="size-4" aria-hidden /> Back
      </Link>
      <h1 className="text-2xl font-bold text-secondary-900">{isEdit ? `Edit ${form.name || 'player'}` : 'Add a player'}</h1>
      {formError && <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}

      <Card title="Profile">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField label="Full name" required {...field('name')} />
          <SelectField label="Position" required placeholder="Choose..." options={POSITIONS} {...field('position')} />
          <TextField label="Age" type="number" min="15" max="50" required {...field('age')} />
          <TextField label="Team" required {...field('team')} />
          <TextField label="League" {...field('league')} />
          <TextField label="Nationality" required {...field('nationality')} />
          <TextField label="Height (cm)" type="number" {...field('height')} />
          <TextField label="Weight (kg)" type="number" {...field('weight')} />
          <SelectField label="Preferred foot" placeholder="Not specified" options={['Left', 'Right', 'Both']} {...field('preferredFoot')} />
          <TextField label="Shirt number" type="number" min="1" max="99" {...field('jerseyNumber')} />
        </div>
      </Card>

      <Card title="Season stats">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <TextField label="Appearances" type="number" min="0" {...field('appearances')} />
          <TextField label="Minutes played" type="number" min="0" {...field('minutesPlayed')} />
          <TextField label="Goals" type="number" min="0" {...field('goals')} />
          <TextField label="Assists" type="number" min="0" {...field('assists')} />
          <TextField label="Yellow cards" type="number" min="0" {...field('yellowCards')} />
          <TextField label="Red cards" type="number" min="0" {...field('redCards')} />
          <TextField label="Pass accuracy (%)" type="number" min="0" max="100" step="0.1" {...field('passAccuracy')} />
        </div>
      </Card>

      <Card title="Contract & market">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Weekly salary (€)" type="number" min="0" {...field('contractSalary')} hint="Weekly, in euros." />
          <TextField label="Contract end" type="date" {...field('contractEnd')} />
          <TextField label="Market value (€)" type="number" min="0" {...field('marketValue')}
            hint="Missing from the source data for most players. Add it if you know it; otherwise leave it empty (never 0)." />
        </div>
      </Card>

      <Card title="Attributes (1–100)">
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {ATTRIBUTES.map((a) => (
            <div key={a}>
              <div className="flex justify-between text-sm">
                <label htmlFor={`attr-${a}`} className="font-medium capitalize text-secondary-700">{a}</label>
                <span className="font-semibold tabular-nums">{form.attributes[a]}</span>
              </div>
              <input id={`attr-${a}`} type="range" min="1" max="100" value={form.attributes[a]}
                onChange={(e) => setForm((f) => ({ ...f, attributes: { ...f.attributes, [a]: e.target.value } }))}
                className="mt-2 h-2 w-full cursor-pointer accent-primary-700" />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link to={backTo}><Button variant="secondary" className="w-full">Cancel</Button></Link>
        <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Add player'}</Button>
      </div>
    </form>
  );
}
