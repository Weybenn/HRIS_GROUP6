import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ClipboardList, 
  GraduationCap, 
  Laptop, 
  Wrench, 
  HandCoinsIcon, 
  Handshake,
  CirclePlus,
  Briefcase
} from 'lucide-react';
import JobPostingModal from '../modals/JobPostingModal';

const JOB_CATEGORIES = [
  { label: 'Administrative Staff', icon: ClipboardList, slug: 'administrative-staff' },
  { label: 'Academic Faculty', icon: GraduationCap, slug: 'academic-faculty' },
  { label: 'IT & Technical Support', icon: Laptop, slug: 'it-technical-support' },
  { label: 'Facilities & Maintenance', icon: Wrench, slug: 'facilities-maintenance' },
  { label: 'Finance & Accounting', icon: HandCoinsIcon, slug: 'finance-accounting' },
  { label: 'Student Support Services', icon: Handshake, slug: 'student-support-services' },
];

const FONT = 'Poppins, sans-serif';
const PRIMARY = '#6D2323';
const SECONDARY = '#FEF9E1';
const ACCENT = '#C97C5D'; // Changed from ACCENT_COLOR to match NotificationAdmin
const BORDER_COLOR = '#6D2323';
const HOVER_BG = '#6D2323';
const HOVER_TEXT = '#FEF9E1';
const TEXT_COLOR = '#6D2323';
const BUTTON_WIDTH = 280; // Reduced from 340
const BUTTON_HEIGHT = 130; // Reduced from 160

export default function JobOffering({ manualExpand }) {
  const columns = manualExpand ? 2 : 3;
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [openPostJob, setOpenPostJob] = useState(false);

  // If navigated from Home quick action, automatically open the Post a Job modal
  useEffect(() => {
    if (location.state && location.state.openPostJob) {
      setOpenPostJob(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate]);

  const handleButtonClick = (label) => {
    try {
      const found = JOB_CATEGORIES.find((c) => c.label === label);
      const slug = found?.slug || label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      navigate(`/dashboard_admin/job-categories/${slug}`);
    } catch (err) {
      console.error('Navigation failed', err);
    }
  };

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 1rem 1rem 1rem' }}>
      {/* Header with NotificationAdmin Style */}
      <div style={{ 
        marginBottom: 16,
        background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
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
              <Briefcase size={22} /> Job Categories
            </h1>
            <p style={{ 
              margin: 0,
              fontFamily: FONT,
              opacity: 0.9,
              fontSize: '14px'
            }}>
              Browse job openings by department
            </p>
          </div>
          <div>
            <button
              onClick={() => setOpenPostJob(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                background: '#6D2323',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                fontFamily: FONT,
                borderRadius: 6,
                padding: '8px 12px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
           
            >
              <CirclePlus size={16} /> Post a Job
            </button>
          </div>
        </div>
      </div>

      {/* Job Categories Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(${BUTTON_WIDTH}px, 1fr))`,
          gap: 16, // Reduced from 20
          padding: '20px 0', // Reduced from 40px
          fontFamily: FONT,
          justifyItems: 'center',
          alignItems: 'center',
          width: '100%',
          maxWidth: 1000, // Reduced from 1200
          margin: '0 auto',
          marginTop: '60px', // Reduced from 100px
        }}
      >
        {JOB_CATEGORIES.map(({ label, icon: Icon }, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <button
              key={label}
              style={{
                border: `2px solid ${BORDER_COLOR}`,
                background: isHovered ? HOVER_BG : '#fff',
                color: isHovered ? HOVER_TEXT : TEXT_COLOR,
                fontWeight: 700,
                fontSize: 18, // Reduced from 24
                fontFamily: FONT,
                borderRadius: 4,
                width: BUTTON_WIDTH,
                height: BUTTON_HEIGHT,
                minWidth: BUTTON_WIDTH,
                minHeight: BUTTON_HEIGHT,
                maxWidth: BUTTON_WIDTH,
                maxHeight: BUTTON_HEIGHT,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12, // Reduced from 16
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onMouseOver={() => setHoveredIdx(idx)}
              onFocus={() => setHoveredIdx(idx)}
              onMouseOut={() => setHoveredIdx(null)}
              onBlur={() => setHoveredIdx(null)}
              onClick={() => handleButtonClick(label)}
            >
              <Icon size={36} color={isHovered ? HOVER_TEXT : TEXT_COLOR} style={{ transition: 'color 0.2s' }} /> {/* Reduced from 44 */}
              <span style={{ fontWeight: 700, textAlign: 'center' }}>{label}</span>
            </button>
          );
        })}
      </div>
      <JobPostingModal
        isOpen={openPostJob}
        onClose={() => setOpenPostJob(false)}
        initialData={null}
        defaultCategory={null}
        onSuccess={() => {
          setOpenPostJob(false);
          try { window.dispatchEvent(new CustomEvent('jobs:updated')); } catch (e) {}
        }}
      />
    </div>
  );
}