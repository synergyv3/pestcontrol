import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

function UserModal({ user: editUser, onClose, onSaved }) {
  const [form, setForm] = useState({ firstName: editUser?.firstName||'', lastName: editUser?.lastName||'', email: editUser?.email||'', phone: editUser?.phone||'', role: editUser?.role||'technician', password: '', isActive: editUser?.isActive ?? true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const handleSave = async () => {
    setSaving(true); setError('');
    const payload = { ...form };
    if (!payload.password) delete payload.password;
    try {
      if (editUser?.id) await api.put(`/users/${editUser.id}`, payload);
      else await api.post('/users', payload);
      onSaved();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700 }}>{editUser?.id ? 'Edit User' : 'New User'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {[['First Name','firstName'],['Last Name','lastName']].map(([lbl,fld]) => (
              <div key={fld} className="form-group"><label className="label">{lbl} *</label><input className="input" value={form[fld]} onChange={e => setForm(p => ({...p,[fld]:e.target.value}))} /></div>
            ))}
          </div>
          <div className="form-group"><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e => setForm(p => ({...p,email:e.target.value}))} /></div>
          <div className="form-group"><label className="label">Phone</label><input className="input" type="tel" value={form.phone} onChange={e => setForm(p => ({...p,phone:e.target.value}))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label className="label">Role *</label>
              <select className="input" value={form.role} onChange={e => setForm(p => ({...p,role:e.target.value}))}>
                <option value="technician">Technician</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm(p => ({...p,isActive:e.target.value==='active'}))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="label">{editUser?.id ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input className="input" type="password" value={form.password} onChange={e => setForm(p => ({...p,password:e.target.value}))} placeholder="Minimum 8 characters" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editUser?.id ? 'Save Changes' : 'Create User'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const fetchUsers = () => { setLoading(true); api.get('/users').then(r => setUsers(r.data)).finally(() => setLoading(false)); };

  useEffect(() => { fetchUsers(); }, []);

  const handleDeactivate = async (u) => {
    if (!window.confirm(`Deactivate ${u.firstName} ${u.lastName}?`)) return;
    await api.delete(`/users/${u.id}`);
    fetchUsers(); showToast('User deactivated');
  };

  const roleBadge = (r) => {
    const m = { admin: 'badge-red', manager: 'badge-blue', technician: 'badge-green' };
    return <span className={`badge ${m[r]||'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{r}</span>;
  };

  return (
    <div>
      {toast && <div className="success-toast">{toast}</div>}
      {showModal && <UserModal user={editUser} onClose={() => { setShowModal(false); setEditUser(null); }} onSaved={() => { setShowModal(false); setEditUser(null); fetchUsers(); showToast('User saved!'); }} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Users & Staff</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{users.length} team members</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditUser(null); setShowModal(true); }}>+ Add User</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-dark" /></div>
        : <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: u.role==='admin'?'#FEE2E2':u.role==='manager'?'#DBEAFE':'#D1FAE5', color: u.role==='admin'?'#991B1B':u.role==='manager'?'#1E40AF':'#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}{u.id === currentUser?.id && <span style={{ fontSize: 11, color: 'var(--primary)', marginLeft: 6, fontWeight: 600 }}>(you)</span>}</div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.email}</td>
                  <td style={{ fontSize: 13 }}>{u.phone || '—'}</td>
                  <td>{roleBadge(u.role)}</td>
                  <td><span className={`badge ${u.isActive?'badge-green':'badge-red'}`}>{u.isActive?'Active':'Inactive'}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditUser(u); setShowModal(true); }}>Edit</button>
                      {u.isActive && u.id !== currentUser?.id && <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(u)}>Deactivate</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>
    </div>
  );
}
