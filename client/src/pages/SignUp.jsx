import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function SignUp() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try again.');
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
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">to continue to YouTube Clone</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input className="form-control" required value={form.name}
              onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Your name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" required value={form.email}
              onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" required minLength={6} value={form.password}
              onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="Min. 6 characters" />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn btn-accent auth-btn" disabled={loading}>
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
