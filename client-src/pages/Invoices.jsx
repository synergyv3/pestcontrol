import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const statusBadge = (s) => {
  const m = { draft: 'badge-gray', sent: 'badge-blue', paid: 'badge-green', overdue: 'badge-red', cancelled: 'badge-gray' };
  return <span className={`badge ${m[s] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{s}</span>;
};

function InvoiceModal({ invoice, onClose, onSaved }) {
  const [form, setForm] = useState({
    customerId: invoice?.customerId || '',
    subtotal: invoice?.subtotal || '',
    taxRate: invoice?.taxRate || 0.13,
    notes: invoice?.notes || '',
    dueDate: invoice?.dueDate || '',
    lineItems: invoice?.lineItems ? JSON.parse(invoice.lineItems) : [{ description: '', quantity: 1, rate: '', amount: 0 }],
    status: invoice?.status || 'draft',
  });
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (search.length < 1) return;
    const t = setTimeout(() => api.get('/customers', { params: { search, limit: 6 } }).then(r => setCustomers(r.data.customers)), 300);
    return () => clearTimeout(t);
  }, [search]);

  const updateLine = (idx, field, val) => {
    const lines = [...form.lineItems];
    lines[idx] = { ...lines[idx], [field]: val };
    if (field === 'quantity' || field === 'rate') lines[idx].amount = (parseFloat(lines[idx].quantity) || 0) * (parseFloat(lines[idx].rate) || 0);
    const subtotal = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
    setForm(p => ({ ...p, lineItems: lines, subtotal: subtotal.toFixed(2) }));
  };

  const tax = (parseFloat(form.subtotal) || 0) * form.taxRate;
  const total = (parseFloat(form.subtotal) || 0) + tax;

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (invoice?.id) await api.put(`/invoices/${invoice.id}`, { ...form, lineItems: form.lineItems });
      else await api.post('/invoices', { ...form, lineItems: form.lineItems });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save invoice');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700 }}>{invoice?.id ? `Edit Invoice ${invoice.invoiceNumber}` : 'New Invoice'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{error}</div>}

          {!invoice?.id && (
            <div className="form-group">
              <label className="label">Customer *</label>
              <input className="input" placeholder="Search customer..." value={search} onChange={e => setSearch(e.target.value)} />
              {customers.length > 0 && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 6, marginTop: 4, background: 'white', boxShadow: 'var(--shadow-md)' }}>
                  {customers.map(c => (
                    <div key={c.id} style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid var(--border)' }}
                      onClick={() => { setForm(p => ({ ...p, customerId: c.id })); setSearch(`${c.firstName} ${c.lastName}`); setCustomers([]); }}>
                      {c.firstName} {c.lastName} — {c.email}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.dueDate || ''} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">HST Rate</label>
              <select className="input" value={form.taxRate} onChange={e => setForm(p => ({ ...p, taxRate: parseFloat(e.target.value) }))}>
                <option value={0}>0% — No tax</option>
                <option value={0.05}>5% — GST</option>
                <option value={0.13}>13% — HST (ON)</option>
                <option value={0.15}>15% — HST (NS/NB/PEI)</option>
              </select>
            </div>
          </div>

          {/* Line items */}
          <div className="form-group">
            <label className="label">Line Items</label>
            <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 80px 32px', gap: 0, background: 'var(--bg)', padding: '8px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                <span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span><span></span>
              </div>
              {form.lineItems.map((line, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 80px 32px', gap: 0, padding: '6px 10px', borderTop: '1px solid var(--border)', alignItems: 'center' }}>
                  <input className="input" value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Service description" style={{ borderRadius: 4, padding: '6px 8px', fontSize: 13 }} />
                  <input className="input" type="number" value={line.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)} style={{ borderRadius: 4, padding: '6px 8px', fontSize: 13, marginLeft: 4 }} />
                  <input className="input" type="number" value={line.rate} onChange={e => updateLine(i, 'rate', e.target.value)} placeholder="0.00" style={{ borderRadius: 4, padding: '6px 8px', fontSize: 13, marginLeft: 4 }} />
                  <div style={{ marginLeft: 4, fontSize: 13, fontWeight: 600 }}>${(parseFloat(line.amount) || 0).toFixed(2)}</div>
                  <button onClick={() => { const l = form.lineItems.filter((_, j) => j !== i); setForm(p => ({ ...p, lineItems: l, subtotal: l.reduce((s, x) => s + (parseFloat(x.amount)||0), 0).toFixed(2) })); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                </div>
              ))}
              <button onClick={() => setForm(p => ({ ...p, lineItems: [...p.lineItems, { description: '', quantity: 1, rate: '', amount: 0 }] }))} style={{ width: '100%', padding: '8px', background: 'var(--bg)', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, color: 'var(--primary)', fontWeight: 600, fontFamily: "'Barlow', sans-serif" }}>+ Add Line Item</button>
            </div>
          </div>

          {/* Totals */}
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '14px 16px', marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}><span>Subtotal</span><span>${(parseFloat(form.subtotal)||0).toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8, color: 'var(--text-secondary)' }}><span>Tax ({(form.taxRate*100).toFixed(0)}%)</span><span>${tax.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", borderTop: '1px solid var(--border)', paddingTop: 8 }}><span>Total</span><span style={{ color: 'var(--primary)' }}>${total.toFixed(2)}</span></div>
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="label">Notes</label>
            <textarea className="input" value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Payment terms, special instructions..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : invoice?.id ? 'Save Changes' : 'Create Invoice'}</button>
        </div>
      </div>
    </div>
  );
}

function MarkPaidModal({ invoice, onClose, onSaved }) {
  const [method, setMethod] = useState('Credit Card');
  const [saving, setSaving] = useState(false);
  const handleMark = async () => {
    setSaving(true);
    await api.post(`/invoices/${invoice.id}/mark-paid`, { paymentMethod: method });
    onSaved(); onClose();
  };
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header"><h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700 }}>Mark as Paid</h2><button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button></div>
        <div className="modal-body">
          <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>Mark <strong>{invoice.invoiceNumber}</strong> (${parseFloat(invoice.total).toFixed(2)}) as paid?</p>
          <div className="form-group">
            <label className="label">Payment Method</label>
            <select className="input" value={method} onChange={e => setMethod(e.target.value)}>
              {['Credit Card', 'Debit Card', 'Cash', 'Cheque', 'E-Transfer', 'Other'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleMark} disabled={saving}>{saving ? '...' : '✓ Mark Paid'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [markPaidInvoice, setMarkPaidInvoice] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchInvoices = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 25 };
    if (status) params.status = status;
    api.get('/invoices', { params })
      .then(r => { setInvoices(r.data.invoices); setTotal(r.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { setPage(1); }, [status]);

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.total || 0), 0);

  return (
    <div>
      {toast && <div className="success-toast">{toast}</div>}
      {showModal && <InvoiceModal invoice={editInvoice} onClose={() => { setShowModal(false); setEditInvoice(null); }} onSaved={() => { setShowModal(false); setEditInvoice(null); fetchInvoices(); showToast('Invoice saved!'); }} />}
      {markPaidInvoice && <MarkPaidModal invoice={markPaidInvoice} onClose={() => setMarkPaidInvoice(null)} onSaved={() => { fetchInvoices(); showToast('Invoice marked as paid!'); }} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{total} total · ${totalRevenue.toLocaleString('en-CA', { minimumFractionDigits: 2 })} collected this view</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditInvoice(null); setShowModal(true); }}>+ New Invoice</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['', 'All'], ['draft', 'Draft'], ['sent', 'Sent'], ['paid', 'Paid'], ['overdue', 'Overdue']].map(([val, lbl]) => (
          <button key={val} onClick={() => setStatus(val)}
            style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid', cursor: 'pointer', fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 600, transition: 'all 0.15s', background: status===val?'var(--primary)':'var(--surface)', borderColor: status===val?'var(--primary)':'var(--border)', color: status===val?'white':'var(--text-secondary)' }}>
            {lbl}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-dark" /></div>
        : invoices.length === 0 ? <div className="empty-state"><div className="empty-state-icon">💳</div><p>No invoices found</p></div>
        : <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr><th>Invoice #</th><th>Customer</th><th>Date</th><th>Due Date</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15 }}>{inv.invoiceNumber}</td>
                    <td style={{ fontWeight: 500 }}>{inv.customer?.firstName} {inv.customer?.lastName}</td>
                    <td style={{ fontSize: 13 }}>{inv.createdAt?.split('T')[0]}</td>
                    <td style={{ fontSize: 13, color: inv.status === 'overdue' ? 'var(--danger)' : undefined }}>{inv.dueDate || '—'}</td>
                    <td style={{ fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, color: inv.status === 'paid' ? 'var(--primary)' : undefined }}>${parseFloat(inv.total).toFixed(2)}</td>
                    <td>{statusBadge(inv.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditInvoice(inv); setShowModal(true); }}>Edit</button>
                        {['sent','draft','overdue'].includes(inv.status) && <button className="btn btn-primary btn-sm" onClick={() => setMarkPaidInvoice(inv)}>Mark Paid</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  );
}
