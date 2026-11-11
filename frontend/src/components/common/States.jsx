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

// icon: any lucide icon that hints at what's missing (defaults to an empty tray)
export function EmptyState({ title, message, action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <span className="mb-1 flex size-14 items-center justify-center rounded-full bg-primary-50 ring-8 ring-primary-50/50">
        <Icon className="size-6 text-primary-600" aria-hidden />
      </span>
      <p className="font-semibold text-secondary-800">{title}</p>
      {message && <p className="max-w-md text-sm text-secondary-500">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ---- Skeletons: grey shapes where content is about to appear ----
// They feel faster than a spinner because the page already has its shape.
// motion-safe: the pulse is switched off for people who ask their device for less motion.

// round: circles for avatars (two rounding classes on one element would fight, so it's a prop)
export function Skeleton({ className = '', round = false }) {
  return <div className={`${round ? 'rounded-full' : 'rounded-md'} bg-secondary-200/70 motion-safe:animate-pulse ${className}`} />;
}

// Wraps a skeleton so screen readers hear "Loading..." instead of nothing
function Loading({ label, children }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden>{children}</div>
    </div>
  );
}

const box = 'rounded-lg border border-secondary-200 bg-white p-4 shadow-sm sm:p-6';

// Rows of a list or table: avatar, two lines of text, a value on the right
export function ListSkeleton({ rows = 8, label = 'Loading...' }) {
  return (
    <Loading label={label}>
      <ul className="divide-y divide-secondary-100">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center gap-4 px-4 py-4">
            <Skeleton round className="size-10 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton round className="hidden h-5 w-20 sm:block" />
            <Skeleton className="h-4 w-12" />
          </li>
        ))}
      </ul>
    </Loading>
  );
}

// Dashboard: four stat tiles and a grid of chart cards
export function DashboardSkeleton() {
  return (
    <Loading label="Loading the dashboard...">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={`${box} space-y-3`}>
              <Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-28" /><Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className={`${box} space-y-3`}>
              <Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-64" /><Skeleton className="mt-4 h-56 w-full" />
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

// A detail page: header card, then two columns of content cards
export function PageSkeleton({ label = 'Loading...' }) {
  return (
    <Loading label={label}>
      <div className="space-y-6">
        <Skeleton className="h-4 w-24" />
        <div className={`${box} flex items-center gap-5`}>
          <Skeleton round className="size-20 shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-1/2 max-w-xs" /><Skeleton className="h-4 w-2/3 max-w-sm" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className={`${box} space-y-4`}>
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 5 }, (_, j) => <Skeleton key={j} className="h-4 w-full" />)}
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

// Report cards in a two-column grid
export function CardGridSkeleton({ count = 4, label = 'Loading...' }) {
  return (
    <Loading label={label}>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={`${box} space-y-3`}>
            <div className="flex justify-between"><Skeleton className="h-5 w-40" /><Skeleton className="h-7 w-12" /></div>
            <Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>
    </Loading>
  );
}
