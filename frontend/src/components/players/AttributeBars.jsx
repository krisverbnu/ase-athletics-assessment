// Ratings out of 100 as progress bars. Goalkeepers get their own attributes.
const OUTFIELD = [
  'pace',
  'shooting',
  'passing',
  'dribbling',
  'defending',
  'physical',
  'finishing',
  'crossing',
  'longShots',
  'positioning',
];
const KEEPER = ['diving', 'handling', 'kicking', 'reflexes', 'positioning', 'passing', 'physical', 'pace'];
const LABELS = { longShots: 'Long shots' };

const label = (key) => LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);

// Colour by quality: 80+ excellent, 65+ good, below that average
const barColour = (v) => (v >= 80 ? 'bg-emerald-500' : v >= 65 ? 'bg-primary-500' : 'bg-amber-500');

export default function AttributeBars({ attributes, isKeeper }) {
  if (!attributes) return <p className="text-sm text-secondary-500">No attribute ratings recorded.</p>;
  const keys = (isKeeper ? KEEPER : OUTFIELD).filter((k) => attributes[k] != null);
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {keys.map((k) => (
        <div key={k}>
          <div className="flex justify-between text-sm">
            <dt className="text-secondary-600">{label(k)}</dt>
            <dd className="font-semibold tabular-nums text-secondary-900">{attributes[k]}</dd>
          </div>
          <div className="mt-1 h-2 rounded-full bg-secondary-100" role="presentation">
            <div className={`h-2 rounded-full ${barColour(attributes[k])}`} style={{ width: `${attributes[k]}%` }} />
          </div>
        </div>
      ))}
    </dl>
  );
}
