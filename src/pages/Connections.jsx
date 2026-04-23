import { useEffect, useState } from 'react';
import { stores as storesApi } from '../lib/api';
import { CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';

export default function Connections() {
  const [status, setStatus] = useState(null);
  const [tnForm, setTnForm] = useState({ storeId: '', accessToken: '', storeName: '' });
  const [tnLoading, setTnLoading] = useState(false);
  const [tnMsg, setTnMsg] = useState('');
  const [mlLoading, setMlLoading] = useState(false);

  useEffect(() => {
    storesApi.status().then(r => setStatus(r.data)).catch(() => {});
    // Detecta si viene de MELI OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get('ml') === 'connected') {
      storesApi.status().then(r => setStatus(r.data));
      window.history.replaceState({}, '', '/connections');
    }
  }, []);

  const handleConnectTN = async (e) => {
    e.preventDefault();
    setTnLoading(true);
    setTnMsg('');
    try {
      await storesApi.connectTN(tnForm.storeId, tnForm.accessToken, tnForm.storeName);
      setTnMsg('success');
      const r = await storesApi.status();
      setStatus(r.data);
    } catch (err) {
      setTnMsg('error:' + (err.response?.data?.error || 'Error al conectar'));
    } finally {
      setTnLoading(false);
    }
  };

  const handleConnectML = async () => {
    setMlLoading(true);
    try {
      const { data } = await storesApi.getMlAuthUrl();
      // Agrega el userId al state de OAuth
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      const url = data.url + `&state=${userId}`;
      window.location.href = url;
    } catch (err) {
      alert('Error al obtener URL de autorización: ' + (err.response?.data?.error || err.message));
      setMlLoading(false);
    }
  };

  const tnConnected = !!status?.tiendanube;
  const mlConnected = !!status?.mercadolibre;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Conexiones</h2>
        <p>Conectá tus tiendas para empezar a sincronizar</p>
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
        {/* TIENDANUBE */}
        <div className="card">
          <div className="flex-between mb-2" style={{ marginBottom: 16 }}>
            <div className="flex gap-2">
              <span style={{ fontSize: 20 }}>🛍️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Tiendanube</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Fuente de verdad del stock</div>
              </div>
            </div>
            {tnConnected
              ? <span className="badge badge-green flex gap-2"><CheckCircle size={12} /> Conectada</span>
              : <span className="badge badge-red">Sin conectar</span>}
          </div>

          {tnConnected ? (
            <div>
              <div className="alert alert-success" style={{ marginBottom: 12 }}>
                ✅ Tiendanube conectada: <strong>{status.tiendanube.store_name}</strong>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                Esta es tu fuente de verdad. El stock de MELI siempre se actualizará en base a Tiendanube.
              </p>
            </div>
          ) : (
            <>
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                <strong>¿Cómo obtener las credenciales?</strong><br />
                1. Entrá a tu panel de Tiendanube<br />
                2. Andá a <strong>Mis aplicaciones → Crear aplicación</strong><br />
                3. Seleccioná <strong>"Aplicación privada"</strong><br />
                4. Copiá el <strong>Store ID</strong> y el <strong>Access Token</strong>
              </div>

              {tnMsg === 'success' && <div className="alert alert-success">¡Tiendanube conectada exitosamente!</div>}
              {tnMsg.startsWith('error:') && <div className="alert alert-danger">{tnMsg.replace('error:', '')}</div>}

              <form onSubmit={handleConnectTN}>
                <div className="form-group">
                  <label className="form-label">Nombre de tu tienda</label>
                  <input className="form-input" type="text" placeholder="Mi Tienda"
                    value={tnForm.storeName}
                    onChange={e => setTnForm(f => ({ ...f, storeName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Store ID <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input className="form-input" type="text" placeholder="Ej: 1234567" required
                    value={tnForm.storeId}
                    onChange={e => setTnForm(f => ({ ...f, storeId: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Access Token <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input className="form-input" type="password" placeholder="tu_access_token" required
                    value={tnForm.accessToken}
                    onChange={e => setTnForm(f => ({ ...f, accessToken: e.target.value }))} />
                </div>
                <button className="btn btn-primary w-full" type="submit" disabled={tnLoading}>
                  {tnLoading ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white', width: 16, height: 16 }} /> Conectando...</> : 'Conectar Tiendanube'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* MERCADO LIBRE */}
        <div className="card">
          <div className="flex-between mb-2" style={{ marginBottom: 16 }}>
            <div className="flex gap-2">
              <span style={{ fontSize: 20 }}>🛒</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Mercado Libre</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Canal secundario sincronizado</div>
              </div>
            </div>
            {mlConnected
              ? <span className="badge badge-green flex gap-2"><CheckCircle size={12} /> Conectado</span>
              : <span className="badge badge-red">Sin conectar</span>}
          </div>

          {mlConnected ? (
            <div>
              <div className="alert alert-success" style={{ marginBottom: 12 }}>
                ✅ Mercado Libre conectado. El stock se sincronizará automáticamente.
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                El stock de MELI siempre reflejará el de Tiendanube. Las ventas en MELI también descuentan en TN.
              </p>
            </div>
          ) : (
            <>
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                <strong>¿Cómo conectar Mercado Libre?</strong><br />
                1. Hacé clic en el botón de abajo<br />
                2. Te va a redirigir a Mercado Libre para autorizar<br />
                3. Aceptá los permisos y volvé acá<br /><br />
                <strong>Requisito previo:</strong> Necesitás una app en{' '}
                <a href="https://developers.mercadolibre.com.ar" target="_blank" rel="noreferrer"
                   style={{ color: 'var(--brand-dark)' }}>
                  developers.mercadolibre.com.ar <ExternalLink size={11} style={{ verticalAlign: 'middle' }} />
                </a>{' '}
                con la URL de callback configurada.
              </div>

              <div className="alert alert-warning" style={{ marginBottom: 16, fontSize: 12.5 }}>
                <AlertCircle size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                En la app de MELI, configurá como Redirect URI:<br />
                <code style={{ display: 'block', marginTop: 4, fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: 4 }}>
                  {window.location.origin}/api/stores/mercadolibre/callback
                </code>
              </div>

              <button className="btn btn-primary w-full" onClick={handleConnectML} disabled={mlLoading}>
                {mlLoading ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white', width: 16, height: 16 }} /> Redirigiendo...</> : '🔐 Conectar con Mercado Libre'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info de reglas */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-title">Cómo funciona la sincronización</div>
        <div className="grid-3" style={{ gap: 16 }}>
          {[
            { icon: '📌', title: 'TN es la fuente de verdad', desc: 'El stock de Tiendanube siempre manda. MELI se actualiza en base a TN, nunca al revés.' },
            { icon: '🔄', title: 'Ventas en MELI', desc: 'Cuando cae una venta en MELI, el sistema descuenta el stock en TN automáticamente.' },
            { icon: '📦', title: 'Restock en TN', desc: 'Si cambiás el stock manualmente en TN (restock), MELI se actualiza solo. Si cambiás en MELI, se ignora.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ padding: '14px 16px', background: 'var(--surface2)', borderRadius: 8 }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
