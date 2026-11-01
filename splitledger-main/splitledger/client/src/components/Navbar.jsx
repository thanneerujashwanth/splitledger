import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Users, GitMerge, PieChart, Activity, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { currentUser, logout } = useContext(AuthContext);

  const links = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/groups', icon: <Users size={20} />, label: 'Groups' },
    { to: '/friends', icon: <Users size={20} />, label: 'Friends' },
    { to: '/expenses', icon: <Receipt size={20} />, label: 'Expenses' },
    { to: '/splits', icon: <GitMerge size={20} />, label: 'Splits' },
    { to: '/insights', icon: <PieChart size={20} />, label: 'Insights' },
    { to: '/feed', icon: <Activity size={20} />, label: 'Live Feed' },
  ];

  return (
    <div className="sidebar">
      <div className="brand">
        <span style={{color: 'var(--primary-color)'}}>Split</span>Ledger
      </div>
      <nav style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1}}>
        {links.map((link) => (
          <NavLink 
            key={link.to} 
            to={link.to} 
            className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}
            end={link.to === '/'}
          >
            {link.icon} {link.label}
          </NavLink>
        ))}
      </nav>

      {currentUser && (
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', 
              backgroundColor: 'var(--primary-color)', color: '#fff', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 'bold', marginRight: '0.75rem', flexShrink: 0
            }}>
              {currentUser.initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{currentUser.username}</div>
            </div>
          </div>
          <button 
            onClick={logout}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              width: '100%', padding: '0.75rem', background: 'transparent', 
              border: 'none', color: 'var(--danger-color)', cursor: 'pointer',
              fontWeight: 500, fontSize: '0.875rem', borderRadius: '0.5rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-light)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
