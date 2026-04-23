import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, Package, ArrowLeftRight,
  ShoppingBag, FileText, Settings, LogOut, Zap
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/connections', icon: Zap, label: 'Conexiones' },
  { to: '/products', icon: Package, label: 'Productos' },
  { to: '/mappings', icon: ArrowLeftRight, label: 'Sincronización' },
  { to: '/orders', icon: ShoppingBag, label: 'Órdenes' },
  { to: '/catalog', icon: FileText, label: 'Catálogo PDF' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>SyncStock</h1>
        <span>Panel de control</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ padding: '8px 12px', marginBottom: 4 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>Cuenta</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.email}
          </div>
        </div>
        <button className="nav-item w-full" onClick={handleLogout} style={{ border: 'none', background: 'none' }}>
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
