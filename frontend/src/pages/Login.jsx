import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/common/Button';
import { TextField } from '../components/common/Field';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const goTo = location.state?.from?.pathname || '/dashboard';
  if (user) return <Navigate to={goTo} replace />;

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser reloading the page
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate(goTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your scouting workspace."
      footer={<>No account yet? <Link to="/register" className="font-semibold text-white underline">Create one</Link></>}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={update('email')} required />
        <TextField label="Password" type="password" autoComplete="current-password" value={form.password} onChange={update('password')} required />
        <Button type="submit" loading={loading} className="mt-2 w-full">Log in</Button>
        <button type="button" onClick={() => setForm({ email: 'demo@ase-athletics.com', password: 'demo123' })}
          className="text-sm text-primary-700 underline hover:text-primary-900">
          Use the demo account
        </button>
      </form>
    </AuthLayout>
  );
}
