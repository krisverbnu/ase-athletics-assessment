// Loading, error and empty states, so no page ever shows a blank screen
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import Button from './Button';

export function Spinner({ label = 'Loading...' }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-secondary-500">
      <Loader2 className="size-8 animate-spin text-primary-600" aria-hidden />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center">
      <AlertTriangle className="size-8 text-red-600" aria-hidden />
      <p className="max-w-md text-sm text-red-800">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <Inbox className="size-8 text-secondary-400" aria-hidden />
      <p className="font-semibold text-secondary-800">{title}</p>
      {message && <p className="max-w-md text-sm text-secondary-500">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
