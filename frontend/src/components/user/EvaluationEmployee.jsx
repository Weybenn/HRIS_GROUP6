import { useEffect, useState } from 'react';
import { CheckCircle, FileSpreadsheet } from 'lucide-react';
import EvaluationFormModal from '../modals/EvaluationFormModal';

const FONT = 'Poppins, sans-serif';
const HEADER_COLOR = '#6D2323';

export default function EvaluationEmployee() {
  const [user, setUser] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    setUser(u || null);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/evaluation/completed?user_id=${user.id}`);
        if (!res.ok) throw new Error('Failed to load completed trainings');
        const data = await res.json();
        setPrograms(data || []);
      } catch (e) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const closeModal = () => setSelected(null);
  const onEvaluated = (registrationId) => {
    setPrograms(prev => prev.map(p => p.registration_id === registrationId ? { ...p, evaluated: 1 } : p));
    closeModal();
  };

  if (loading) {
    return (
      <div style={{ fontFamily: FONT, minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 16, color: '#666' }}>Loading your completed trainings...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 2rem 2rem 2rem' }}>
      {/* Header - mirror RegistrationManagement.jsx */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ color: '#6D2323', fontWeight: 700, fontSize: 32, margin: 0 }}>Training Evaluations</h1>
        </div>
        <p
          style={{
            color: '#666',
            fontSize: 18,
            margin: 0,
            fontFamily: FONT,
            maxWidth: 1220,
          }}
        >
          Please evaluate the training programs you have completed. Your feedback helps us improve future sessions.
        </p>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 6, border: '1px solid #f5c6cb', background: '#f8d7da', color: '#721c24', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Card-based list */}
      <div>
        {programs.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            fontSize: 18,
            padding: '40px 0'
          }}>
            No completed trainings available for evaluation.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '24px'
          }}>
            {programs.map((p, idx) => {
              const programKey = p.registration_id || `${p.program_name}-${idx}`;
              return (
                <div
                  key={programKey}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e5e5',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {/* Photo (if exists; fallback to placeholder) */}
                  <div style={{ marginBottom: '16px' }}>
                    <img
                      src={p.upload_photo ? `http://localhost:5000/uploads/${p.upload_photo}` : `http://localhost:5000/uploads/program/blank_image.png`}
                      alt="Program"
                      style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }}
                    />
                  </div>

                  {/* Program Name */}
                  <h3 style={{
                    color: HEADER_COLOR,
                    fontSize: '20px',
                    fontWeight: '600',
                    margin: '0 0 8px 0',
                    fontFamily: FONT
                  }}>
                    {p.program_name}
                  </h3>

                  {/* Program Date */}
                  <p style={{
                    color: '#666',
                    fontSize: '14px',
                    margin: '0 0 12px 0',
                    fontFamily: FONT
                  }}>
                    {p?.date ? new Date(p.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBA'}
                  </p>

                  {/* Status and Action Row (directly below date) */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#10B981', fontWeight: 600, background: '#d1fae5', padding: '4px 10px', borderRadius: 12, fontSize: 12, display: 'inline-block' }}>
                      Completed
                    </span>
                    {p.evaluated ? (
                      <button
                        disabled
                        style={{ padding: '8px 12px', background: '#e5e7eb', color: '#6B7280', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                      >
                        <CheckCircle size={16} color="#6B7280" /> Submitted
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelected(p)}
                        style={{ padding: '8px 12px', background: HEADER_COLOR, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                      >
                        <FileSpreadsheet size={16} /> Evaluate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <EvaluationFormModal
          registration={selected}
          userId={user?.id}
          onClose={closeModal}
          onSubmitted={() => onEvaluated(selected.registration_id)}
        />
      )}
    </div>
  );
}



