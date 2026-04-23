import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.email, form.password, form.name);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: 16
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, background: 'var(--brand)',
            borderRadius: 14, marginBottom: 14
          }}>
            <span style={{ fontSize: 24 }}>⚡</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>SyncStock</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            Sincronizá tu stock entre Tiendanube y Mercado Libre
          </p>
        </div>

        <div className="card" style={{ padding: '28px 28px' }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'var(--surface2)',
            borderRadius: 8, padding: 3, marginBottom: 22
          }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer',
                  borderRadius: 6, fontSize: 13.5, fontWeight: 500,
                  background: mode === m ? 'white' : 'transparent',
                  color: mode === m ? 'var(--text)' : 'var(--text2)',
                  boxShadow: mode === m ? 'var(--shadow)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Tu nombre"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="tu@email.com"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                className="form-input"
                type="password"
                placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : '••••••••'}
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ marginTop: 4, padding: '10px 0', fontSize: 15 }}
            >
              {loading ? <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : null}
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
