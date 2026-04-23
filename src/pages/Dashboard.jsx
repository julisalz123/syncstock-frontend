import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { products as productsApi, orders as ordersApi, stores as storesApi } from '../lib/api';
import { ArrowLeftRight, ShoppingBag, Package, AlertTriangle, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [storeStatus, setStoreStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, m, o, st] = await Promise.allSettled([
          ordersApi.stats(),
          productsApi.getMappings(),
          ordersApi.list({ limit: 5 }),
          storesApi.status(),
        ]);
        if (s.status === 'fulfilled') setStats(s.value.data);
        if (m.status === 'fulfilled') setMappings(m.value.data);
        if (o.status === 'fulfilled') setRecentOrders(o.value.data.orders || []);
        if (st.status === 'fulfilled') setStoreStatus(st.value.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const { data } = await productsApi.syncAll();
      setSyncMsg(`✅ Sincronización completa: ${data.synced} productos actualizados${data.errors?.length ? `, ${data.errors.length} errores` : ''}`);
    } catch (err) {
      setSyncMsg('❌ Error al sincronizar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const tnConnected = !!storeStatus?.tiendanube;
  const mlConnected = !!storeStatus?.mercadolibre;
  const activeMappings = mappings.filter(m => m.is_active).length;
  const lowStockCount = mappings.filter(m => m.current_stock !== null && m.current_stock <= 3).length;

  const totalOrders = stats?.reduce((a, s) => a + parseInt(s.total_orders), 0) || 0;
  const totalRevenue = stats?.reduce((a, s) => a + (parseFloat(s.total_revenue) || 0), 0) || 0;

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 60 }}>
      <span className="spinner" /> Cargando dashboard...
    </div>
  );

  return (
    <div className="page">
      <div className="flex-between page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Resumen de tu sincronización de stock</p>
        </div>
        <button className="btn btn-primary" onClick={handleSyncAll} disabled={syncing || !tnConnected || !mlConnected}>
          <RefreshCw size={15} className={syncing ? 'spin' : ''} />
          {syncing ? 'Sincronizando...' : 'Sincronizar todo'}
        </button>
      </div>

      {syncMsg && (
        <div className={`alert ${syncMsg.startsWith('✅') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 20 }}>
          {syncMsg}
        </div>
      )}

      {/* Estado de conexiones */}
      {(!tnConnected || !mlConnected) && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <strong>Configuración pendiente:</strong>{' '}
          {!tnConnected && 'Falta conectar Tiendanube. '}
          {!mlConnected && 'Falta conectar Mercado Libre. '}
          <Link to="/connections" style={{ color: 'inherit', fontWeight: 600 }}>Ir a Conexiones →</Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Productos mapeados</div>
          <div className="stat-value" style={{ color: 'var(--brand)' }}>{activeMappings}</div>
          <div className="stat-sub">con sincronización activa</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total órdenes</div>
          <div className="stat-value">{totalOrders}</div>
          <div className="stat-sub">en ambos canales</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue total</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            ${totalRevenue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </div>
          <div className="stat-sub">suma ambos canales</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Stock bajo</div>
          <div className="stat-value" style={{ color: lowStockCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {lowStockCount}
          </div>
          <div className="stat-sub">productos con ≤ 3 unidades</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Estado de canales */}
        <div className="card">
          <div className="card-title">Estado de conexiones</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="flex-between" style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8 }}>
              <div className="flex gap-2">
                <span className={`dot dot-${tnConnected ? 'green' : 'red'}`} />
                <span style={{ fontWeight: 500 }}>Tiendanube</span>
              </div>
              <span className={`badge ${tnConnected ? 'badge-green' : 'badge-red'}`}>
                {tnConnected ? 'Conectada' : 'Sin conectar'}
              </span>
            </div>
            <div className="flex-between" style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8 }}>
              <div className="flex gap-2">
                <span className={`dot dot-${mlConnected ? 'green' : 'red'}`} />
                <span style={{ fontWeight: 500 }}>Mercado Libre</span>
              </div>
              <span className={`badge ${mlConnected ? 'badge-green' : 'badge-red'}`}>
                {mlConnected ? 'Conectado' : 'Sin conectar'}
              </span>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Link to="/connections" className="btn btn-secondary btn-sm">
              Gestionar conexiones
            </Link>
          </div>
        </div>

        {/* Alertas de stock bajo */}
        <div className="card">
          <div className="card-title flex gap-2">
            <AlertTriangle size={16} color="var(--warning)" />
            Stock bajo (≤ 3 unidades)
          </div>
          {lowStockCount === 0 ? (
            <div style={{ color: 'var(--text2)', fontSize: 13.5, padding: '8px 0' }}>
              ✅ Todos los productos tienen stock suficiente
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mappings.filter(m => m.is_active && m.current_stock !== null && m.current_stock <= 3).slice(0, 5).map(m => (
                <div key={m.id} className="flex-between" style={{ fontSize: 13 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                    {m.tn_product_name || m.sku}
                  </span>
                  <span className={`badge ${m.current_stock === 0 ? 'badge-red' : 'badge-yellow'}`}>
                    {m.current_stock} u.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Órdenes recientes */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="flex-between mb-2">
          <div className="card-title" style={{ marginBottom: 0 }}>Órdenes recientes</div>
          <Link to="/orders" className="btn btn-secondary btn-sm">Ver todas</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="empty" style={{ padding: '24px 0' }}>
            <p>No hay órdenes todavía</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Canal</th>
                  <th>Orden #</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <span className={`badge ${order.platform === 'tiendanube' ? 'badge-blue' : 'badge-yellow'}`}>
                        {order.platform === 'tiendanube' ? 'TN' : 'MELI'}
                      </span>
                    </td>
                    <td className="font-mono">#{order.platform_order_id}</td>
                    <td>{order.customer_name || '-'}</td>
                    <td>{order.total_amount ? `$${parseFloat(order.total_amount).toLocaleString('es-AR')}` : '-'}</td>
                    <td><span className="badge badge-green">{order.status}</span></td>
                    <td style={{ color: 'var(--text2)' }}>
                      {new Date(order.created_at).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
