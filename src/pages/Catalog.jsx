import { useState } from 'react';
import { catalog as catalogApi } from '../lib/api';
import { FileText, Download } from 'lucide-react';

export default function Catalog() {
  const [form, setForm] = useState({ storeName: '', category: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleDownload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const { data } = await catalogApi.download({
        storeName: form.storeName || 'Mi Catálogo',
        category: form.category || undefined,
      });
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalogo-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg('✅ PDF descargado exitosamente');
    } catch (err) {
      setMsg('❌ Error al generar el catálogo. Verificá que Tiendanube esté conectada.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Catálogo PDF</h2>
        <p>Generá un catálogo de tus productos listo para compartir</p>
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
        <div className="card">
          <div className="card-title flex gap-2">
            <FileText size={16} /> Generar catálogo
          </div>

          {msg && (
            <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleDownload}>
            <div className="form-group">
              <label className="form-label">Nombre del catálogo</label>
              <input className="form-input" type="text" placeholder="Ej: Mi Marca · Primavera 2025"
                value={form.storeName}
                onChange={e => setForm(f => ({ ...f, storeName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Filtrar por categoría (opcional)</label>
              <input className="form-input" type="text"
                placeholder="Ej: remera, pantalón... (vacío = todos los productos)"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                El filtro busca el texto en el nombre del producto
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}
              style={{ padding: '10px 0' }}>
              {loading
                ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white', width: 16, height: 16 }} /> Generando PDF...</>
                : <><Download size={15} /> Descargar catálogo PDF</>}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">¿Qué incluye el catálogo?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '📄', text: 'Portada con el nombre de tu marca' },
              { icon: '📦', text: 'Tabla con todos los productos (o los filtrados)' },
              { icon: '🏷️', text: 'SKU, stock disponible y precio de cada variante' },
              { icon: '🎨', text: 'Variantes (talle, color, etc.)' },
              { icon: '📅', text: 'Fecha de generación al pie' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex gap-2" style={{ fontSize: 13.5 }}>
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div style={{ fontSize: 12.5, color: 'var(--text2)' }}>
            Los productos se traen en tiempo real desde Tiendanube, por lo que el stock siempre estará actualizado.
          </div>
        </div>
      </div>
    </div>
  );
}
