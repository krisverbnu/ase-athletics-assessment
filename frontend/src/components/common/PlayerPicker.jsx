// Search box that suggests players as you type (autocomplete). Used to add players to a
// comparison and to choose the player in a scouting report.
import { useEffect, useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { searchPlayers } from '../../services/playerService';
import { PositionBadge } from './Badges';
import Highlight from './Highlight';

export default function PlayerPicker({
  onSelect,
  excludeIds = [],
  label = 'Find a player',
  placeholder = 'Type a name...',
  disabled,
  error,
}) {
  const [text, setText] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0); // which suggestion the arrow keys are on
  const ref = useRef(null);
  const id = useId();

  // Debounced search: ask the API 250 ms after typing stops
  useEffect(() => {
    const q = text.trim();
    if (!q) return undefined;
    const timer = setTimeout(() => {
      searchPlayers(q, 8)
        .then((found) => {
          setResults(found.filter((p) => !excludeIds.includes(p.id)));
          setActive(0);
          setOpen(true);
        })
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close when clicking outside
  useEffect(() => {
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const choose = (player) => {
    onSelect(player);
    setText('');
    setResults([]);
    setOpen(false);
  };

  // Keyboard support: arrows move, Enter picks, Escape closes
  const onKeyDown = (e) => {
    if (!open || !results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[active]);
    }
    if (e.key === 'Escape') setOpen(false);
  };

  const showList = open && text.trim();

  return (
    <div className="relative flex flex-col gap-1.5" ref={ref}>
      <label htmlFor={id} className="text-sm font-medium text-secondary-700">
        {label}
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-secondary-400"
          aria-hidden
        />
        <input
          id={id}
          type="text"
          value={text}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            setText(e.target.value);
            if (!e.target.value.trim()) {
              setResults([]);
              setOpen(false);
            }
          }}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={Boolean(showList)}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-invalid={!!error}
          className={`h-12 w-full rounded-md border bg-white pl-12 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-3 focus:ring-primary-500/15 disabled:bg-secondary-100 ${error ? 'border-red-500' : 'border-secondary-300'}`}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {showList && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute top-full z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-secondary-200 bg-white py-1 shadow-lg"
        >
          {results.length === 0 && <li className="px-4 py-3 text-sm text-secondary-500">No players found</li>}
          {results.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(p)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm ${i === active ? 'bg-primary-50' : ''}`}
              >
                <span>
                  <span className="font-semibold text-secondary-900">
                    <Highlight text={p.name} query={text.trim()} />
                  </span>
                  <span className="block text-xs text-secondary-500">
                    {p.team} · {p.nationality}
                  </span>
                </span>
                <PositionBadge position={p.position} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
