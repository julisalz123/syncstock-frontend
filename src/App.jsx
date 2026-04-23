import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Connections from './pages/Connections';
import Products from './pages/Products';
import Mappings from './pages/Mappings';
import Orders from './pages/Orders';
import Catalog from './pages/Catalog';
import './index.css';

function PrivateLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 10 }}>
      <span className="spinner" style={{ width: 24, height: 24 }} /> Cargando...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
          <Route path="/connections" element={<PrivateLayout><Connections /></PrivateLayout>} />
          <Route path="/products" element={<PrivateLayout><Products /></PrivateLayout>} />
          <Route path="/mappings" element={<PrivateLayout><Mappings /></PrivateLayout>} />
          <Route path="/orders" element={<PrivateLayout><Orders /></PrivateLayout>} />
          <Route path="/catalog" element={<PrivateLayout><Catalog /></PrivateLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
