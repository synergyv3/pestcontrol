import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import api from '../api/axios';

const statusColor = { pending: '#F59E0B', scheduled: '#2563EB', in_progress: '#D97706', completed: '#059669', cancelled: '#94A3B8' };
const priorityBorder = { low: '#94A3B8', normal: '#059669', high: '#F59E0B', urgent: '#DC2626' };

export default function Schedule() {
  const navigate = useNavigate();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  useEffect(() => {
    setLoading(true);
    const startDate = format(currentWeekStart, 'yyyy-MM-dd');
    const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');
    api.get('/work-orders/schedule', { params: { startDate, endDate } })
      .then(r => setJobs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentWeekStart]);

  const jobsForDay = (day) => jobs.filter(j => {
    try { return isSameDay(parseISO(j.scheduledDate), day); } catch { return false; }
  }).sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''));

  const today = new Date();
  const totalJobs = jobs.filter(j => j.status !== 'cancelled').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Schedule</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
            Week of {format(currentWeekStart, 'MMMM d')} — {format(addDays(currentWeekStart, 6), 'MMMM d, yyyy')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Today</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrentWeekStart(d => addDays(d, -7))}>← Prev</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrentWeekStart(d => addDays(d, 7))}>Next →</button>
        </div>
      </div>

      {/* Week summary */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'This Week Total', value: totalJobs, color: '#2563EB', bg: '#DBEAFE' },
          { label: 'Completed', value: completedJobs, color: '#059669', bg: '#D1FAE5' },
          { label: 'Remaining', value: totalJobs - completedJobs, color: '#D97706', bg: '#FEF3C7' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-dark" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, overflowX: 'auto' }}>
          {weekDays.map(day => {
            const dayJobs = jobsForDay(day);
            const isToday = isSameDay(day, today);
            return (
              <div key={day.toISOString()} style={{ minWidth: 130 }}>
                {/* Day header */}
                <div style={{ textAlign: 'center', padding: '10px 8px', marginBottom: 8, borderRadius: 8, background: isToday ? '#0F172A' : 'var(--surface)', border: `1px solid ${isToday ? '#0F172A' : 'var(--border)'}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: isToday ? '#94A3B8' : 'var(--text-muted)' }}>{format(day, 'EEE')}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: isToday ? '#fff' : 'var(--text-primary)' }}>{format(day, 'd')}</div>
                  {dayJobs.length > 0 && <div style={{ fontSize: 11, color: isToday ? '#059669' : 'var(--text-muted)', fontWeight: 600 }}>{dayJobs.length} job{dayJobs.length !== 1 ? 's' : ''}</div>}
                </div>

                {/* Jobs for this day */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dayJobs.length === 0 ? (
                    <div style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>—</div>
                  ) : dayJobs.map(job => (
                    <div key={job.id} onClick={() => navigate(`/work-orders/${job.id}`)}
                      style={{ background: 'var(--surface)', borderRadius: 7, padding: '10px 10px', cursor: 'pointer', border: '1px solid var(--border)', borderLeft: `3px solid ${priorityBorder[job.priority] || '#94A3B8'}`, transition: 'box-shadow 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: statusColor[job.status], textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                        {job.scheduledTime || '—'} · {job.status?.replace('_', ' ')}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 3 }}>
                        {job.customer?.firstName} {job.customer?.lastName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{job.serviceType}</div>
                      {job.technician && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>👤 {job.technician.firstName} {job.technician.lastName}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
