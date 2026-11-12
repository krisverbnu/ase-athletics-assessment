// Buttons styled from ASE's guidelines (primary, secondary, danger, ghost)
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  // primary-700 instead of the guideline's #0ea5e9: same palette, but passes WCAG contrast
  primary: 'bg-primary-700 text-white hover:bg-primary-800',
  secondary: 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-secondary-600 hover:bg-secondary-100',
};
const SIZES = { sm: 'h-9 px-3 text-sm', md: 'h-11 px-5 text-sm' }; // 44 px tall = touch friendly

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition duration-150 motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        Icon && <Icon className="size-4" aria-hidden />
      )}
      {children}
    </button>
  );
}
