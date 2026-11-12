// "Are you sure?" pop-up used before deleting anything.
// Uses the browser's built-in <dialog>: it traps focus and closes with Escape.
import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', loading, onConfirm, onCancel }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg p-0 shadow-xl backdrop:bg-secondary-900/50"
    >
      <div className="p-6">
        <div className="flex gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="size-5 text-red-600" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">{title}</h2>
            <p className="mt-2 text-sm text-secondary-600">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
