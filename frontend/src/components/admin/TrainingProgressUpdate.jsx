import { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle, XCircle, Filter, Edit3, Save, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const FONT = 'Poppins, sans-serif';

const STATUS_COLORS = {
  'Not Started': '#6B7280',
  'In Progress': '#F59E0B',
  'On Hold': '#6366F1',
  'Completed': '#10B981',
  'Incomplete': '#EF4444'
};

const STATUS_BG = {
  'Not Started': '#e5e7eb',
  'In Progress': '#fef3cd',
  'On Hold': '#e0e7ff',
  'Completed': '#d1fae5',
  'Incomplete': '#fee2e2'
};

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

export default function TrainingProgressUpdate() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedProgram = location.state?.selectedProgram;
  
  const [registrations, setRegistrations] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingProgress, setEditingProgress] = useState(null);
  const [tempProgress, setTempProgress] = useState('');

  useEffect(() => {
    if (selectedProgram) {
      fetchRegistrations(selectedProgram.id);
      fetchRegistrationStats(selectedProgram.id);
    } else {
      navigate('/dashboard_admin/training-management');
    }
  }, [selectedProgram, navigate]);

  const formatTime12h = (timeStr) => {
    if (!timeStr) return '—';
    const trimmed = String(timeStr).trim();
    if (/(am|pm)$/i.test(trimmed)) {
      const up = trimmed.replace(/\s+/g, ' ').toUpperCase();
      const [hm, suffix] = up.split(' ');
      const [h = '0', m = '00'] = hm.split(':');
      return `${h}:${String(m).padStart(2,'0')} ${suffix}`;
    }
    const [hStr = '0', mStr = '00'] = trimmed.split(':');
    let hour = Number(hStr);
    const minute = Number(mStr);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${String(minute).padStart(2,'0')} ${ampm}`;
  };

  const fetchRegistrations = async (programId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/training-management/training-programs/${programId}/participants`);
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data);
      } else {
        console.error('Failed to fetch participants');
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch aggregated registration stats so counts match the HomeAdmin bar chart
  const fetchRegistrationStats = async (programId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/home/training-programs/${programId}/registrations-stats`);
      if (response.ok) {
        const data = await response.json();
        setSummaryStats(data);
      } else {
        console.error('Failed to fetch registration stats for summary header');
      }
    } catch (error) {
      console.error('Error fetching registration stats:', error);
    }
  };

  const handleProgressUpdate = async (registrationId, newProgress) => {
    try {
      const response = await fetch(`${API_BASE_URL}/registration-management/registrations/${registrationId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress_status: newProgress, admin_id: 1 })
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setRegistrations(prev => prev.map(r => r.id === registrationId ? {
          ...r,
          progress_status: newProgress,
          completed_at: newProgress === 'Completed' ? (payload.completed_at || new Date().toISOString()) : null,
        } : r));
        setEditingProgress(null);
      } else {
        console.error('Failed to update progress status', payload);
      }
    } catch (error) {
      console.error('Error updating progress status:', error);
    }
  };

  const startEditing = (registration) => {
    setEditingProgress(registration.id);
    setTempProgress(registration.progress_status || 'Not Started');
  };

  const cancelEditing = () => {
    setEditingProgress(null);
    setTempProgress('');
  };

  const saveProgress = () => {
    if (tempProgress && tempProgress !== registrations.find(r => r.id === editingProgress)?.progress_status) {
      handleProgressUpdate(editingProgress, tempProgress);
    } else {
      cancelEditing();
    }
  };

  const getStatusCounts = () => {
    // Always compute status counts from the registrations list so the cards
    // match exactly what is shown in the participants table.
    // We only use backend summaryStats for the overall total if available.
    const normalized = registrations.map((r) => {
      const raw = (r.progress_status || '').trim().toLowerCase();
      if (raw === 'in progress') return 'In Progress';
      if (raw === 'completed') return 'Completed';
      if (raw === 'incomplete' || raw === 'failed') return 'Incomplete';
      if (raw === 'not started' || raw === '') return 'Not Started';
      // Fallback to original value if it is some other status
      return r.progress_status || 'Not Started';
    });

    const total = summaryStats?.total ?? registrations.length;
    const notStarted = normalized.filter(s => s === 'Not Started').length;
    const inProgress = normalized.filter(s => s === 'In Progress').length;
    const completed = normalized.filter(s => s === 'Completed').length;
    const failed = normalized.filter(s => s === 'Incomplete').length;

    return { total, notStarted, inProgress, completed, failed };
  };

  const getFilteredRegistrations = () => {
    if (statusFilter === 'All') return registrations;
    return registrations.filter(r => r.progress_status === statusFilter);
  };


  if (!selectedProgram) {
    return (
      <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 2rem 2rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 18, color: '#666' }}>No program selected. Redirecting...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 2rem 2rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 18, color: '#666' }}>Loading participants...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 2rem 2rem 2rem' }}>
      {/* Program Header */}
      <div style={{ marginBottom: 24, padding: 16, background: '#FEF9E1', borderRadius: 8, border: '1px solid #e9ecef' }}>
        <h2 style={{ color: '#6D2323', fontWeight: 700, fontSize: 24, margin: '0 0 16px 0', fontFamily: FONT }}>
          {selectedProgram.program_name}
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e9ecef', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#000000', marginBottom: '4px', fontFamily: FONT, fontWeight: '600' }}>DATE & TIME</div>
            <div style={{ fontSize: '14px', color: '#6D2323', fontFamily: FONT, fontWeight: '600' }}>{new Date(selectedProgram.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            <div style={{ fontSize: '12px', color: '#000000', fontFamily: FONT }}>{formatTime12h(selectedProgram.time)}</div>
          </div>
          <div style={{ background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e9ecef', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#000000', marginBottom: '4px', fontFamily: FONT, fontWeight: '600' }}>VENUE & INSTRUCTOR</div>
            <div style={{ fontSize: '14px', color: '#6D2323', fontFamily: FONT, fontWeight: '600', marginBottom: '2px' }}>{selectedProgram.venue || 'TBA'}</div>
            <div style={{ fontSize: '12px', color: '#000000', fontFamily: FONT }}>{selectedProgram.instructor || 'TBA'}</div>
          </div>
          <div style={{ background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #e9ecef', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#000000', marginBottom: '4px', fontFamily: FONT, fontWeight: '600' }}>MODE & CAPACITY</div>
            <div style={{ fontSize: '14px', color: '#6D2323', fontFamily: FONT, fontWeight: '600', marginBottom: '2px' }}>{selectedProgram.mode}</div>
            <div style={{ fontSize: '12px', color: '#000000', fontFamily: FONT }}>Max Participants: {selectedProgram.max_participants || 'Unlimited'}</div>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      {(() => {
        const counts = getStatusCounts();
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #FEF9E1 100%)', padding: 20, borderRadius: 12, border: '2px solid #c49543', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <Users size={28} color="#c49543" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 28, fontWeight: 600, color: '#c49543', fontFamily: FONT, marginBottom: 4 }}>{counts.total}</div>
              <div style={{ fontSize: 16, color: '#c49543', fontFamily: FONT, fontWeight: 500 }}>Participants</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #fef3cd 0%, #fde68a 100%)', padding: 20, borderRadius: 12, border: '2px solid #f59e0b', textAlign: 'center', boxShadow: '0 2px 8px rgba(245,158,11,0.2)' }}>
              <Clock size={28} color="#F59E0B" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 28, fontWeight: 600, color: '#F59E0B', fontFamily: FONT, marginBottom: 4 }}>{counts.inProgress}</div>
              <div style={{ fontSize: 16, color: '#F59E0B', fontFamily: FONT, fontWeight: 500 }}>In Progress</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', padding: 20, borderRadius: 12, border: '2px solid #10b981', textAlign: 'center', boxShadow: '0 2px 8px rgba(16,185,129,0.2)' }}>
              <CheckCircle size={28} color="#10B981" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 28, fontWeight: 600, color: '#10B981', fontFamily: FONT, marginBottom: 4 }}>{counts.completed}</div>
              <div style={{ fontSize: 16, color: '#10B981', fontFamily: FONT, fontWeight: 500 }}>Completed</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', padding: 20, borderRadius: 12, border: '2px solid #ef4444', textAlign: 'center', boxShadow: '0 2px 8px rgba(239,68,68,0.2)' }}>
              <XCircle size={28} color="#EF4444" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 28, fontWeight: 600, color: '#EF4444', fontFamily: FONT, marginBottom: 4 }}>{counts.failed}</div>
              <div style={{ fontSize: 16, color: '#EF4444', fontFamily: FONT, fontWeight: 500 }}>Incomplete</div>
            </div>
          </div>
        );
      })()}

      {/* Filter and Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Filter size={20} color="#6D2323" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 24px 8px 12px', borderRadius: 4, border: '1px solid #ddd', fontFamily: FONT, fontSize: 14, background: 'white', minWidth: '140px', appearance: 'none', backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='gray' height='16' viewBox='0 0 24 24' width='16' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
          >
            <option value="All">All Status</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Incomplete">Incomplete</option>
          </select>
        </div>
        <button
          onClick={() => navigate('/dashboard_admin/training-management')}
          style={{ padding: '8px 16px', background: '#6D2323', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: FONT, fontSize: 14 }}
        >
          Back to Programs
        </button>
      </div>

      {/* Participants List */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e9ecef', overflow: 'hidden' }}>
        {getFilteredRegistrations().length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#666', fontFamily: FONT }}>
            No participants found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
              <thead>
                <tr style={{ background: '#6D2323', borderBottom: '1px solid #e9ecef' }}>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: 'white' }}>Employee ID</th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: 'white' }}>Employee</th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: 'white' }}>Department</th>
                  <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: 'white' }}>Progress</th>
                  <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: 'white' }}>Date Completed</th>
                  <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: 'white' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredRegistrations().map((registration) => (
                  <tr key={registration.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: 12, color: '#000000' }}>{registration.employee_id}</td>
                    <td style={{ padding: 12, color: '#000000' }}>
                      <div style={{ fontWeight: 600 }}>
                        {registration.first_name} {registration.last_name}
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {registration.email || "no-email@example.com"}
                      </div>
                    </td>
                    <td style={{ padding: 12, color: '#000000' }}>{registration.department}</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      {editingProgress === registration.id ? (
                        <select value={tempProgress} onChange={(e) => setTempProgress(e.target.value)} style={{ padding: '4px 20px 4px 8px', borderRadius: 4, border: '1px solid #ddd', fontFamily: FONT, fontSize: 12, background: 'white', minWidth: '140px', appearance: 'none', backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='gray' height='14' viewBox='0 0 24 24' width='14' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}>
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Completed">Completed</option>
                          <option value="Incomplete">Incomplete</option>
                        </select>
                      ) : (
                        <span
                          style={{
                            color: STATUS_COLORS[registration.progress_status],
                            fontWeight: 600,
                            background: STATUS_BG[registration.progress_status],
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 12,
                            display: 'inline-block'
                          }}
                        >
                          {registration.progress_status || 'Not Started'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 12, color: '#000000', textAlign: 'center' }}>
                      {registration.progress_status === 'Completed'
                        ? new Date(registration.completed_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric'
                          })
                        : '–'}
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      {editingProgress === registration.id ? (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button onClick={saveProgress} style={{ padding: '4px 8px', background: '#10B981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: FONT, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Save size={12} />Save</button>
                          <button onClick={cancelEditing} style={{ padding: '4px 8px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: FONT, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><X size={12} />Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button onClick={() => startEditing(registration)} style={{ padding: '4px 8px', background: '#F59E0B', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: FONT, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Edit3 size={12} />Edit</button>
                        </div>
                      )}
                    </td>
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
