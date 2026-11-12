// A dropdown with checkboxes and a search box, for picking several teams or nationalities.
import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export default function MultiSelect({ label, options, selected, onChange, placeholder = 'Any' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const id = useId();

  // Close when clicking anywhere outside the dropdown, or pressing Escape
  useEffect(() => {
    if (!open) return;
    const closeOnClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const closeOnEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const toggle = (value) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  const visible = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));
  const summary =
    selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      <span id={`${id}-label`} className="text-sm font-medium text-secondary-700">
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${id}-label`}
          className="flex w-full items-center justify-between rounded-md border border-secondary-300 bg-white px-4 py-3 text-left text-sm hover:border-secondary-400 focus:border-primary-500 focus:outline-none"
        >
          <span className={selected.length ? 'text-secondary-900' : 'text-secondary-400'}>{summary}</span>
          <ChevronDown
            className={`size-4 text-secondary-500 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full rounded-md border border-secondary-200 bg-white shadow-lg">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              aria-label={`Search ${label}`}
              className="w-full border-b border-secondary-200 px-4 py-2.5 text-sm focus:outline-none"
              autoFocus
            />
            <ul role="listbox" aria-multiselectable="true" className="max-h-60 overflow-y-auto py-1">
              {visible.length === 0 && <li className="px-4 py-2 text-sm text-secondary-500">No matches</li>}
              {visible.map((option) => {
                const isOn = selected.includes(option);
                return (
                  <li key={option} role="option" aria-selected={isOn}>
                    <button
                      type="button"
                      onClick={() => toggle(option)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-secondary-50"
                    >
                      <span
                        className={`flex size-4 items-center justify-center rounded border ${isOn ? 'border-primary-700 bg-primary-700' : 'border-secondary-300'}`}
                      >
                        {isOn && <Check className="size-3 text-white" aria-hidden />}
                      </span>
                      {option}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
