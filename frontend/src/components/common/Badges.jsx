import { initials, POSITION_STYLES, RECOMMENDATIONS } from '../../utils/format';

export function PositionBadge({ position }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${POSITION_STYLES[position] || 'bg-secondary-100 text-secondary-700'}`}>
      {position}
    </span>
  );
}

// Placeholder photo: the player's initials in a circle (the brief accepts placeholders)
export function Avatar({ name, size = 'md' }) {
  const sizes = { sm: 'size-9 text-xs', md: 'size-12 text-sm', lg: 'size-20 text-2xl' };
  return (
    <div aria-hidden className={`flex shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-800 ${sizes[size]}`}>
      {initials(name)}
    </div>
  );
}

export function RecommendationBadge({ value }) {
  const rec = RECOMMENDATIONS[value];
  if (!rec) return null;
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${rec.style}`}>{rec.label}</span>;
}
