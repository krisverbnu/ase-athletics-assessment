// Form inputs with a label and an error message underneath.
// The label is linked to the input (htmlFor/id) so clicking it focuses the input
// and screen readers read it out.
import { useId } from 'react';

const base = 'w-full rounded-md border bg-white px-4 py-3 text-sm text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-3 focus:ring-primary-500/15';

function Wrapper({ id, label, error, hint, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-secondary-700">
        {label}{required && <span className="text-red-600" aria-hidden> *</span>}
      </label>
      {children}
      {error ? <p id={`${id}-error`} className="text-sm text-red-600">{error}</p>
        : hint && <p className="text-xs text-secondary-500">{hint}</p>}
    </div>
  );
}

export function TextField({ label, error, hint, required, className = '', ...props }) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} required={required}>
      <input id={id} required={required} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
        className={`${base} ${error ? 'border-red-500' : 'border-secondary-300'} ${className}`} {...props} />
    </Wrapper>
  );
}

export function SelectField({ label, error, hint, required, options, placeholder, ...props }) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} required={required}>
      <select id={id} required={required} aria-invalid={!!error}
        className={`${base} ${error ? 'border-red-500' : 'border-secondary-300'}`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </Wrapper>
  );
}
