import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/common/Button';
import { TextField } from '../components/common/Field';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../services/api';

// Checked in the browser first for instant feedback; the API checks again
function validate({ name, email, password }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Please enter your name.';
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Please enter a valid email address.';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  return errors;
}

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start scouting in under a minute."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-white underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {formError && (
          <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </p>
        )}
        <TextField
          label="Full name"
          autoComplete="name"
          value={form.name}
          onChange={update('name')}
          error={errors.name}
          required
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
          required
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          hint="At least 8 characters."
          required
        />
        <Button type="submit" loading={loading} className="mt-2 w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
