import { useState, useEffect } from 'react';
import { Users, Printer, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const FONT = 'Poppins, sans-serif';

const STATUS_COLORS = { 'Approved': '#10B981' };
const STATUS_BG = { 'Approved': '#d1fae5' };

export default function RegistrationStatusUpdate() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedProgram = location.state?.selectedProgram;
  
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printLoading, setPrintLoading] = useState(false);

  useEffect(() => {
    if (selectedProgram) {
      fetchRegistrations(selectedProgram.id);
    } else {
      navigate('/dashboard_admin/registration-management');
    }
  }, [selectedProgram, navigate]);

  const formatTime12h = (timeStr) => {
    if (!timeStr) return '—';
    const trimmed = String(timeStr).trim();
    if (/(am|pm)$/i.test(trimmed)) {
      const up = trimmed.replace(/\s+/g, ' ').toUpperCase();
      const [hm, suffix] = up.split(' ');
      const [h = '0', m = '00'] = hm.split(':');
      return `${h}:${m.padStart(2,'0')} ${suffix}`;
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
      const response = await fetch(`http://localhost:5000/registration-management/training-programs/${programId}/registrations`);
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data);
      } else {
        console.error('Failed to fetch registrations');
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const printList = () => {
    try {
      setPrintLoading(true);
      const title = selectedProgram?.program_name || 'Training Program';
      const department = selectedProgram?.department || '';

      const formatTime12h = (timeStr) => {
        if (!timeStr) return '—';
        const ampmMatch = /(am|pm)$/i.test(timeStr.trim());
        if (ampmMatch) {
          const parts = timeStr.trim().replace(/\s+/g,' ').toUpperCase();
          const [hm] = parts.split(' ');
          const [h, m] = hm.split(':');
          return `${h}:${m} ${parts.endsWith('AM') ? 'AM' : 'PM'}`;
        }
        const [hStr = '0', mStr = '00'] = String(timeStr).split(':');
        let hour = Number(hStr);
        const minute = Number(mStr);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        const mm = String(minute).padStart(2, '0');
        return `${hour}:${mm} ${ampm}`;
      };

      const details = [
        `Date: ${new Date(selectedProgram.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        `Time: ${formatTime12h(selectedProgram.time)}`,
        `Venue: ${selectedProgram.venue || '—'}`,
        `Instructor: ${selectedProgram.instructor || '—'}`,
        `Mode: ${selectedProgram.mode}`,
        `Max Participants: ${selectedProgram.max_participants || '—'}`
      ];

      const namesRows = registrations
        .sort((a,b) => (a.last_name || '').localeCompare(b.last_name || ''))
        .map((r, i) => `
          <tr>
            <td style=\"padding:8px;border:1px solid #000;text-align:center;width:56px;\">${i+1}</td>
            <td style=\"padding:8px;border:1px solid #000;\">${r.last_name}, ${r.first_name}</td>
            <td style=\"padding:8px;border:1px solid #000;height:28px;\"></td>
          </tr>`)
        .join('');

      const html = `<!doctype html>
<html><head><meta charset=\"utf-8\" />
<title>Registrants - ${title}</title>
<style>
  body{font-family:${FONT};padding:24px;color:#111}
  h1{margin:0 0 4px 0;text-align:center;color:#111}
  h4{margin:0 0 12px 0;text-align:center;color:#444;font-weight:600}
  .details{margin:0 0 16px 0;}
  .details div{margin:2px 0}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th,td{font-size:14px}
  th{background:#f5f5f5}
  @media print { @page { size: auto; margin: 16mm; } }
</style>
</head>
<body>
  <h1>${title}</h1>
  ${department ? `<h4>${department}</h4>` : ''}
  <div class=\"details\">
    ${details.map(d => `<div>${d}</div>`).join('')}
  </div>
  <table>
    <thead>
      <tr>
        <th style=\"padding:8px;border:1px solid #000;width:56px;text-align:center;\">No.</th>
        <th style=\"padding:8px;border:1px solid #000;text-align:center;\">Participant Name</th>
        <th style=\"padding:8px;border:1px solid #000;text-align:center;width:35%;\">Signature</th>
      </tr>
    </thead>
    <tbody>${namesRows}</tbody>
  </table>
  <script>
    window.onload = () => {
      try { window.focus(); } catch(e) {}
      window.print();
    };
  </script>
</body></html>`;
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const cleanup = () => {
        setTimeout(() => {
          if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 600);
      };

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      doc.open();
      doc.write(html);
      doc.close();

      const afterPrint = () => {
        cleanup();
        window.removeEventListener('afterprint', afterPrint);
      };
      window.addEventListener('afterprint', afterPrint);
    } finally {
      setPrintLoading(false);
    }
  };

  const startEditing = (registration) => {
    setEditingStatus(registration.id);
    setTempStatus(registration.status);
  };

  const cancelEditing = () => {
    setEditingStatus(null);
    setTempStatus('');
  };

  const saveStatus = () => {
    if (tempStatus && tempStatus !== registrations.find(r => r.id === editingStatus)?.status) {
      handleStatusUpdate(editingStatus, tempStatus);
    } else {
      cancelEditing();
    }
  };

  const getStatusCounts = () => {
    const total = registrations.length;
    const approved = registrations.filter(r => r.status === 'Approved').length;
    return { total, approved };
  };

  const getFilteredRegistrations = () => registrations;


  if (!selectedProgram) {
    return (
      <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 2rem 2rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 18, color: '#000000' }}>No program selected. Redirecting...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 2rem 2rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 18, color: '#000000' }}>Loading registrations...</div>
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
        
        {/* Program Details Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '16px',
          marginBottom: '16px'
        }}>
          {/* Column 1: Date and Time */}
          <div style={{ 
            background: 'white', 
            padding: '12px', 
            borderRadius: '6px', 
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#000000', marginBottom: '4px', fontFamily: FONT, fontWeight: '600' }}>
              DATE & TIME
            </div>
            <div style={{ fontSize: '14px', color: '#6D2323', fontFamily: FONT, fontWeight: '600' }}>
              {new Date(selectedProgram.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div style={{ fontSize: '12px', color: '#000000', fontFamily: FONT }}>
              {formatTime12h(selectedProgram.time)}
            </div>
          </div>

          {/* Column 2: Venue and Instructor */}
          <div style={{ 
            background: 'white', 
            padding: '12px', 
            borderRadius: '6px', 
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#000000', marginBottom: '4px', fontFamily: FONT, fontWeight: '600' }}>
              VENUE & INSTRUCTOR
            </div>
            <div style={{ fontSize: '14px', color: '#6D2323', fontFamily: FONT, fontWeight: '600', marginBottom: '2px' }}>
              {selectedProgram.venue || 'TBA'}
            </div>
            <div style={{ fontSize: '12px', color: '#000000', fontFamily: FONT }}>
              {selectedProgram.instructor || 'TBA'}
            </div>
          </div>

          {/* Column 3: Mode and Max Participants */}
          <div style={{ 
            background: 'white', 
            padding: '12px', 
            borderRadius: '6px', 
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#000000', marginBottom: '4px', fontFamily: FONT, fontWeight: '600' }}>
              MODE & CAPACITY
            </div>
            <div style={{ fontSize: '14px', color: '#6D2323', fontFamily: FONT, fontWeight: '600', marginBottom: '2px' }}>
              {selectedProgram.mode}
            </div>
            <div style={{ fontSize: '12px', color: '#000000', fontFamily: FONT }}>
              Max Participants: {selectedProgram.max_participants || 'Unlimited'}
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      {(() => {
        const counts = getStatusCounts();
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #f8f9fa 0%, #FEF9E1 100%)', 
              padding: 20, 
              borderRadius: 12, 
              border: '2px solid #c49543', 
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Users size={28} color="#c49543" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 28, fontWeight: 700, color: '#c49543', fontFamily: FONT, marginBottom: 4 }}>{counts.total}</div>
              <div style={{ fontSize: 16, color: '#c49543', fontFamily: FONT, fontWeight: 600 }}>Registrants</div>
            </div>
            <div style={{ 
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
              padding: 20, 
              borderRadius: 12, 
              border: '2px solid #10b981', 
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(16,185,129,0.2)'
            }}>
              <CheckCircle size={28} color="#10B981" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 28, fontWeight: 700, color: '#10B981', fontFamily: FONT }}>{counts.approved}</div>
              <div style={{ fontSize: 14, color: '#10B981', fontFamily: FONT, fontWeight: 600, marginBottom: 6 }}>Approved</div>
            </div>
          </div>
        );
      })()}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={printList}
            disabled={printLoading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 16px',
              background: '#2563EB',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: FONT,
              fontSize: 14,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
          >
            <Printer size={18} />
            {printLoading ? 'Preparing…' : 'Print'}
          </button>
          <button
            onClick={() => navigate('/dashboard_admin/registration-management')}
            style={{
              padding: '10px 16px',
              background: '#6D2323',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: FONT,
              fontSize: 14,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
          >
            Back to Programs
          </button>
        </div>
      </div>

      {/* Registrations List */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e9ecef', overflow: 'hidden' }}>
        {getFilteredRegistrations().length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#000000', fontFamily: FONT }}>
            No registrations found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
              <thead>
                <tr style={{ background: '#6D2323', borderBottom: '1px solid #e9ecef' }}>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: 'white' }}>Employee ID</th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: 'white' }}>Employee</th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: 'white' }}>Department</th>
                  <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: 'white' }}>Status</th>
                  <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: 'white' }}>Date Submitted</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => (
                  <tr key={registration.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: 12, color: '#000000' }}>
                      {registration.employee_id}
                    </td>
                    <td style={{ padding: 12, color: '#000000' }}>
                      <div style={{ fontWeight: 600 }}>
                        {registration.first_name} {registration.last_name}
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                          {registration.email || "no-email@example.com"}
                      </div>
                    </td>
                    <td style={{ padding: 12, color: '#000000' }}>
                      {registration.department}
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <span
                        style={{
                          color: STATUS_COLORS[registration.status],
                          fontWeight: 600,
                          background: STATUS_BG[registration.status],
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 12,
                          display: 'inline-block'
                        }}
                      >
                        {registration.status}
                      </span>
                    </td>
                    <td style={{ padding: 12, color: '#000000', textAlign: 'center' }}>
                      {new Date(registration.submitted_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric'
                          }
                        )
                      }
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
