import { useState, useEffect, useMemo } from 'react';
import { Trash2, Calendar, Clock, MapPin, User, Users, Eye, Info, Edit3, Search, HeartHandshake, CirclePlus, BookOpen } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import AddTrainingModal from '../modals/AddTrainingModal';

const FONT = 'Poppins, sans-serif';
const PRIMARY_COLOR = '#6D2323';
const SECONDARY = '#FEF9E1';
const ACCENT_COLOR = '#C97C5D';

export default function TrainingPrograms() {
  const [trainingPrograms, setTrainingPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteMessage, setDeleteMessage] = useState({ type: '', message: '' });
  const [actionMessage, setActionMessage] = useState({ type: '', message: '' });
  const [expandedCard, setExpandedCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    fetchTrainingPrograms();
    const handler = () => fetchTrainingPrograms();
    window.addEventListener('training:updated', handler);
    return () => window.removeEventListener('training:updated', handler);
  }, []);

  useEffect(() => {
    if (!trainingPrograms || trainingPrograms.length === 0) return;
    const scrollToId = location?.state?.scrollToId;
    if (scrollToId) {
      setTimeout(() => {
        const el = document.querySelector(`[data-program-id="${scrollToId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.boxShadow = '0 0 0 4px rgba(163,29,29,0.08)';
          setTimeout(() => { el.style.boxShadow = ''; }, 1600);
        }
      }, 300);
    }
  }, [trainingPrograms, location]);

  const fetchTrainingPrograms = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/training-programs');
      if (!response.ok) {
        throw new Error('Failed to fetch training programs');
      }
      const data = await response.json();
      setTrainingPrograms(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await new Promise((resolve) => {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.inset = '0';
      container.style.zIndex = '2000';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';
      container.style.background = 'rgba(0,0,0,0.3)';
      container.style.fontFamily = FONT;
      container.innerHTML = `
        <div style="background:#fff;border-radius:16px;box-shadow:0 4px 32px #0002;padding:24px 28px;min-width:320px;max-width:380px;text-align:center;">
          <div style="font-size:18px;color:#222;margin-bottom:16px;">Delete this training program?</div>
          <div style="display:flex;gap:12px;justify-content:center;">
            <button id="tp-cancel" style="background:#e5e7eb;color:#111827;border:none;border-radius:8px;padding:10px 18px;font-weight:600;cursor:pointer;">Cancel</button>
            <button id="tp-confirm" style="background:#6D2323;color:#fff;border:none;border-radius:8px;padding:10px 18px;font-weight:600;cursor:pointer;">Delete</button>
          </div>
        </div>`;
      document.body.appendChild(container);
      container.querySelector('#tp-cancel').onclick = () => { document.body.removeChild(container); resolve(false); };
      container.querySelector('#tp-confirm').onclick = () => { document.body.removeChild(container); resolve(true); };
    });

    if (!confirm) return;

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('User not logged in');
      }

      const response = await fetch(`http://localhost:5000/training-programs/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employee_id: user.employee_id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete training program');
      }

      setDeleteMessage({ type: 'success', message: 'Training program deleted successfully.' });
      fetchTrainingPrograms();

      setTimeout(() => {
        setDeleteMessage({ type: '', message: '' });
      }, 3000);

    } catch (err) {
      setDeleteMessage({ type: 'error', message: err.message });
      setTimeout(() => {
        setDeleteMessage({ type: '', message: '' });
      }, 3000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const displayedPrograms = useMemo(() => {
    const q = (searchTerm || '').toString().trim().toLowerCase();
    if (!q) return trainingPrograms;
    return trainingPrograms.filter(p => (p.program_name || '').toString().toLowerCase().includes(q));
  }, [trainingPrograms, searchTerm]);


  if (error) {
    return (
      <div style={{ 
        fontFamily: FONT, 
        minHeight: '100vh', 
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '18px', 
            color: '#dc3545',
            marginBottom: '10px'
          }}>
            Error: {error}
          </div>
          <button
            onClick={fetchTrainingPrograms}
            style={{
              backgroundColor: PRIMARY_COLOR,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              fontFamily: FONT
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        fontFamily: FONT, 
        minHeight: '100vh', 
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '18px', 
            color: PRIMARY_COLOR,
            marginBottom: '10px'
          }}>
            Loading training programs...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0rem 2rem 2rem 2rem' }}>
      {/* Fixed Top Banner for Success/Error (delete/add/update) */}
      {(actionMessage.message || deleteMessage.message) && (() => {
        const banner = actionMessage.message ? actionMessage : deleteMessage;
        return (
          <div style={{
            position: 'fixed',
            top: 12,
            left: 16,
            right: 16,
            margin: '0 auto',
            maxWidth: 900,
            backgroundColor: banner.type === 'success' ? '#1DA34A' : '#6D2323',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 10,
            boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
            textAlign: 'center',
            fontWeight: 500,
            zIndex: 300,
            pointerEvents: 'none'
          }}>
            <span>{banner.message}</span>
            <span style={{ position: 'absolute', right: 16, top: 22, transform: 'translateY(-50%)', opacity: 0.9 }}>
              <Info size={18} />
            </span>
          </div>
        );
      })()}
      
      {/* Header Section with NotificationAdmin Style */}
      <div style={{ 
        marginBottom: 16,
        background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${ACCENT_COLOR})`,
        padding: '16px 20px',
        borderRadius: '8px',
        color: '#fff',
        boxShadow: '0 2px 8px rgba(109, 35, 35, 0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ 
              fontWeight: 700, 
              fontSize: 22,
              margin: '0 0 4px 0',
              fontFamily: FONT,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <BookOpen size={22} /> Training Programs
            </h1>
            <p style={{ 
              margin: 0,
              fontFamily: FONT,
              opacity: 0.9,
              fontSize: '14px'
            }}>
              {displayedPrograms.length} {searchTerm ? 'matching' : 'total'} programs
            </p>
          </div>
        </div>
      </div>

      {/* Search Field and Add Training Button Row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 50 }}>
        <div style={{ flex: 1, maxWidth: 720 }}>
          <label htmlFor="tp-search" style={{ display: 'block', marginBottom: 8, color: '#6D2323', fontWeight: 600 }}>Find a training program</label>
          <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #6D2323', borderRadius: 8, padding: '8px 12px' }}>
            <input
              id="tp-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search trainings..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, color: '#6D2323' }}
            />
            <Search size={20} color="#6D2323" />
          </div>
        </div>
        <div>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              background: '#6D2323',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              fontFamily: FONT,
              borderRadius: 6,
              padding: '10px 14px',
              cursor: 'pointer'
            }}
          >
            <CirclePlus size={18} color={'#fff'} /> Add Training
          </button>
        </div>
      </div>

      {/* Training Programs Grid */}
      {displayedPrograms.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: '#666',
          fontSize: '18px'
        }}>
          {trainingPrograms.length === 0 ? 'No training programs found. Create your first training program!' : `No training programs match "${searchTerm}"`}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '24px'
        }}>
          {displayedPrograms.map((program) => (
            <div
              key={program.id}
              data-program-id={program.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e5e5',
                transition: 'transform 0.2s, box-shadow 0.2s',
                height: 'fit-content'
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
              {/* Header with Delete Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginBottom: '16px',
                gap: 8
              }}>
                <button
                  onClick={() => { setEditingProgram(program); setIsModalOpen(true); }}
                  style={{
                    backgroundColor: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0ea66a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#10B981'}
                >
                  <Edit3 size={16} />
                  Update
                </button>
                <button
                  onClick={() => handleDelete(program.id)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '14px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>

              {/* Photo (use upload or fallback blank image) */}
              <div style={{ marginBottom: '16px' }}>
                <img
                  src={program.upload_photo ? `http://localhost:5000/uploads/${program.upload_photo}` : `http://localhost:5000/uploads/program/blank_image.png`}
                  alt="Program"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }}
                />
              </div>

              {/* Program Name */}
              <h3 style={{
                color: PRIMARY_COLOR,
                fontSize: '20px',
                fontWeight: '600',
                margin: '0 0 16px 0',
                fontFamily: FONT
              }}>
                {program.program_name}
              </h3>

              {/* Program Details */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <Calendar size={16} style={{ color: PRIMARY_COLOR, marginRight: '8px' }} />
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {formatDate(program.date)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <Clock size={16} style={{ color: PRIMARY_COLOR, marginRight: '8px' }} />
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {formatTime(program.time)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <MapPin size={16} style={{ color: PRIMARY_COLOR, marginRight: '8px' }} />
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {program.venue || 'Not specified'}
                  </span>
                </div>
                {program.department && (
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <HeartHandshake size={16} style={{ color: PRIMARY_COLOR, marginRight: '8px' }} />
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      {program.department}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <User size={16} style={{ color: PRIMARY_COLOR, marginRight: '8px' }} />
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {program.instructor || 'Not specified'}
                  </span>
                </div>
                {program.max_participants && (
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <Users size={16} style={{ color: PRIMARY_COLOR, marginRight: '8px' }} />
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      Max {program.max_participants} participants
                    </span>
                  </div>
                )}
              </div>

              {/* Mode Badge */}
              <div style={{
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'inline-block',
                marginBottom: '16px'
              }}>
                {program.mode}
              </div>

              {/* Description */}
              {program.description && (
                <div style={{ marginBottom: '16px' }}>
                  <button
                    onClick={() => setExpandedCard(expandedCard === program.id ? null : program.id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: PRIMARY_COLOR,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '14px',
                      fontFamily: FONT
                    }}
                  >
                    <Eye size={16} />
                    {expandedCard === program.id ? 'Hide' : 'View'} Description
                  </button>
                  {expandedCard === program.id && (
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
                        style={{
                          marginTop: '8px',
                          padding: '12px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#333',
                          lineHeight: '1.6',
                          wordBreak: 'break-word'
                        }}
                        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(program.description) }}
                      />
                    </>
                  )}
                </div>
              )}

              {/* Creator Info */}
              <div style={{
                borderTop: '1px solid #e5e5e5',
                paddingTop: '12px',
                fontSize: '12px',
                color: '#666'
              }}>
                Created by: {program.first_name} {program.last_name}
                <br />
                Created: {new Date(program.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true })}
              </div>
            </div>
          ))}
        </div>
      )}
      <AddTrainingModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingProgram(null); }}
        initialData={editingProgram}
        onSuccess={(msg) => {
          if (msg && msg.type && msg.message) {
            setActionMessage({ type: msg.type, message: msg.message });
            setTimeout(() => setActionMessage({ type: '', message: '' }), 3000);
          } else {
            setActionMessage({ type: 'success', message: 'Training program saved.' });
            setTimeout(() => setActionMessage({ type: '', message: '' }), 3000);
          }
          fetchTrainingPrograms();
        }}
      />
    </div>
  );
}