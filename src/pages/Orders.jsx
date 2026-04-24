import { useEffect, useState } from 'react';
import { orders as ordersApi } from '../lib/api';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Orders() {
  const [data, setData] = useState({ orders: [], total: 0 });
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const PAGE_SIZE = 30;

  useEffect(() => {
    setLoading(true);
    ordersApi.list({ platform: filter || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [filter, page]);

  const toggleExpand = (id) => setExpanded(expanded === id ? null : id);

  const getStatusBadge = (status) => {
    const map = {
      // Verde — pagado/completado
      paid: 'badge-green',
      fulfilled: 'badge-green',
      shipped: 'badge-green',
      // Naranja — pendiente
      open: 'badge-yellow',
      pending: 'badge-yellow',
      payment_required: 'badge-yellow',
      payment_in_process: 'badge-yellow',
      // Rojo — cancelado
      cancelled: 'badge-red',
      refunded: 'badge-red',
    };
    return map[status] || 'badge-gray';
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Órdenes</h2>
        <p>Pedidos recibidos en ambos canales</p>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
        <div className="flex gap-2">
          {[
            { val: '', label: 'Todos' },
            { val: 'tiendanube', label: '🛍️ Tiendanube' },
            { val: 'mercadolibre', label: '🛒 Mercado Libre' },
          ].map(({ val, label }) => (
            <button key={val} className={`btn ${filter === val ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => { setFilter(val); setPage(0); }}>
              {label}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', color: 'var(--text2)', fontSize: 13 }}>
            {data.total} órdenes en total
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="flex gap-2" style={{ justifyContent: 'center', padding: '40px 0' }}>
            <span className="spinner" /> Cargando...
          </div>
        ) : data.orders.length === 0 ? (
          <div className="empty">
            <h3>Sin órdenes</h3>
            <p>Las órdenes aparecerán aquí cuando lleguen ventas</p>
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
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map(order => {
                  const items = (() => { try { return JSON.parse(order.items || '[]'); } catch { return []; } })();
                  const isExpanded = expanded === order.id;
                  return (
                    <>
                      <tr key={order.id}>
                        <td>
                          <span className={`badge ${order.platform === 'tiendanube' ? 'badge-blue' : 'badge-yellow'}`}>
                            {order.platform === 'tiendanube' ? '🛍️ TN' : '🛒 MELI'}
                          </span>
                        </td>
                        <td className="font-mono" style={{ color: 'var(--text2)' }}>#{order.platform_order_id}</td>
                        <td style={{ fontWeight: 500 }}>{order.customer_name || '-'}</td>
                        <td style={{ fontWeight: 600 }}>
                          {order.total_amount ? `$${parseFloat(order.total_amount).toLocaleString('es-AR')}` : '-'}
                        </td>
                        <td><span className={`badge ${getStatusBadge(order.status)}`}>{order.status}</span></td>
                        <td style={{ color: 'var(--text2)', fontSize: 12.5 }}>
                          {new Date(order.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <button className="btn-icon" onClick={() => toggleExpand(order.id)}>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`detail-${order.id}`}>
                          <td colSpan={7} style={{ background: 'var(--surface2)', padding: '12px 20px' }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8, color: 'var(--text2)' }}>
                              Productos de la orden
                            </div>
                            {items.length === 0 ? (
                              <span style={{ color: 'var(--text3)', fontSize: 12.5 }}>Sin detalle disponible</span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {items.map((item, i) => (
                                  <div key={i} className="flex-between" style={{
                                    background: 'var(--surface)', padding: '8px 12px',
                                    borderRadius: 6, border: '1px solid var(--border)'
                                  }}>
                                    <div className="flex gap-2">
                                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                                        {item.product_name || item.item_id || `Producto ${i + 1}`}
                                      </span>
                                      {item.sku && (
                                        <span className="font-mono" style={{ fontSize: 11, color: 'var(--text3)' }}>
                                          SKU: {item.sku}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      {item.unit_price && (
                                        <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>
                                          ${parseFloat(item.unit_price).toLocaleString('es-AR')} c/u
                                        </span>
                                      )}
                                      <span className="badge badge-blue">x{item.quantity}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {order.customer_email && (
                              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
                                📧 {order.customer_email}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data.total > PAGE_SIZE && (
          <div className="flex-between" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              ← Anterior
            </button>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>
              Página {page + 1} de {Math.ceil(data.total / PAGE_SIZE)}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= data.total}>
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
