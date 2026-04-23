import { useEffect, useState } from 'react';
import { products as productsApi } from '../lib/api';

export default function Products() {
  const [tab, setTab] = useState('tn');
  const [tnProducts, setTnProducts] = useState([]);
  const [mlProducts, setMlProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [loaded, setLoaded] = useState({ tn: false, ml: false });

  useEffect(() => {
    if (tab === 'tn' && !loaded.tn) {
      setLoading(true);
      productsApi.getTN()
        .then(r => { setTnProducts(r.data); setLoaded(l => ({ ...l, tn: true })); })
        .catch(e => alert(e.response?.data?.error || 'Error al cargar TN'))
        .finally(() => setLoading(false));
    }
    if (tab === 'ml' && !loaded.ml) {
      setLoading(true);
      productsApi.getML()
        .then(r => { setMlProducts(r.data); setLoaded(l => ({ ...l, ml: true })); })
        .catch(e => alert(e.response?.data?.error || 'Error al cargar MELI'))
        .finally(() => setLoading(false));
    }
  }, [tab]);

  const filtered = tab === 'tn'
    ? tnProducts.filter(p =>
        !search || p.productName?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
    : mlProducts.filter(p =>
        !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <div className="page-header">
        <h2>Productos</h2>
        <p>Vista de todos tus productos en cada plataforma</p>
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <div className="flex gap-2">
            {[
              { val: 'tn', label: '🛍️ Tiendanube' },
              { val: 'ml', label: '🛒 Mercado Libre' },
            ].map(({ val, label }) => (
              <button key={val} className={`btn ${tab === val ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => { setTab(val); setSearch(''); }}>
                {label}
              </button>
            ))}
          </div>
          <input className="form-input" style={{ width: 240 }} type="text"
            placeholder="Buscar por nombre o SKU..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex gap-2" style={{ justifyContent: 'center', padding: '40px 0' }}>
            <span className="spinner" /> Cargando productos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty" style={{ padding: '32px 0' }}>
            <p>{search ? 'Sin resultados para esa búsqueda' : 'No hay productos'}</p>
          </div>
        ) : tab === 'tn' ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Producto</th><th>SKU</th><th>Stock</th><th>Precio</th><th>Variante</th></tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={`${p.productId}-${p.variantId}`}>
                    <td style={{ fontWeight: 500 }}>{p.productName}</td>
                    <td className="font-mono">{p.sku || <span style={{ color: 'var(--text3)' }}>Sin SKU</span>}</td>
                    <td>
                      <span className={`badge ${p.stock === 0 ? 'badge-red' : p.stock <= 3 ? 'badge-yellow' : 'badge-green'}`}>
                        {p.stock !== null ? `${p.stock} u.` : '∞'}
                      </span>
                    </td>
                    <td>{p.price ? `$${parseFloat(p.price).toLocaleString('es-AR')}` : '-'}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12.5 }}>
                      {p.values?.map(v => v.es || v.pt || Object.values(v)[0]).join(' / ') || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Título</th><th>SKU</th><th>Stock</th><th>Variaciones</th></tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.title}</td>
                    <td className="font-mono">{p.sku || <span style={{ color: 'var(--text3)' }}>Sin SKU</span>}</td>
                    <td>
                      <span className={`badge ${p.stock === 0 ? 'badge-red' : p.stock <= 3 ? 'badge-yellow' : 'badge-green'}`}>
                        {p.stock} u.
                      </span>
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: 12.5 }}>
                      {p.variations?.length ? `${p.variations.length} variaciones` : 'Sin variaciones'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '10px 0 0', fontSize: 12.5, color: 'var(--text2)' }}>
          {filtered.length} {tab === 'tn' ? 'variantes' : 'ítems'} encontradas
        </div>
      </div>
    </div>
  );
}
