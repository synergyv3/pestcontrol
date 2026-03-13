import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

export default function Customers() {
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchDebounce, setSearchDebounce] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (searchDebounce) params.search = searchDebounce;
    if (typeFilter) params.type = typeFilter;
    api.get('/customers', { params })
      .then(r => { setCustomers(r.data.customers); setTotal(r.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, searchDebounce, typeFilter]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { setPage(1); }, [searchDebounce, typeFilter]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{total} total customers</p>
        </div>
        {isManager && <button className="btn btn-primary" onClick={() => navigate('/customers/new')}>+ Add Customer</button>}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input" placeholder="🔍  Search by name, email, phone, address..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 220 }} />
        <select className="input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: 160 }}>
          <option value="">All Types</option>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
        </select>
        {(search || typeFilter) && <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setTypeFilter(''); }}>Clear</button>}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-dark" /></div>
        ) : customers.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">👥</div><p>No customers found</p>{isManager && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/customers/new')}>Add First Customer</button>}</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>Contact</th><th>Address</th><th>Type</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/customers/${c.id}`)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                            {c.firstName?.[0]}{c.lastName?.[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</div>
                            {c.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.notes}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        {c.phone && <div style={{ fontSize: 13 }}>📞 {c.phone}</div>}
                        {c.email && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>✉ {c.email}</div>}
                      </td>
                      <td style={{ fontSize: 13 }}>{c.address ? `${c.address}, ${c.city || ''}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td><span className={`badge ${c.customerType === 'commercial' ? 'badge-blue' : 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{c.customerType}</span></td>
                      <td><span className={`badge ${c.isActive ? 'badge-green' : 'badge-red'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td><button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); navigate(`/customers/${c.id}`); }}>View →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {total > 20 && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  <button className="btn btn-secondary btn-sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
