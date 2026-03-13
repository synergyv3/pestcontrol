import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0F172A' }}>
      {/* Left panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <span style={{ fontSize: 40 }}>🐛</span>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>PestControl Pro</div>
                <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Field Service Management</div>
              </div>
            </div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 700, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>Welcome back</h1>
            <p style={{ color: '#64748B', fontSize: 15 }}>Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label" style={{ color: '#94A3B8' }}>Email Address</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
                style={{ background: '#1E293B', borderColor: '#334155', color: '#fff' }}
              />
            </div>
            <div className="form-group">
              <label className="label" style={{ color: '#94A3B8' }}>Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ background: '#1E293B', borderColor: '#334155', color: '#fff' }}
              />
            </div>

            {error && (
              <div style={{ background: '#450A0A', border: '1px solid #991B1B', color: '#FCA5A5', padding: '10px 14px', borderRadius: 6, fontSize: 14, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px 24px', fontSize: 15 }}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 32, padding: '16px', background: '#1E293B', borderRadius: 8, border: '1px solid #334155' }}>
            <p style={{ color: '#64748B', fontSize: 12, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Demo Accounts</p>
            {[
              { role: 'Admin', email: 'admin@pestcontrol.local', pass: 'Admin123!' },
              { role: 'Manager', email: 'manager@pestcontrol.local', pass: 'Manager123!' },
              { role: 'Tech', email: 'james@pestcontrol.local', pass: 'Tech123!' },
            ].map(a => (
              <button key={a.role} onClick={() => { setEmail(a.email); setPassword(a.pass); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#94A3B8', fontSize: 12, cursor: 'pointer', padding: '3px 0', fontFamily: "'Barlow', sans-serif" }}>
                <span style={{ color: '#059669', fontWeight: 600 }}>{a.role}:</span> {a.email}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - decorative */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #065F46 0%, #047857 40%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, position: 'relative', overflow: 'hidden' }} className="login-right">
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 80, marginBottom: 24 }}>🏠🐛✓</div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.02em' }}>Run your routes.<br />Own your data.</h2>
          <p style={{ fontSize: 16, opacity: 0.8, maxWidth: 340, lineHeight: 1.6 }}>Schedule jobs, manage customers, and track invoices — all from one simple platform built for pest control professionals.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
            {['📅 Scheduling', '🗂 CRM', '💳 Invoicing', '📊 Reports'].map(f => (
              <div key={f} style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{f}</div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 768px) { .login-right { display: none !important; } }`}</style>
    </div>
  );
}
