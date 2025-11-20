import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FONT = 'Poppins, sans-serif';
const TEXT_COLOR = '#6D2323';

export default function RegistrationManagement() {
  const navigate = useNavigate();
  const [trainingPrograms, setTrainingPrograms] = useState([]);
  const [setHoveredIdx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainingPrograms();
    const handleTrainingUpdated = (e) => {
      try {
        const d = e && e.detail ? e.detail : null;
        if (d && Number(d.register_link) === 1) {
          fetchTrainingPrograms();
        }
      } catch (err) { /* ignore */ }
    };
    window.addEventListener('training:updated', handleTrainingUpdated);
    return () => window.removeEventListener('training:updated', handleTrainingUpdated);
  }, []);

  const fetchTrainingPrograms = async () => {
    try {
      const response = await fetch('http://localhost:5000/registration-management/training-programs');
      if (response.ok) {
        const data = await response.json();
        data.sort((a, b) => {
          const ta = a?.date ? new Date(a.date).getTime() : Infinity;
          const tb = b?.date ? new Date(b.date).getTime() : Infinity;
          return ta - tb;
        });
        setTrainingPrograms(data);
      } else {
        console.error('Failed to fetch training programs');
      }
    } catch (error) {
      console.error('Error fetching training programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProgramClick = (program) => {
    navigate('/dashboard_admin/registration-status-update', { 
      state: { selectedProgram: program } 
    });
  };

  const handleBackClick = () => {
    navigate('/dashboard_admin/data');
  };

  if (loading) {
    return (
      <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 2rem 2rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 18, color: '#666' }}>Loading training programs...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 2rem 2rem 2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button
            onClick={handleBackClick}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 16 }}
            aria-label="Back to data"
          >
            <ArrowLeft color="#6D2323" size={32} />
          </button>
          <h1 style={{ color: '#6D2323', fontWeight: 700, fontSize: 32, margin: 0 }}>Registration Management</h1>
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
          Select a training program to manage registration statuses.
        </p>
      </div>

      {/* Training Programs List */}
      <div>
        {trainingPrograms.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            fontSize: 18,
            padding: '40px 0'
          }}>
            No training programs with registration links available.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '24px'
          }}>
            {trainingPrograms.map((program, idx) => {
              return (
                <div
                  key={program.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e5e5',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
                    setHoveredIdx(idx);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                    setHoveredIdx(null);
                  }}
                  onClick={() => handleProgramClick(program)}
                >
                  {/* Photo (if exists) */}
                  <div style={{ marginBottom: '16px' }}>
                    <img
                      src={program.upload_photo ? `http://localhost:5000/uploads/${program.upload_photo}` : `http://localhost:5000/uploads/program/blank_image.png`}
                      alt="Program"
                      style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }}
                    />
                  </div>

                  {/* Program Name */}
                  <h3 style={{
                    color: TEXT_COLOR,
                    fontSize: '20px',
                    fontWeight: '600',
                    margin: '0 0 8px 0',
                    fontFamily: FONT
                  }}>
                    {program.program_name}
                  </h3>
                  
                  {/* Program Date */}
                  <p style={{
                    color: '#666',
                    fontSize: '14px',
                    margin: '0 0 16px 0',
                    fontFamily: FONT
                  }}>
                    {new Date(program.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
