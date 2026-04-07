import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <svg viewBox="0 0 90 20" fill="none" width="90" height="20">
            <rect width="28" height="20" rx="4" fill="#FF0000"/>
            <polygon points="11,5 21,10 11,15" fill="white"/>
            <text x="32" y="15" fill="white" fontSize="14" fontWeight="700" fontFamily="Roboto,sans-serif">YouTube</text>
          </svg>
        </div>
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">to continue to YouTube Clone</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input id="email" className="form-control" type="email" required value={form.email}
              onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input id="password" className="form-control" type="password" required value={form.password}
              onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="••••••••" />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button id="signin-btn" type="submit" className="btn btn-accent auth-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-demo-hint">
          <p>Demo: <strong>alex@demo.com</strong> / <strong>demo123</strong></p>
        </div>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Create account</Link>
        </p>
      </div>
    </div>
  );
}
