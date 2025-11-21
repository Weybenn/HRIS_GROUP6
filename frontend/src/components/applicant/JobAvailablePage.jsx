import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Banknote, Eye, ExternalLink, Mail, Phone, Facebook, Link } from "lucide-react";
import logo from "../../assets/logo/EARIST_Logo.png";
import cover from "../../assets/images/EARIST_cover.jpg";
import "../../assets/style/landing.css";

const FONT = 'Poppins, sans-serif';
const TEXT_COLOR = '#6D2323';

const TITLE_MAP = {
  'administrative-staff': 'Administrative Staff',
  'academic-faculty': 'Academic Faculty',
  'it-technical-support': 'IT & Technical Support',
  'facilities-maintenance': 'Facilities & Maintenance',
  'finance-accounting': 'Finance & Accounting',
  'student-support-services': 'Student Support Services',
};

function JobAvailablePage() {
  const navigate = useNavigate();
  const params = useParams();
  const category = params.category || params.slug || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedJob, setExpandedJob] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);

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
    document.title = "EARIST Application and Recruitment Portal";
    fetchJobs();
  }, [category]);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/job-postings?category=${category}`);
      if (!res.ok) throw new Error('Failed to fetch job postings');
      const data = await res.json();
      const activeJobs = (data || []).filter(job => job.status !== 'Inactive');
      setJobs(activeJobs);
    } catch (err) {
      setError(err.message || 'Failed to fetch job postings');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/earist_job-categories');
  };

  const handleViewDescription = (job) => {
    setExpandedJob((prev) => (prev && prev.id === job.id ? null : job));
  };

  const handleApplyClick = (job) => {
    navigate(`/application/${job.id}`, { state: { job } });
  };

  const handleLogoClick = () => {
    navigate('/earist_main');
  };

  const title = TITLE_MAP[category] || 'Job Openings';

  return (
    <div className="app-bg" style={{ fontFamily: FONT }}>
      <div className="header header-invert">
        <img 
          src={logo} 
          alt="EARIST Logo" 
          className="header-logo" 
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }}
        />
        <div className="header-titles">
          <span className="header-title header-title-invert">
            Eulogio "Amang" Rodriguez Institute of Science and Technology
          </span>
          <span className="header-subtitle header-subtitle-invert">
            Application and Recruitment System
          </span>
        </div>
      </div>

      <div className="job-categories-container">
        <div className="job-categories-content">
          {/* Header with Back Button and Title */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            marginBottom: 32
          }}>
            <button
              onClick={handleBackClick}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                color: TEXT_COLOR,
                display: 'flex',
                alignItems: 'center',
                padding: 0,
                justifySelf: 'center',
              }}
            >
              <ArrowLeft size={45} />
            </button>

            <h1 className="job-categories-title" style={{ margin: 40 }}>
              {title}
            </h1>

            <div></div> {/* Empty spacer to balance the grid */}
          </div>
          
          {loading ? (
            <div style={{ fontSize: 18, color: '#666', textAlign: 'center', padding: '40px 0' }}>
              Loading job postings...
            </div>
          ) : error ? (
            <div style={{ color: '#dc3545', textAlign: 'center', padding: '40px 0' }}>{error}</div>
          ) : jobs.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', fontSize: 18, padding: '40px 0' }}>
              No job postings found for this category.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: expandedJob ? '1fr 1fr' : '1fr', gap: 24, maxWidth: '1200px', margin: '0 auto', alignItems: 'start' }}>
              {/* Job Listings */}
              <div>
                <div style={{ display: 'grid', gap: 16 }}>
                  {jobs.map((job) => {
                    const idKey = job.id || job.job_id || `${job.job_title}-${Math.random()}`;
                    return (
                      <div 
                        key={idKey} 
                        style={{ 
                          backgroundColor: 'white', 
                          borderRadius: 12, 
                          padding: 20, 
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
                          border: '2px solid #6D2323',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => { 
                          e.currentTarget.style.transform = 'translateY(-2px)'; 
                          e.currentTarget.style.boxShadow = '0 8px 15px rgba(109, 35, 35, 0.2)'; 
                        }}
                        onMouseLeave={(e) => { 
                          e.currentTarget.style.transform = 'translateY(0)'; 
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; 
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <h3 style={{ color: TEXT_COLOR, margin: '0 0 8px 0', fontSize: 20, fontWeight: 600, flex: 1 }}>
                            {job.job_title || job.title || job.jobTitle}
                          </h3>
                          <button
                            onClick={() => handleViewDescription(job)}
                            style={{
                              backgroundColor: TEXT_COLOR,
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              padding: '8px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 14,
                              fontWeight: 500
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#8A1A1A'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = TEXT_COLOR}
                          >
                            <Eye size={16} />
                            {expandedJob && expandedJob.id === job.id ? 'Hide Description' : 'View Description'}
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                          <Clock size={16} style={{ color: TEXT_COLOR, marginRight: 8 }} />
                          <span style={{ fontSize: 14, color: '#666' }}>
                            {job.employment_type || job.employmentType || 'Not specified'}
                          </span>
                        </div>

                        {(job.salary != null && Number(job.salary) > 0) || job.salary === '0' ? (
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                            <Banknote size={16} style={{ color: TEXT_COLOR, marginRight: 8 }} />
                            <span style={{ fontSize: 14, color: '#666' }}>
                              ₱{Number(job.salary || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        ) : null}

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                          <MapPin size={16} style={{ color: TEXT_COLOR, marginRight: 8 }} />
                          <span style={{ fontSize: 14, color: '#666' }}>
                            {job.location || job.office || 'Not specified'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expanded Job Details */}
              {expandedJob && (
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: 12, 
                  padding: 24, 
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
                  border: '2px solid #6D2323',
                  position: 'sticky',
                  top: 20,
                  height: 'fit-content'
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <h2 style={{ color: TEXT_COLOR, margin: 0, fontSize: 24, fontWeight: 600 }}>
                      {expandedJob.job_title || expandedJob.title}
                    </h2>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <MapPin size={16} style={{ color: TEXT_COLOR, marginRight: 8 }} />
                      <span style={{ fontSize: 14, color: '#666' }}>
                        {expandedJob.location || expandedJob.office || 'Not specified'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <Clock size={16} style={{ color: TEXT_COLOR, marginRight: 8 }} />
                      <span style={{ fontSize: 14, color: '#666' }}>
                        {expandedJob.employment_type || expandedJob.employmentType || 'Not specified'}
                      </span>
                    </div>
                    {(expandedJob.salary != null && Number(expandedJob.salary) > 0) || expandedJob.salary === '0' ? (
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                        <Banknote size={16} style={{ color: TEXT_COLOR, marginRight: 8 }} />
                        <span style={{ fontSize: 16, color: TEXT_COLOR, fontWeight: 600 }}>
                          ₱{Number(expandedJob.salary || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {expandedJob.description && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ color: TEXT_COLOR, fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                        Job Description
                      </h3>
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
                          padding: 16,
                          backgroundColor: '#f8f9fa',
                          borderRadius: 8,
                          fontSize: 14,
                          color: '#333',
                          lineHeight: '1.6',
                          textAlign: 'left'
                        }}
                        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(expandedJob.description) }}
                      />
                    </div>
                  )}

                  <button
                    onClick={() => handleApplyClick(expandedJob)}
                    style={{
                      backgroundColor: TEXT_COLOR,
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      padding: '14px 28px',
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#8A1A1A'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = TEXT_COLOR}
                  >
                    <ExternalLink size={20} />
                    Apply Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="job-categories-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">Contact Us</h3>
            <div className="footer-item" onClick={() => setShowMapModal(true)} style={{ cursor: 'pointer' }}>
              <MapPin size={20} />
              <span>Nagtahan St, Sampaloc, Manila, 1008 Metro Manila</span>
            </div>
            <div className="footer-item" onClick={() => window.open('https://mail.google.com/mail/?view=cm&fs=1&to=earistofficial1945@gmail.com', '_blank', 'noopener,noreferrer')} style={{ cursor: 'pointer' }}>
              <Mail size={20} />
              <span>earistofficial1945@gmail.com</span>
            </div>
            <div className="footer-item" style={{ cursor: 'default' }}>
              <Phone size={20} />
              <span>(028)243-9467</span>
            </div>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-title">Follow and Visit Us</h3>
            <div className="footer-item" onClick={() => window.open('https://web.facebook.com/EARISTOfficial', '_blank')} style={{ cursor: 'pointer' }}>
              <Facebook size={20} />
              <span>EARISTOfficial</span>
            </div>
            <div className="footer-item" onClick={() => window.open('https://earist.edu.ph/', '_blank')} style={{ cursor: 'pointer' }}>
              <Link size={20} />
              <span>earist.edu.ph</span>
            </div>
          </div>
        </div>
        
        <div className="footer-copyright">
          © Eulogio "Amang" Rodriguez Institute of Science and Technology 2025
        </div>
      </div>

      {/* Map Modal */}
      {showMapModal && (
        <div className="modal-overlay" onClick={() => setShowMapModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>EARIST Location</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowMapModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.3056530517983!2d121.0006314!3d14.598802099999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c9e5410eb845%3A0xc70728ea6c31355!2sNagtahan%20St%2C%20Santa%20Mesa%2C%20Manila%2C%20Metro%20Manila!5e1!3m2!1sen!2sph!4v1759593492544!5m2!1sen!2sph"
                width="100%"
                height="400"
                style={{ border: 0, borderRadius: '8px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="EARIST Location Map"
              ></iframe>
              <p style={{ marginTop: '16px', fontSize: '14px', color: '#6D2323' }}>
                Eulogio "Amang" Rodriguez Institute of Science and Technology<br />
                Nagtahan St, Sampaloc, Manila, 1008 Metro Manila
              </p>
            </div>
          </div>
        </div>
      )}

      <img src={cover} alt="Background Cover" className="background-cover" />
    </div>
  );
}

export default JobAvailablePage;