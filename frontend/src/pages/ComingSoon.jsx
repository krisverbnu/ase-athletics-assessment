// Placeholder for pages built in the next steps
import Card from '../components/common/Card';

export default function ComingSoon({ title }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-secondary-900">{title}</h1>
      <Card><p className="text-sm text-secondary-600">This section is being built next.</p></Card>
    </div>
  );
}
