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
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

// "2027-06-30T00:00:00.000Z" -> "2027-06-30" (for <input type="date">)
export const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

// One colour per position, used for badges (from the guidelines' accent colours)
export const POSITION_STYLES = {
  Goalkeeper: 'bg-amber-100 text-amber-800',
  Defender: 'bg-emerald-100 text-emerald-800',
  Midfielder: 'bg-primary-100 text-primary-800',
  Forward: 'bg-rose-100 text-rose-800',
};

export const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

// Per-90 output: goals + assists for every 90 minutes played
export const per90 = (count, minutes) => (minutes > 0 ? ((count / minutes) * 90).toFixed(2) : '0.00');
