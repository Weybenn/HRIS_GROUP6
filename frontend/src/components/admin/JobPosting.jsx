import { useEffect, useState } from 'react';
import { ArrowLeft, Trash2, Edit3, MapPin, Info, Clock, Banknote, Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import JobPostingModal from '../modals/JobPostingModal';

const FONT = 'Poppins, sans-serif';
const TEXT_COLOR = '#6D2323';

const TITLE_MAP = {
  'administrative-staff': 'Administrative Staff Job Openings',
  'academic-faculty': 'Academic Faculty Job Openings',
  'it-technical-support': 'IT & Technical Support Job Openings',
  'facilities-maintenance': 'Facilities & Maintenance Job Openings',
  'finance-accounting': 'Finance & Accounting Job Openings',
  'student-support-services': 'Student Support Services Job Openings',
};

export default function JobPosting() {
  const navigate = useNavigate();
  const params = useParams();
  const category = params.category || params.slug || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [actionMessage, setActionMessage] = useState({ type: '', message: '' });
  const [expandedDesc, setExpandedDesc] = useState({});

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
    fetchJobs();
    const handler = () => fetchJobs();
    window.addEventListener('jobs:updated', handler);
    return () => window.removeEventListener('jobs:updated', handler);
  }, [category]);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/job-postings?category=${category}`);
      if (!res.ok) throw new Error('Failed to fetch job postings');
      const data = await res.json();
      setJobs(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch job postings');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/dashboard_admin/job-categories');
  };

  const title = TITLE_MAP[category] || 'Job Openings';

  const displayedJobs = jobs;

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
          <div style="font-size:18px;color:#222;margin-bottom:16px;">Delete this job posting?</div>
          <div style="display:flex;gap:12px;justify-content:center;">
            <button id="job-cancel" style="background:#e5e7eb;color:#111827;border:none;border-radius:8px;padding:10px 18px;font-weight:600;cursor:pointer;">Cancel</button>
            <button id="job-confirm" style="background:#6D2323;color:#fff;border:none;border-radius:8px;padding:10px 18px;font-weight:600;cursor:pointer;">Delete</button>
          </div>
        </div>`;
      document.body.appendChild(container);
      container.querySelector('#job-cancel').onclick = () => { document.body.removeChild(container); resolve(false); };
      container.querySelector('#job-confirm').onclick = () => { document.body.removeChild(container); resolve(true); };
    });
    if (!confirm) return;
    try {
      const res = await fetch(`http://localhost:5000/job-postings/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      setActionMessage({ type: 'success', message: 'Job deleted successfully.' });
      fetchJobs();
      setTimeout(() => setActionMessage({ type: '', message: '' }), 3000);
    } catch (err) {
      setActionMessage({ type: 'error', message: err.message });
      setTimeout(() => setActionMessage({ type: '', message: '' }), 3000);
    }
  };

  const toggleDescription = (id) => {
    setExpandedDesc(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 2rem 2rem 2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button
            onClick={handleBackClick}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 16 }}
            aria-label="Back to job categories"
          >
            <ArrowLeft color="#6D2323" size={32} />
          </button>
          <h1 style={{ color: '#6D2323', fontWeight: 700, fontSize: 32, margin: 0 }}>{title}</h1>
        </div>
        {/* Search removed per requirements */}
      </div>

      {/* Top banner for actions/errors */}
      {actionMessage.message && (
        <div style={{ position: 'fixed', top: 12, left: 16, right: 16, margin: '0 auto', maxWidth: 900, backgroundColor: actionMessage.type === 'success' ? '#1DA34A' : '#6D2323', color: '#fff', padding: '10px 16px', borderRadius: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.15)', textAlign: 'center', fontWeight: 500, zIndex: 300 }}>
          <span>{actionMessage.message}</span>
          <span style={{ position: 'absolute', right: 16, top: 22, transform: 'translateY(-50%)', opacity: 0.9 }}>
            <Info size={18} />
          </span>
        </div>
      )}

      {/* Job list design similar to TrainingPrograms */}
      {loading ? (
        <div style={{ fontSize: 18, color: '#666' }}>Loading job postings...</div>
      ) : error ? (
        <div style={{ color: '#dc3545', textAlign: 'center' }}>{error}</div>
      ) : displayedJobs.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', fontSize: 18, padding: '40px 0' }}>
          {jobs.length === 0 ? 'No job postings found for this category.' : 'No job postings found.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 24 }}>
          {displayedJobs.map((job) => {
            const idKey = job.id || job.job_id || `${job.job_title}-${Math.random()}`;
            return (
              <div key={idKey} style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #e5e5e5', transition: 'transform 0.2s, box-shadow 0.2s', height: 'fit-content' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* status pill */}
                    <div style={{ backgroundColor: job.status === 'Active' ? '#e6ffef' : '#fff3f2', color: job.status === 'Active' ? '#047857' : '#9f1239', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                      {job.status || 'Active'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => { setEditingJob({ ...job, category }); setIsModalOpen(true); }} style={{ backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: 6, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }} onMouseEnter={(e) => e.target.style.backgroundColor = '#0ea66a'} onMouseLeave={(e) => e.target.style.backgroundColor = '#10B981'}>
                      <Edit3 size={16} /> Update
                    </button>
                    <button onClick={() => handleDelete(job.id)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: 6, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }} onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'} onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>

                <h3 style={{ color: TEXT_COLOR, margin: '0 0 8px 0', fontSize: 20, fontWeight: 600 }}>{job.job_title || job.title || job.jobTitle}</h3>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <MapPin size={16} style={{ color: TEXT_COLOR, marginRight: 8 }} />
                  <span style={{ fontSize: 14, color: '#666' }}>{job.location || job.office || 'Not specified'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <Clock size={16} style={{ color: TEXT_COLOR, marginRight: 8 }} />
                  <span style={{ fontSize: 14, color: '#666' }}>{job.employment_type || job.employmentType || 'Not specified'}</span>
                </div>

                { (job.salary != null && Number(job.salary) > 0) || job.salary === '0' ? (
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <Banknote size={16} style={{ color: TEXT_COLOR, marginRight: 8 }} />
                    <span style={{ fontSize: 14, color: '#666' }}>₱{Number(job.salary || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ) : null}

                {job.description && (
                    <div style={{ marginBottom: '16px' }}>
                        <button
                        onClick={() => toggleDescription(job.id)}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: TEXT_COLOR,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '14px',
                            fontFamily: FONT
                        }}
                        >
                        {expandedDesc[job.id] ? (
                            <>
                            <Eye size={16} /> Hide Description
                            </>
                        ) : (
                            <>
                            <Eye size={16} /> View Description
                            </>
                        )}
                        </button>
                        {expandedDesc[job.id] && (
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
                              dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(job.description) }}
                            />
                          </>
                        )}
                    </div>
                    )}

                    {/* Divider + Created Date OUTSIDE description */}
                    <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                    <div style={{ display: 'flex', alignItems: 'center', color: '#666', fontSize: '13px' }}>
                    <Clock size={14} style={{ marginRight: 6, color: '#999' }} />
                    <span>
                        Posted on {new Date(job.created_at || job.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'long', day: 'numeric' 
                        })}
                    </span>
                </div>
            </div>
            );
        })}
        </div>
      )}

      <JobPostingModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingJob(null); }}
        initialData={editingJob}
        defaultCategory={category}
        onSuccess={(msg) => {
          if (msg && msg.type && msg.message) {
            setActionMessage({ type: msg.type, message: msg.message });
            setTimeout(() => setActionMessage({ type: '', message: '' }), 3000);
          }
          fetchJobs();
        }}
      />
    </div>
  );
}
