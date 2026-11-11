// Contract status seen from two dates side by side: the date of the data snapshot
// and today. Showing both (instead of a switch) means every number says which date it uses.
import { CalendarClock } from 'lucide-react';
import { formatDate } from '../../utils/format';

export default function ContractsTile({ status }) {
  const rows = [
    { label: 'Data date', ...status.dataDate },
    { label: 'Today', ...status.today },
  ];
  return (
    <div className="rounded-lg border border-secondary-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-secondary-500">Contracts</p>
        <CalendarClock className="size-5 text-secondary-400" aria-hidden />
      </div>
      <table className="mt-2 w-full text-sm">
        <caption className="sr-only">Expired contracts and contracts ending within 12 months, from the data date and from today</caption>
        <thead>
          <tr className="align-bottom text-xs text-secondary-500">
            <th scope="col" className="pb-1 text-left font-normal">Counting from</th>
            <th scope="col" className="pb-1 pl-3 text-right font-normal">Expired</th>
            <th scope="col" className="pb-1 pl-3 text-right font-normal"><span aria-hidden>Next 12&nbsp;mo</span><span className="sr-only">Ending within the next 12 months</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-secondary-100">
              <th scope="row" className="whitespace-nowrap py-1.5 text-left font-normal">
                <span className="block font-medium text-secondary-900">{r.label}</span>
                <span className="block text-xs text-secondary-500">{formatDate(r.date)}</span>
              </th>
              <td className="py-1.5 text-right text-lg font-bold tabular-nums text-secondary-900">{r.expired}</td>
              <td className="py-1.5 pl-3 text-right text-lg font-bold tabular-nums text-secondary-900">{r.endingWithin12Months}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
