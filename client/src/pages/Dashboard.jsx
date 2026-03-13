import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { format } from 'date-fns';

const statusBadge = (s) => {
  const m = { pending: ['badge-yellow','Pending'], scheduled: ['badge-blue','Scheduled'], in_progress: ['badge-orange','In Progress'], completed: ['badge-green','Completed'], cancelled: ['badge-gray','Cancelled'] };
  const [cls, label] = m[s] || ['badge-gray', s];
  return <span className={`badge ${cls}`}>{label}</span>;
};
const priorityDot = (p) => {
  const c = { low: '#94A3B8', normal: '#059669', high: '#F59E0B', urgent: '#DC2626' };
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c[p] || '#94A3B8', marginRight: 6 }} />;
};

export default function Dashboard() {
  const { user, isManager } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner spinner-dark" /></div>;

  const { stats = {}, upcomingJobs = [] } = data || {};

  const statCards = [
    { label: 'Active Customers', value: stats.activeCustomers ?? '—', icon: '👥', color: '#2563EB', bg: '#DBEAFE', link: '/customers' },
    { label: "Today's Jobs", value: stats.todayJobs ?? '—', icon: '📋', color: '#D97706', bg: '#FEF3C7', link: '/schedule' },
    { label: 'Completed This Month', value: stats.completedThisMonth ?? '—', icon: '✅', color: '#059669', bg: '#D1FAE5', link: '/work-orders?status=completed' },
    { label: 'Pending Jobs', value: stats.pendingJobs ?? '—', icon: '⏳', color: '#7C3AED', bg: '#EDE9FE', link: '/work-orders?status=pending' },
    ...(isManager ? [
      { label: 'Revenue This Month', value: `$${Number(stats.revenueThisMonth || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, icon: '💰', color: '#065F46', bg: '#D1FAE5', link: '/invoices' },
      { label: 'Overdue Invoices', value: stats.overdueInvoices ?? '—', icon: '⚠️', color: '#DC2626', bg: '#FEE2E2', link: '/invoices?status=overdue' },
    ] : []),
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.firstName} 👋</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        {isManager && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => navigate('/customers/new')}>+ Customer</button>
            <button className="btn btn-primary" onClick={() => navigate('/work-orders/new')}>+ Work Order</button>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {statCards.map((s) => (
          <div key={s.label} className="card" style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', padding: 20 }}
            onClick={() => navigate(s.link)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 700, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming jobs table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700 }}>Upcoming Jobs</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/schedule')}>View Schedule →</button>
        </div>

        {upcomingJobs.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📅</div><p>No upcoming jobs scheduled</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Time</th><th>Customer</th><th>Service Type</th><th>Technician</th><th>Priority</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingJobs.map(job => (
                  <tr key={job.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/work-orders/${job.id}`)}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{job.scheduledDate}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{job.scheduledTime || '—'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{job.customer?.firstName} {job.customer?.lastName}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{job.customer?.city}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{job.serviceType}</td>
                    <td style={{ fontSize: 13 }}>{job.technician ? `${job.technician.firstName} ${job.technician.lastName}` : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                    <td>{priorityDot(job.priority)}<span style={{ fontSize: 13, textTransform: 'capitalize' }}>{job.priority}</span></td>
                    <td>{statusBadge(job.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
