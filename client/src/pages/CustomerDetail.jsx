import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const statusBadge = (s) => {
  const m = { pending: 'badge-yellow', scheduled: 'badge-blue', in_progress: 'badge-orange', completed: 'badge-green', cancelled: 'badge-gray' };
  return <span className={`badge ${m[s] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{s?.replace('_', ' ')}</span>;
};

export default function CustomerDetail({ isNew = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isManager, isAdmin } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', province: 'ON', postalCode: '', customerType: 'residential', notes: '' });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(isNew);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!isNew && id) {
      api.get(`/customers/${id}`)
        .then(r => { setCustomer(r.data); setForm(r.data); })
        .catch(() => navigate('/customers'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew, navigate]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (isNew) {
        const r = await api.post('/customers', form);
        showToast('Customer created!');
        navigate(`/customers/${r.data.id}`);
      } else {
        const r = await api.put(`/customers/${id}`, form);
        setCustomer(r.data);
        setEditing(false);
        showToast('Customer saved!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const F = (label, field, type = 'text', opts = {}) => (
    <div className="form-group">
      <label className="label">{label}</label>
      {opts.isSelect ? (
        <select className="input" value={form[field] || ''} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} disabled={!editing}>
          {opts.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : opts.isTextarea ? (
        <textarea className="input" value={form[field] || ''} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} disabled={!editing} placeholder={opts.placeholder} />
      ) : (
        <input className="input" type={type} value={form[field] || ''} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} disabled={!editing} placeholder={opts.placeholder} />
      )}
    </div>
  );

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner spinner-dark" /></div>;

  return (
    <div>
      {toast && <div className="success-toast">{toast}</div>}

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/customers')}>← Back</button>
          <h1 className="page-title">{isNew ? 'New Customer' : `${customer?.firstName} ${customer?.lastName}`}</h1>
          {!isNew && <span className={`badge ${customer?.customerType === 'commercial' ? 'badge-blue' : 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{customer?.customerType}</span>}
        </div>
        {isManager && !isNew && (
          <div style={{ display: 'flex', gap: 10 }}>
            {!editing
              ? <button className="btn btn-secondary" onClick={() => setEditing(true)}>✏ Edit</button>
              : <>
                  <button className="btn btn-secondary" onClick={() => { setEditing(false); setForm(customer); }}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </>
            }
            <button className="btn btn-primary" onClick={() => navigate(`/work-orders/new?customerId=${id}`)}>+ Work Order</button>
          </div>
        )}
        {isNew && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => navigate('/customers')}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Creating...' : 'Create Customer'}</button>
          </div>
        )}
      </div>

      {error && <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: isNew ? '1fr' : '1fr 1fr', gap: 20 }}>
        {/* Main info */}
        <div className="card">
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 20, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {F('First Name', 'firstName', 'text', { placeholder: 'John' })}
            {F('Last Name', 'lastName', 'text', { placeholder: 'Smith' })}
          </div>
          {F('Email', 'email', 'email', { placeholder: 'john@email.com' })}
          {F('Phone', 'phone', 'tel', { placeholder: '905-555-0000' })}
          {F('Customer Type', 'customerType', 'text', { isSelect: true, options: [{ value: 'residential', label: 'Residential' }, { value: 'commercial', label: 'Commercial' }] })}
          {F('Notes', 'notes', 'text', { isTextarea: true, placeholder: 'Special instructions, account notes...' })}
        </div>

        {/* Address */}
        <div className="card">
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 20, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Address</h3>
          {F('Street Address', 'address', 'text', { placeholder: '123 Main St' })}
          {F('City', 'city', 'text', { placeholder: 'Mississauga' })}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {F('Province', 'province', 'text', { isSelect: true, options: ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'].map(p => ({ value: p, label: p })) })}
            {F('Postal Code', 'postalCode', 'text', { placeholder: 'L5A 1B2' })}
          </div>

          {!isNew && customer?.workOrders?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, margin: '20px 0 14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Work Orders</h3>
              {customer.workOrders.slice(0, 5).map(wo => (
                <div key={wo.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate(`/work-orders/${wo.id}`)}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{wo.serviceType}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{wo.scheduledDate} {wo.scheduledTime && `at ${wo.scheduledTime}`}</div>
                  </div>
                  {statusBadge(wo.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
