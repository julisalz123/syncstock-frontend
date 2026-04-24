import { useEffect, useState } from 'react';
import { products as productsApi } from '../lib/api';
import { Plus, Trash2, RefreshCw, Link2, ChevronDown, ChevronUp, Zap } from 'lucide-react';

export default function Mappings() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tnProducts, setTnProducts] = useState([]);
  const [mlProducts, setMlProducts] = useState([]);
  const [loadingTN, setLoadingTN] = useState(false);
  const [loadingML, setLoadingML] = useState(false);
  const [form, setForm] = useState({ tnVariantKey: '', mlItemId: '', mlVariationId: '' });
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState(null);
  const [logs, setLogs] = useState({});
  const [syncAllLoading, setSyncAllLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [autoMatches, setAutoMatches] = useState([]);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState({});
  const [approvingAuto, setApprovingAuto] = useState(false);
  const [autoMsg, setAutoMsg] = useState('');

  useEffect(() => { loadMappings(); }, []);

  const loadMappings = async () => {
    setLoading(true);
    try {
      const { data } = await productsApi.getMappings();
      setMappings(data);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoMatch = async () => {
    setAutoLoading(true);
    setAutoMsg('');
    try {
      const { data } = await productsApi.autoMatch();
      if (data.total === 0) {
        setAutoMsg('No se encontraron productos con SKU coincidente que no estén ya mapeados.');
        return;
      }
      const preSelected = {};
      data.matches.forEach((m, i) => { preSelected[i] = true; });
      setSelectedMatches(preSelected);
      setAutoMatches(data.matches);
      setShowAutoModal(true);
    } catch (err) {
      setAutoMsg('Error al buscar matches: ' + (err.response?.data?.error || err.message));
    } finally {
      setAutoLoading(false);
    }
  };

  const handleApproveAuto = async () => {
    setApprovingAuto(true);
    const toCreate = autoMatches.filter((_, i) => selectedMatches[i]);
    let created = 0;
    const errors = [];
    for (const match of toCreate) {
      try {
        let mlVariationId = null;
        if (match.ml.variations?.length === 1) {
          mlVariationId = String(match.ml.variations[0].id);
        }
        await productsApi.createMapping({
          sku: match.sku,
          tnProductId: match.tn.productId,
          tnVariantId: match.tn.variantId,
          tnProductName: match.tn.productName,
          mlItemId: match.ml.itemId,
          mlVariationId,
          mlItemName: match.ml.title,
        });
        created++;
      } catch (err) {
        errors.push(match.sku);
      }
    }
    setApprovingAuto(false);
    setShowAutoModal(false);
    setAutoMsg(`✅ ${created} mapeos creados${errors.length ? ` · ${errors.length} errores en SKUs: ${errors.join(', ')}` : ''}`);
    await loadMappings();
  };

  const toggleMatch = (i) => {
    setSelectedMatches(prev => ({ ...prev, [i]: !prev[i] }));
  };

  const openModal = async () => {
    setShowModal(true);
    setLoadingTN(true);
    setLoadingML(true);
    try {
      const [tn, ml] = await Promise.all([productsApi.getTN(), productsApi.getML()]);
      setTnProducts(tn.data);
      setMlProducts(ml.data);
    } catch (err) {
      alert('Error al cargar productos: ' + (err.response?.data?.error || err.message));
      setShowModal(false);
    } finally {
      setLoadingTN(false);
      setLoadingML(false);
    }
  };

  const handleSaveMapping = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const [tnProductId, tnVariantId] = form.tnVariantKey.split(':');
      const tnProduct = tnProducts.find(p => p.productId === tnProductId && p.variantId === tnVariantId);
      const mlProduct = mlProducts.find(p => p.id === form.mlItemId);
      if (!tnProduct) return alert('Seleccioná un producto de Tiendanube');
      if (!mlProduct) return alert('Seleccioná un producto de Mercado Libre');
      if (!tnProduct.sku) return alert('El producto de TN no tiene SKU cargado');
      let mlVariationId = null;
      if (form.mlVariationId) {
        mlVariationId = form.mlVariationId;
      } else if (mlProduct.variations?.length === 1) {
        mlVariationId = String(mlProduct.variations[0].id);
      }
      await productsApi.createMapping({
        sku: tnProduct.sku,
        tnProductId, tnVariantId,
        tnProductName: tnProduct.productName,
        mlItemId: form.mlItemId,
        mlVariationId,
        mlItemName: mlProduct.title,
      });
      setShowModal(false);
      setForm({ tnVariantKey: '', mlItemId: '', mlVariationId: '' });
      await loadMappings();
    } catch (err) {
      alert('Error al guardar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este mapeo?')) return;
    await productsApi.deleteMapping(id);
    loadMappings();
  };

  const handleSync = async (id) => {
    setSyncingId(id);
    try {
      const { data } = await productsApi.syncOne(id);
      setMappings(prev => prev.map(m => m.id === id ? { ...m, current_stock: data.stock, last_synced_at: new Date().toISOString() } : m));
    } catch (err) {
      alert('Error al sincronizar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncAllLoading(true);
    setMsg('');
    try {
      const { data } = await productsApi.syncAll();
      setMsg(`✅ ${data.synced} productos sincronizados${data.errors?.length ? ` · ${data.errors.length} errores` : ''}`);
      await loadMappings();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || err.message));
    } finally {
      setSyncAllLoading(false);
    }
  };

  const toggleLogs = async (id) => {
    if (expandedLogs === id) { setExpandedLogs(null); return; }
    setExpandedLogs(id);
    if (!logs[id]) {
      const { data } = await productsApi.getLogs(id);
      setLogs(prev => ({ ...prev, [id]: data }));
    }
  };

  const selectedTnProduct = tnProducts.find(p => `${p.productId}:${p.variantId}` === form.tnVariantKey);
  const selectedCount = Object.values(selectedMatches).filter(Boolean).length;

  return (
    <div className="page">
      <div className="flex-between page-header">
        <div>
          <h2>Sincronización de productos</h2>
          <p>Conectá productos de TN con ítems de MELI por SKU</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-success" onClick={handleAutoMatch} disabled={autoLoading}>
            <Zap size={14} />
            {autoLoading ? 'Buscando...' : 'Auto-mapear por SKU'}
          </button>
          <button className="btn btn-secondary" onClick={handleSyncAll} disabled={syncAllLoading || mappings.length === 0}>
            <RefreshCw size={14} />
            {syncAllLoading ? 'Sincronizando...' : 'Sync TN → MELI'}
          </button>
          <button className="btn btn-primary" onClick={openModal}>
            <Plus size={14} /> Agregar mapeo
          </button>
        </div>
      </div>

      {msg && (
        <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 16 }}>
          {msg}
        </div>
      )}

      {autoMsg && (
        <div className={`alert ${autoMsg.startsWith('✅') ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: 16 }}>
          {autoMsg}
        </div>
      )}

      {loading ? (
        <div className="flex gap-2" style={{ padding: '40px 0', justifyContent: 'center' }}>
          <span className="spinner" /> Cargando...
        </div>
      ) : mappings.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-icon"><Link2 size={36} strokeWidth={1.5} /></div>
            <h3>No hay mapeos creados</h3>
            <p>Usá el auto-mapeo por SKU o agregá manualmente</p>
            <div className="flex gap-2" style={{ justifyContent: 'center', marginTop: 16 }}>
              <button className="btn btn-success" onClick={handleAutoMatch} disabled={autoLoading}>
                <Zap size={14} /> Auto-mapear por SKU
              </button>
              <button className="btn btn-primary" onClick={openModal}>
                <Plus size={14} /> Agregar manual
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto TN</th>
                  <th>Ítem MELI</th>
                  <th>Stock actual</th>
                  <th>Última sync</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map(m => (
                  <>
                    <tr key={m.id}>
                      <td className="font-mono">{m.sku}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.tn_product_name || '-'}
                      </td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text2)' }}>
                        {m.ml_item_name || '-'}
                      </td>
                      <td>
                        <span className={`badge ${m.current_stock === 0 ? 'badge-red' : m.current_stock <= 3 ? 'badge-yellow' : 'badge-green'}`}>
                          {m.current_stock !== null ? `${m.current_stock} u.` : '-'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text2)', fontSize: 12.5 }}>
                        {m.last_synced_at ? new Date(m.last_synced_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Nunca'}
                      </td>
                      <td>
                        <span className={`badge ${m.is_active ? 'badge-green' : 'badge-gray'}`}>
                          {m.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn-icon" title="Sincronizar ahora" onClick={() => handleSync(m.id)} disabled={syncingId === m.id}>
                            <RefreshCw size={13} />
                          </button>
                          <button className="btn-icon" title="Ver historial" onClick={() => toggleLogs(m.id)}>
                            {expandedLogs === m.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                          <button className="btn-icon" title="Desactivar" onClick={() => handleDelete(m.id)} style={{ color: 'var(--danger)' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedLogs === m.id && (
                      <tr key={`logs-${m.id}`}>
                        <td colSpan={7} style={{ background: 'var(--surface2)', padding: '12px 16px' }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8, color: 'var(--text2)' }}>Historial</div>
                          {!logs[m.id] ? <span className="spinner" style={{ width: 14, height: 14 }} /> :
                            logs[m.id].length === 0 ? <span style={{ color: 'var(--text3)', fontSize: 12.5 }}>Sin historial</span> :
                            logs[m.id].slice(0, 8).map(log => (
                              <div key={log.id} className="flex gap-2" style={{ fontSize: 12.5, marginBottom: 4 }}>
                                <span className={`badge badge-${log.event_type.includes('sale') ? 'yellow' : 'blue'}`}>{log.event_type}</span>
                                <span style={{ color: 'var(--text2)' }}>{log.previous_stock !== null ? `${log.previous_stock} → ` : ''}{log.new_stock} u.</span>
                                <span style={{ color: 'var(--text3)', marginLeft: 'auto' }}>
                                  {new Date(log.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ))
                          }
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal auto-mapeo */}
      {showAutoModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAutoModal(false)}>
          <div className="modal" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <div>
                <h3>Revisar auto-mapeo por SKU</h3>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>
                  Se encontraron <strong>{autoMatches.length}</strong> coincidencias. Revisá y aprobá.
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowAutoModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <div className="alert alert-info" style={{ margin: '16px 24px 0', fontSize: 13 }}>
                Todos están tildados por defecto. Destildá los que no quieras antes de aprobar.
              </div>
              <div className="table-wrap" style={{ maxHeight: 380, overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <input type="checkbox"
                          checked={autoMatches.length > 0 && autoMatches.every((_, i) => selectedMatches[i])}
                          onChange={e => {
                            const all = {};
                            autoMatches.forEach((_, i) => { all[i] = e.target.checked; });
                            setSelectedMatches(all);
                          }} />
                      </th>
                      <th>SKU</th>
                      <th>Producto TN</th>
                      <th>Stock TN</th>
                      <th>Ítem MELI</th>
                      <th>Stock MELI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {autoMatches.map((match, i) => (
                      <tr key={i} style={{ opacity: selectedMatches[i] ? 1 : 0.4 }}>
                        <td><input type="checkbox" checked={!!selectedMatches[i]} onChange={() => toggleMatch(i)} /></td>
                        <td className="font-mono">{match.sku}</td>
                        <td style={{ fontSize: 12.5 }}>
                          {match.tn.productName}
                          {match.tn.values?.length > 0 && (
                            <div style={{ color: 'var(--text3)', fontSize: 11 }}>
                              {match.tn.values.map(v => v.es || Object.values(v)[0]).join(' / ')}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${match.tn.stock === 0 ? 'badge-red' : match.tn.stock <= 3 ? 'badge-yellow' : 'badge-green'}`}>
                            {match.tn.stock !== null ? match.tn.stock : '∞'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12.5, color: 'var(--text2)' }}>
                          {match.ml.title?.substring(0, 35)}{match.ml.title?.length > 35 ? '...' : ''}
                        </td>
                        <td>
                          <span className={`badge ${match.ml.stock === 0 ? 'badge-red' : 'badge-gray'}`}>
                            {match.ml.stock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <div style={{ fontSize: 13, color: 'var(--text2)', marginRight: 'auto' }}>
                {selectedCount} de {autoMatches.length} seleccionados
              </div>
              <button className="btn btn-secondary" onClick={() => setShowAutoModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleApproveAuto} disabled={approvingAuto || selectedCount === 0}>
                {approvingAuto
                  ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white', width: 14, height: 14 }} /> Creando...</>
                  : `✅ Aprobar ${selectedCount} mapeos`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal manual */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Nuevo mapeo de producto</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveMapping}>
              <div className="modal-body">
                <div className="alert alert-info" style={{ marginBottom: 16, fontSize: 13 }}>
                  Elegí la variante de TN y el ítem de MELI que corresponden al mismo producto.
                </div>
                <div className="form-group">
                  <label className="form-label">Variante de Tiendanube</label>
                  {loadingTN ? <div className="flex gap-2"><span className="spinner" style={{ width: 16, height: 16 }} /> Cargando...</div> : (
                    <select className="form-input" required value={form.tnVariantKey} onChange={e => setForm(f => ({ ...f, tnVariantKey: e.target.value }))}>
                      <option value="">— Seleccioná un producto —</option>
                      {tnProducts.map(p => (
                        <option key={`${p.productId}:${p.variantId}`} value={`${p.productId}:${p.variantId}`}>
                          {p.productName} {p.values?.length ? `(${p.values.map(v => v.es || Object.values(v)[0]).join(' / ')})` : ''} · SKU: {p.sku || 'Sin SKU'} · Stock: {p.stock !== null ? p.stock : '∞'}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedTnProduct && !selectedTnProduct.sku && (
                    <div className="alert alert-warning" style={{ marginTop: 8, fontSize: 12.5 }}>⚠️ Sin SKU en TN</div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Ítem de Mercado Libre</label>
                  {loadingML ? <div className="flex gap-2"><span className="spinner" style={{ width: 16, height: 16 }} /> Cargando...</div> : (
                    <select className="form-input" required value={form.mlItemId} onChange={e => setForm(f => ({ ...f, mlItemId: e.target.value, mlVariationId: '' }))}>
                      <option value="">— Seleccioná un ítem —</option>
                      {mlProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title} · SKU: {p.sku || 'Sin SKU'} · Stock: {p.stock}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {form.mlItemId && mlProducts.find(p => p.id === form.mlItemId)?.variations?.length > 1 && (
                  <div className="form-group">
                    <label className="form-label">Variación de Mercado Libre</label>
                    <select className="form-input" value={form.mlVariationId} onChange={e => setForm(f => ({ ...f, mlVariationId: e.target.value }))}>
                      <option value="">— Seleccioná la variación —</option>
                      {mlProducts.find(p => p.id === form.mlItemId)?.variations?.map(v => (
                        <option key={v.id} value={String(v.id)}>
                          {v.attribute_combinations?.map(a => a.value_name).join(' / ') || `Variación ${v.id}`} · Stock: {v.available_quantity}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white', width: 14, height: 14 }} /> Guardando...</> : 'Guardar mapeo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}