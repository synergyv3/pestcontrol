import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const SERVICE_TYPES = ['General Pest Control','Rodent Control','Bed Bug Treatment','Termite Inspection','Wasp/Hornet Removal','Ant Treatment','Cockroach Treatment','Mosquito Control','Wildlife Removal','Other'];

const statusBadge = (s) => {
  const m = { pending: ['badge-yellow','Pending'], scheduled: ['badge-blue','Scheduled'], in_progress: ['badge-orange','In Progress'], completed: ['badge-green','Completed'], cancelled: ['badge-gray','Cancelled'] };
  const [cls, label] = m[s] || ['badge-gray', s];
  return <span className={`badge ${cls}`}>{label}</span>;
};

export default function WorkOrderDetail({ isNew = false }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isManager, isTechnician, user } = useAuth();
  const [wo, setWo] = useState(null);
  const [form, setForm] = useState({
    customerId: searchParams.get('customerId') || '',
    assignedTechnicianId: '',
    serviceType: 'General Pest Control',
    description: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '09:00',
    estimatedDuration: 60,
    status: 'pending',
    priority: 'normal',
    notes: '',
    serviceAddress: '',
    technicianNotes: '',
  });
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(isNew);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (isManager) {
      api.get('/users/technicians').then(r => setTechnicians(r.data));
    }
    if (!isNew && id) {
      api.get(`/work-orders/${id}`)
        .then(r => { setWo(r.data); setForm(r.data); })
        .catch(() => navigate('/work-orders'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew, isManager, navigate]);

  useEffect(() => {
    if (!isManager || !isNew) return;
    const t = setTimeout(() => {
      api.get('/customers', { params: { search: customerSearch, limit: 8 } })
        .then(r => setCustomers(r.data.customers));
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch, isManager, isNew]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (isNew) {
        const r = await api.post('/work-orders', form);
        showToast('Work order created!');
        navigate(`/work-orders/${r.data.id}`);
      } else {
        const updates = isTechnician
          ? { status: form.status, technicianNotes: form.technicianNotes, completedAt: form.status === 'completed' ? new Date() : null }
          : form;
        const r = await api.put(`/work-orders/${id}`, updates);
        setWo(r.data); setEditing(false);
        showToast('Work order updated!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));
  const inputProps = (field, type = 'text') => ({ className: 'input', type, value: form[field] || '', onChange: set(field), disabled: !editing });

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner spinner-dark" /></div>;

  const canEdit = isManager || (isTechnician && wo?.assignedTechnicianId === user?.id);

  return (
    <div>
      {toast && <div className="success-toast">{toast}</div>}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/work-orders')}>← Back</button>
          <h1 className="page-title">{isNew ? 'New Work Order' : `Work Order #${id}`}</h1>
          {!isNew && statusBadge(wo?.status)}
        </div>
        {canEdit && !isNew && (
          <div style={{ display: 'flex', gap: 10 }}>
            {!editing
              ? <button className="btn btn-secondary" onClick={() => setEditing(true)}>✏ Edit</button>
              : <><button className="btn btn-secondary" onClick={() => { setEditing(false); setForm(wo); }}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>
            }
          </div>
        )}
        {isNew && <div style={{ display: 'flex', gap: 10 }}><button className="btn btn-secondary" onClick={() => navigate('/work-orders')}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button></div>}
      </div>

      {error && <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Job details */}
        <div className="card">
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 20, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Job Details</h3>

          {isNew && isManager && (
            <div className="form-group">
              <label className="label">Customer *</label>
              <input className="input" placeholder="Search customer..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
              {customers.length > 0 && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 6, marginTop: 4, overflow: 'hidden', background: 'white', boxShadow: 'var(--shadow-md)' }}>
                  {customers.map(c => (
                    <div key={c.id} style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid var(--border)' }}
                      onClick={() => { setForm(p => ({ ...p, customerId: c.id, serviceAddress: `${c.address || ''}, ${c.city || ''}` })); setCustomerSearch(`${c.firstName} ${c.lastName}`); setCustomers([]); }}>
                      <strong>{c.firstName} {c.lastName}</strong> — {c.address}, {c.city}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isNew && wo?.customer && (
            <div className="form-group">
              <label className="label">Customer</label>
              <div style={{ padding: '9px 12px', background: 'var(--bg)', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate(`/customers/${wo.customer.id}`)}>
                👤 {wo.customer.firstName} {wo.customer.lastName} <span style={{ color: 'var(--primary)', fontSize: 12 }}>→ View</span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="label">Service Type *</label>
            <select {...inputProps('serviceType')}>
              {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label className="label">Scheduled Date *</label>
              <input {...inputProps('scheduledDate', 'date')} />
            </div>
            <div className="form-group">
              <label className="label">Scheduled Time</label>
              <input {...inputProps('scheduledTime', 'time')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label className="label">Priority</label>
              <select {...inputProps('priority')} disabled={!editing || isTechnician}>
                {['low','normal','high','urgent'].map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Status</label>
              <select {...inputProps('status')} disabled={!editing}>
                {['pending','scheduled','in_progress','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Description / Instructions</label>
            <textarea {...inputProps('description')} className="input" style={{ minHeight: 80 }} placeholder="Describe the pest issue and any special instructions..." />
          </div>
        </div>

        {/* Assignment & notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {isManager && (
            <div className="card">
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 20, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignment</h3>
              <div className="form-group">
                <label className="label">Assign Technician</label>
                <select className="input" value={form.assignedTechnicianId || ''} onChange={set('assignedTechnicianId')} disabled={!editing}>
                  <option value="">— Unassigned —</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Service Address</label>
                <input {...inputProps('serviceAddress')} placeholder="Leave blank to use customer address" />
              </div>
              <div className="form-group">
                <label className="label">Duration (minutes)</label>
                <input {...inputProps('estimatedDuration', 'number')} disabled={!editing || isTechnician} />
              </div>
            </div>
          )}

          <div className="card">
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 20, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</h3>
            {isManager && (
              <div className="form-group">
                <label className="label">Office Notes (internal)</label>
                <textarea {...inputProps('notes')} className="input" placeholder="Internal notes, not visible to technician..." style={{ minHeight: 70 }} />
              </div>
            )}
            <div className="form-group">
              <label className="label">Technician Field Notes</label>
              <textarea className="input" value={form.technicianNotes || ''} onChange={set('technicianNotes')} disabled={!editing} placeholder="What was found and done on site..." style={{ minHeight: 100 }} />
            </div>
            {wo?.completedAt && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>✅ Completed: {new Date(wo.completedAt).toLocaleString()}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
