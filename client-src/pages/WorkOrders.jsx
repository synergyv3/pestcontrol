import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const statusBadge = (s) => {
  const m = { pending: ['badge-yellow','Pending'], scheduled: ['badge-blue','Scheduled'], in_progress: ['badge-orange','In Progress'], completed: ['badge-green','Completed'], cancelled: ['badge-gray','Cancelled'] };
  const [cls, label] = m[s] || ['badge-gray', s];
  return <span className={`badge ${cls}`}>{label}</span>;
};
const priorityBadge = (p) => {
  const m = { low: 'badge-gray', normal: 'badge-green', high: 'badge-yellow', urgent: 'badge-red' };
  return <span className={`badge ${m[p] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{p}</span>;
};

const SERVICE_TYPES = ['General Pest Control','Rodent Control','Bed Bug Treatment','Termite Inspection','Wasp/Hornet Removal','Ant Treatment','Cockroach Treatment','Mosquito Control','Wildlife Removal','Other'];

export default function WorkOrders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isManager, isTechnician } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 25 };
    if (status) params.status = status;
    api.get('/work-orders', { params })
      .then(r => { setWorkOrders(r.data.workOrders); setTotal(r.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [status]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Work Orders</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{total} total</p>
        </div>
        {isManager && <button className="btn btn-primary" onClick={() => navigate('/work-orders/new')}>+ New Work Order</button>}
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['', 'All'], ['pending', 'Pending'], ['scheduled', 'Scheduled'], ['in_progress', 'In Progress'], ['completed', 'Completed'], ['cancelled', 'Cancelled']].map(([val, lbl]) => (
          <button key={val} onClick={() => setStatus(val)}
            style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid', cursor: 'pointer', fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              background: status === val ? 'var(--primary)' : 'var(--surface)',
              borderColor: status === val ? 'var(--primary)' : 'var(--border)',
              color: status === val ? 'white' : 'var(--text-secondary)',
            }}>
            {lbl}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-dark" /></div>
        ) : workOrders.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🔧</div><p>No work orders found</p>{isManager && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/work-orders/new')}>Create Work Order</button>}</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr><th>#</th><th>Customer</th><th>Service Type</th><th>Date</th><th>Technician</th><th>Priority</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {workOrders.map(wo => (
                    <tr key={wo.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/work-orders/${wo.id}`)}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>#{wo.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{wo.customer?.firstName} {wo.customer?.lastName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{wo.customer?.city}</div>
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>{wo.serviceType}</td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{wo.scheduledDate}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{wo.scheduledTime || '—'}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{wo.technician ? `${wo.technician.firstName} ${wo.technician.lastName}` : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                      <td>{priorityBadge(wo.priority)}</td>
                      <td>{statusBadge(wo.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > 25 && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Showing {(page-1)*25+1}–{Math.min(page*25, total)} of {total}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" disabled={page===1} onClick={() => setPage(p => p-1)}>← Prev</button>
                  <button className="btn btn-secondary btn-sm" disabled={page*25>=total} onClick={() => setPage(p => p+1)}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
