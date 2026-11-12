// Small helpers to show numbers and dates the same way everywhere

// 65000000 -> "€65M", 850000 -> "€850K"
export function formatMoney(value) {
  if (value === null || value === undefined) return 'Not available';
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `€${Math.round(value / 1_000)}K`;
  return `€${value}`;
}

// "2027-06-30T00:00:00.000Z" -> "30 Jun 2027"
export function formatDate(value) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// "2027-06-30T00:00:00.000Z" -> "2027-06-30" (for <input type="date">)
export const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

// One colour per position, from ASE's chart palette. The same colour is used for the badge
// and in every chart, so "violet = Forward" everywhere. Red is left out on purpose: it's
// reserved for warnings. (Checked for colour-blind separation with a palette validator.)
export const POSITION_COLORS = {
  Goalkeeper: '#f59e0b',
  Defender: '#10b981',
  Midfielder: '#0ea5e9',
  Forward: '#8b5cf6',
};
export const POSITION_STYLES = {
  Goalkeeper: 'bg-amber-100 text-amber-800',
  Defender: 'bg-emerald-100 text-emerald-800',
  Midfielder: 'bg-primary-100 text-primary-800',
  Forward: 'bg-violet-100 text-violet-800',
};

// ASE's chart colours (ui_guidelines.json), in their order, minus red (kept for warnings)
export const SERIES_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#f97316'];

export const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

// Per-90 output: goals + assists for every 90 minutes played
export const per90 = (count, minutes) => (minutes > 0 ? ((count / minutes) * 90).toFixed(2) : '0.00');

// Scouting recommendations: traffic-light colours, always shown with the word too
export const RECOMMENDATIONS = {
  SIGN: { label: 'Sign', style: 'bg-emerald-100 text-emerald-800' },
  MONITOR: { label: 'Monitor', style: 'bg-amber-100 text-amber-800' },
  PASS: { label: 'Pass', style: 'bg-red-100 text-red-800' },
};

// ASE's scale from scout_report.json: what each 1-10 rating means
export function ratingLabel(value) {
  if (value <= 2) return 'Very poor';
  if (value <= 4) return 'Poor';
  if (value <= 6) return 'Average';
  if (value <= 8) return 'Good';
  return 'Excellent';
}

// The six attributes every player has (outfield and goalkeepers)
export const CORE_ATTRIBUTES = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
