// A slider with two handles (min and max), e.g. "age 20 to 28".
// Two ordinary range inputs are stacked on top of each other; only their handles catch clicks.
// The value is only sent when you let go of a handle, so dragging doesn't fire dozens of API calls.
import { useState } from 'react';

const thumb = 'pointer-events-none absolute inset-x-0 top-0 h-2 w-full appearance-none bg-transparent '
  + '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:cursor-pointer '
  + '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 '
  + '[&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary-700 [&::-webkit-slider-thumb]:shadow '
  + '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:cursor-pointer '
  + '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary-700';

export default function RangeSlider({ label, min, max, step = 1, value, onCommit, format = (v) => v, hint }) {
  // value = [low, high], where undefined means "no limit on this side"
  const current = [value[0] ?? min, value[1] ?? max];
  const [draft, setDraft] = useState(null); // the handles' position while dragging
  const [low, high] = draft ?? current;

  const commit = () => {
    if (!draft) return;
    // Sending undefined for an edge at its limit keeps the URL clean (no ageMin=19)
    onCommit([draft[0] <= min ? undefined : draft[0], draft[1] >= max ? undefined : draft[1]]);
    setDraft(null);
  };

  const pct = (v) => (max === min ? 0 : ((v - min) / (max - min)) * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-secondary-700">{label}</span>
        <span className="tabular-nums text-secondary-600">{format(low)} – {format(high)}</span>
      </div>
      <div className="relative mt-2 h-2" onPointerUp={commit} onKeyUp={commit} onBlur={commit}>
        <div className="absolute inset-0 rounded-full bg-secondary-200" />
        <div className="absolute inset-y-0 rounded-full bg-primary-500" style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }} />
        <input type="range" min={min} max={max} step={step} value={low} aria-label={`${label}: minimum`} className={thumb}
          onChange={(e) => setDraft([Math.min(Number(e.target.value), high), high])} />
        <input type="range" min={min} max={max} step={step} value={high} aria-label={`${label}: maximum`} className={thumb}
          onChange={(e) => setDraft([low, Math.max(Number(e.target.value), low)])} />
      </div>
      {hint && <p className="mt-1 text-xs text-secondary-500">{hint}</p>}
    </div>
  );
}
