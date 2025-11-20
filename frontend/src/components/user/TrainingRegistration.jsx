import { useEffect, useState } from 'react';
import RegisterModal from '../modals/RegisterModal';


const FONT = 'Poppins, sans-serif';
const CARD_BG = '#FEF9E1';
const PRIMARY = '#6D2323';


const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const formatTime = (timeString) => new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });


const sanitizeRichHtml = (html) => {
  if (!html) return '';
  const container = document.createElement('div');
  container.innerHTML = String(html);
  const allowedTags = new Set(['B','STRONG','I','EM','U','P','BR','UL','OL','LI','A','DIV','SPAN']);
  const traverse = (node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === 1) {
        if (!allowedTags.has(child.tagName)) {
          child.replaceWith(...Array.from(child.childNodes));
          continue;
        }
        const isLink = child.tagName === 'A';
        const allowedAttrs = isLink ? ['href','target','rel'] : [];
        for (const attr of Array.from(child.attributes)) {
          if (!allowedAttrs.includes(attr.name.toLowerCase())) {
            child.removeAttribute(attr.name);
          }
        }
        if (isLink) {
          const href = (child.getAttribute('href') || '').trim();
          if (!/^(https?:)?\/\//i.test(href)) {
            child.removeAttribute('href');
          }
          child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noopener noreferrer');
        }
        traverse(child);
      } else if (child.nodeType === 8) {
        child.remove();
      }
    }
  };
  traverse(container);
  return container.innerHTML;
};


const getExcerptFromHtml = (html, limit = 180) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = String(html);
  const text = (tmp.textContent || tmp.innerText || '').trim();
  return text.length > limit ? `${text.slice(0, limit)} ...` : text;
};


export default function TrainingRegistration() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openRegister, setOpenRegister] = useState(null);
  const [openDetails, setOpenDetails] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [newTrainingBanner, setNewTrainingBanner] = useState(null);
 
  const user = JSON.parse(localStorage.getItem('user') || 'null');


  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
       
        const programsRes = await fetch('http://localhost:5000/api/home/all-training-programs');
        if (!programsRes.ok) throw new Error('Failed to load programs');
        const programsData = await programsRes.json();
        setPrograms(programsData);
       
        // Set default selected program to first one if available
        if (programsData.length > 0) {
          setSelectedProgram(programsData[0].id);
        }
       
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();


    const handleTrainingUpdated = (event) => {
      load();
      if (event?.detail?.type === 'success' && event?.detail?.register_link === 1) {
        setNewTrainingBanner({
          message: 'A new training program is now available!',
          show: true
        });
        setTimeout(() => {
          setNewTrainingBanner(prev => prev ? { ...prev, show: false } : null);
        }, 5000);
      }
    };
   
    const handleRegistrationSuccess = () => {
      // Handle registration success if needed
    };
   
    window.addEventListener('training:updated', handleTrainingUpdated);
    window.addEventListener('training:registered', handleRegistrationSuccess);
   
    const eventSource = new EventSource('http://localhost:5000/stream');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_training' && data.register_link === 1) {
          load();
          setNewTrainingBanner({
            message: 'A new training program is now available!',
            show: true
          });
          setTimeout(() => {
            setNewTrainingBanner(prev => prev ? { ...prev, show: false } : null);
          }, 5000);
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };
    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
    };
   
    return () => {
      window.removeEventListener('training:updated', handleTrainingUpdated);
      window.removeEventListener('training:registered', handleRegistrationSuccess);
      eventSource.close();
    };
  }, []);


  const handleProgramChange = (e) => {
    const programId = e.target.value;
    setSelectedProgram(programId);
  };


  if (loading) return <div style={{ fontFamily: FONT, padding: 24 }}>Loading...</div>;
  if (error) return <div style={{ fontFamily: FONT, padding: 24, color: '#c00' }}>{error}</div>;


  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 2rem 2rem 2rem' }}>
      {newTrainingBanner && newTrainingBanner.show && (
        <>
          <style>{`
            @keyframes slideDown {
              from {
                transform: translateY(-100%);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
          `}</style>
          <div style={{
            position: 'fixed',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '900px',
            backgroundColor: '#1DA34A',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: 14,
            zIndex: 1000,
            pointerEvents: 'none',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <span>{newTrainingBanner.message}</span>
          </div>
        </>
      )}
     
      {/* Header - mirror RegistrationManagement.jsx */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ color: '#6D2323', fontWeight: 700, fontSize: 32, margin: 0 }}>Training Registration</h1>
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
          Register for upcoming training programs and view available sessions.
        </p>
      </div>
       
      {/* Dropdown with ">" arrow in center after title text */}
      <div style={{
        display: 'flex',
        justifyContent: 'left',
        marginBottom: '30px'
      }}>
        <select
          value={selectedProgram}
          onChange={handleProgramChange}
          style={{
            padding: '8px 24px 8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontFamily: FONT,
            fontSize: 14,
            background: 'white',
            minWidth: '140px',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='gray' height='16' viewBox='0 0 24 24' width='16' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center'
          }}
        >
          <option value="">Select a training program</option>
          {programs.map(program => (
            <option key={program.id} value={program.id}>
              {program.program_name}
            </option>
          ))}
        </select>
      </div>
     
      {/* Main Content Area - 2 Column Card Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)', // 2 column layout
        gap: '20px',
        marginBottom: '30px'
      }}>
        {programs.length > 0 ? (
          programs.map(p => (
            <div key={p.id} data-program-id={p.id} style={{
              background: CARD_BG,
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              fontFamily: FONT,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              height: '100%',
              border: '2px solid #6D2323',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}>
              {/* Header */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 5 }}>
                {p.profile_picture ? (
                  <img src={p.profile_picture.startsWith('http') ? p.profile_picture : `http://localhost:5000${p.profile_picture}`} alt="Profile" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #FEF9E1' }} onError={(e)=>{ e.currentTarget.style.display='none'; }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#E5D0AC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6D2323', fontWeight: 800, fontSize: 16 }}>
                    {`${(p.first_name||'').charAt(0)}${(p.last_name||'').charAt(0)}`.toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{p.first_name} {p.last_name}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>{formatDate(p.created_at)} at {new Date(p.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
                </div>
              </div>
             
              <div style={{ color: PRIMARY, fontSize: 18, fontWeight: 700, margin: '5px 0' }}>{p.program_name}</div>
             
              {p.description && (
                <div style={{ color: '#222', fontSize: 14, lineHeight: 1.4 }}>
                  {getExcerptFromHtml(p.description, 120)}
                </div>
              )}
             
              {p.upload_photo && (
                <div style={{ marginTop: 10, borderRadius: 6, overflow: 'hidden' }}>
                  <img src={`http://localhost:5000/uploads/${p.upload_photo}`} alt="program" style={{ width: '100%', borderRadius: 6, border: '1px solid #eee', objectFit: 'cover' }} />
                </div>
              )}
             
              {/* Actions */}
              <div style={{ display: 'flex', gap: 15, alignItems: 'center', marginTop: 10 }}>
                {Number(p.register_link) === 1 && (
                  <button onClick={() => setOpenRegister(p)} style={{ background: 'transparent', border: 'none', color: PRIMARY, textDecoration: 'underline', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Register here</button>
                )}
                <button onClick={() => setOpenDetails(p)} style={{ background: 'transparent', border: 'none', color: '#7B1212', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 500, fontSize: 12 }}>
                  <span role="img" aria-label="view">👁️</span>
                  View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{
            background: CARD_BG,
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontFamily: FONT,
            display: 'flex',
            flexDirection: 'column',
            gap: 15,
            gridColumn: 'span 2', // Span both columns when no programs
            border: '2px solid #6D2323'
          }}>
            {/* Workshop Image */}
            <div style={{ width: '100%', height: 200, overflow: 'hidden', borderRadius: 8 }}>
              <img
                src="https://picsum.photos/seed/workshop/800/400.jpg"
                alt="Professional Development and Team Building Workshop"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
           
            {/* Workshop Title */}
            <div style={{
              color: PRIMARY,
              fontSize: 20,
              fontWeight: 700
            }}>
              Professional Development and Team Building Workshop
            </div>
           
            {/* Workshop Description */}
            <div style={{
              color: '#333',
              fontSize: 16,
              lineHeight: 1.5
            }}>
              Join us for an engaging workshop focused on enhancing your professional skills and building stronger team dynamics.
            </div>
           
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: 15,
              marginTop: 10
            }}>
              <button
                onClick={() => setOpenRegister({ program_name: "Professional Development and Team Building Workshop" })}
                style={{
                  background: PRIMARY,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                Register here
              </button>
              <button
                onClick={() => setOpenDetails({
                  program_name: "Professional Development and Team Building Workshop",
                  description: "Join us for an engaging workshop focused on enhancing your professional skills and building stronger team dynamics."
                })}
                style={{
                  background: 'transparent',
                  border: `2px solid ${PRIMARY}`,
                  color: PRIMARY,
                  borderRadius: 6,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                View Details
              </button>
            </div>
          </div>
        )}
      </div>


      {/* Register Modal */}
      <RegisterModal
        open={!!openRegister}
        onClose={() => setOpenRegister(null)}
        defaultEmail={user?.email}
        userId={user?.id}
        trainingId={openRegister?.id}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent('training:registered'));
        }}
      />


      {/* Details Modal */}
      {openDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, width: 720, maxWidth: '92vw', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', fontFamily: FONT, position: 'relative' }}>
            <button onClick={() => setOpenDetails(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: 24 }}>✕</button>
            <div style={{ color: PRIMARY, fontWeight: 700, fontSize: 20, marginBottom: 10 }}>{openDetails.program_name}</div>
            {openDetails.upload_photo && (
              <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden' }}>
                <img src={`http://localhost:5000/uploads/${openDetails.upload_photo}`} alt="program" style={{ width: '100%', borderRadius: 8, border: '1px solid #eee', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 15, fontSize: 14, color: '#333' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, minWidth: '100px' }}>Instructor:</span>
                <div>{openDetails.instructor || 'Not specified'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, minWidth: '100px' }}>Date:</span>
                <div>{formatDate(openDetails.date)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, minWidth: '100px' }}>Time:</span>
                <div>{formatTime(openDetails.time)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, minWidth: '100px' }}>Venue:</span>
                <div>{openDetails.venue || 'Not specified'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, minWidth: '100px' }}>Mode:</span>
                <div>{openDetails.mode || 'Not specified'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, minWidth: '100px' }}>Max Participants:</span>
                <div>{openDetails.max_participants || 'Not specified'}</div>
              </div>
            </div>
            {openDetails.description && (
              <>
                <style>{`
                  .rich-content ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
                  .rich-content ol { list-style: decimal; padding-left: 1.25rem; margin: 0.5rem 0; }
                  .rich-content li { margin: 0.25rem 0; }
                  .rich-content a { color: #1d4ed8; text-decoration: underline; }
                  .rich-content p { margin: 0.5rem 0; }
                `}</style>
                <div
                  className="rich-content"
                  style={{ background: '#f8f9fa', border: '1px solid #eee', borderRadius: 8, padding: 15, fontSize: 14, lineHeight: 1.5 }}
                  dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(openDetails.description) }}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

