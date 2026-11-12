import { Link } from 'react-router';
import Button from '../components/common/Button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-6xl font-bold text-primary-700">404</p>
      <h1 className="text-xl font-semibold text-secondary-900">This page is offside</h1>
      <p className="text-sm text-secondary-500">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard">
        <Button>Back to the dashboard</Button>
      </Link>
    </div>
  );
}
