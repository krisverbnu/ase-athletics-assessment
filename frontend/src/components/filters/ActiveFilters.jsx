// The row of "chips" showing which filters are on, each with an × to remove it,
// plus "Clear all". This is the brief's "active filter indicators" and "quick clear".
import { X } from 'lucide-react';
import { formatMoney } from '../../utils/format';

const RANGE_LABELS = {
  age: { name: 'Age', format: (v) => v },
  value: { name: 'Value', format: formatMoney },
  goals: { name: 'Goals', format: (v) => v },
  assists: { name: 'Assists', format: (v) => v },
};

function describeRange(key, min, max) {
  const { name, format } = RANGE_LABELS[key];
  if (min !== undefined && max !== undefined) return `${name}: ${format(min)}–${format(max)}`;
  if (min !== undefined) return `${name}: ${format(min)}+`;
  return `${name}: up to ${format(max)}`;
}

export default function ActiveFilters({ filters, onChange, onClearAll }) {
  const chips = [];

  for (const key of ['position', 'team', 'nationality']) {
    for (const value of filters[key]) {
      chips.push({ id: `${key}-${value}`, label: value, remove: () => onChange({ ...filters, [key]: filters[key].filter((v) => v !== value) }) });
    }
  }
  for (const key of Object.keys(RANGE_LABELS)) {
    const min = filters[`${key}Min`];
    const max = filters[`${key}Max`];
    if (min !== undefined || max !== undefined) {
      chips.push({ id: key, label: describeRange(key, min, max), remove: () => onChange({ ...filters, [`${key}Min`]: undefined, [`${key}Max`]: undefined }) });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <span key={chip.id} className="inline-flex items-center gap-1 rounded-full bg-primary-100 py-1 pl-3 pr-1 text-sm font-medium text-primary-900">
          {chip.label}
          <button type="button" onClick={chip.remove} aria-label={`Remove filter ${chip.label}`}
            className="rounded-full p-1 hover:bg-primary-200"><X className="size-3.5" aria-hidden /></button>
        </span>
      ))}
      <button type="button" onClick={onClearAll} className="ml-1 text-sm font-medium text-primary-700 underline hover:text-primary-900">
        Clear all
      </button>
    </div>
  );
}
