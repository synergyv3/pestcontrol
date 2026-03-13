import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Icon = ({ name }) => {
  const icons = {
    dashboard: '▦', customers: '👥', workorders: '🔧', schedule: '📅',
    invoices: '💳', users: '⚙', logout: '→', menu: '☰', close: '✕',
    bug: '🐛',
  };
  return <span style={{ fontSize: 16, lineHeight: 1 }}>{icons[name] || '•'}</span>;
};

const NavItem = ({ to, icon, label, onClick }) => (
  <NavLink to={to} onClick={onClick}
    style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
      color: isActive ? '#fff' : '#94A3B8', textDecoration: 'none',
      background: isActive ? '#065F46' : 'transparent',
      borderRadius: 8, margin: '2px 8px', fontWeight: isActive ? 600 : 400,
      fontSize: 14, transition: 'all 0.15s',
    })}
    onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = '#fff'; }}
    onMouseLeave={e => { if (!e.currentTarget.getAttribute('aria-current')) { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#94A3B8'; } }}
  >
    <Icon name={icon} /><span>{label}</span>
  </NavLink>
);

export default function Layout() {
  const { user, logout, isManager, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>🐛</span>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>PestControl</div>
            <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pro</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        <NavItem to="/dashboard" icon="dashboard" label="Dashboard" onClick={() => setMobileOpen(false)} />
        <NavItem to="/customers" icon="customers" label="Customers" onClick={() => setMobileOpen(false)} />
        <NavItem to="/work-orders" icon="workorders" label="Work Orders" onClick={() => setMobileOpen(false)} />
        <NavItem to="/schedule" icon="schedule" label="Schedule" onClick={() => setMobileOpen(false)} />
        {isManager && <NavItem to="/invoices" icon="invoices" label="Invoices" onClick={() => setMobileOpen(false)} />}
        {isAdmin && <NavItem to="/users" icon="users" label="Users" onClick={() => setMobileOpen(false)} />}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: '16px', borderTop: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ color: '#64748B', fontSize: 11, textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: '1px solid #1E293B', color: '#94A3B8', borderRadius: 6, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontFamily: "'Barlow', sans-serif" }}>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <aside style={{ width: 240, background: '#0F172A', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="desktop-sidebar">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div onClick={() => setMobileOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <aside style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 260, background: '#0F172A', zIndex: 101, display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: 16, right: 16 }}>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile header */}
        <header style={{ background: '#0F172A', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }} className="mobile-header">
          <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 4 }}>☰</button>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff' }}>PestControl Pro</div>
        </header>

        <main style={{ flex: 1, padding: '28px 32px', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 769px) { .mobile-header { display: none !important; } }
        @media (max-width: 768px) { .desktop-sidebar { display: none !important; } main { padding: 20px 16px !important; } }
      `}</style>
    </div>
  );
}
