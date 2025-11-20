import { useState } from 'react';
import { ClipboardPen, Activity, Star, IdCard, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FONT = 'Poppins, sans-serif';
const PRIMARY = '#6D2323';
const SECONDARY = '#FEF9E1';
const ACCENT = '#C97C5D';
const BORDER_COLOR = '#6D2323';
const HOVER_BG = '#6D2323';
const HOVER_TEXT = '#FEF9E1';
const TEXT_COLOR = '#6D2323';
const BUTTON_WIDTH = 380;
const BUTTON_HEIGHT = 160;

const DATA_CATEGORIES = [
  { label: 'Registration', icon: ClipboardPen },
  { label: 'Training Progress', icon: Activity },
  { label: 'Evaluation', icon: Star },
  { label: 'Applicants', icon: IdCard },
];

export default function Data({ manualExpand }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const navigate = useNavigate();

  const handleButtonClick = (label) => {
    if (label === 'Registration') {
      navigate('/dashboard_admin/registration-management');
    } else if (label === 'Training Progress') {
      navigate('/dashboard_admin/training-management');
    } else if (label === 'Evaluation') {
      navigate('/dashboard_admin/evaluation-management');
    } else if (label === 'Applicants') {
      navigate('/dashboard_admin/applicants-management');
    } else {
      console.log(`Selected data category: ${label}`);
    }
  };

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 2rem 2rem 2rem' }}>
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
              <Database size={22} /> Data
            </h1>
            <p style={{ 
              margin: 0,
              fontFamily: FONT,
              opacity: 0.9,
              fontSize: '14px'
            }}>
              Centralized view of registrations, training progress, evaluations, and applicants
            </p>
          </div>
        </div>
      </div>

      {/* Categories - always two columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(2, ${BUTTON_WIDTH}px)`, // Fixed to exactly 2 columns
          columnGap: 40, // Further reduced horizontal gap
          rowGap: 24,    // Keep vertical gap the same
          padding: '24px 0',
          fontFamily: FONT,
          justifyItems: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          width: 'fit-content', // Changed to fit-content to reduce overall width
          maxWidth: '100%',
          margin: '0 auto',
          overflowX: 'auto',
        }}
      >
        {DATA_CATEGORIES.map(({ label, icon: Icon }, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <button
              key={label}
              style={{
                border: `2px solid ${BORDER_COLOR}`,
                background: isHovered ? HOVER_BG : '#fff',
                color: isHovered ? HOVER_TEXT : TEXT_COLOR,
                fontWeight: 700,
                fontSize: 22,
                fontFamily: FONT,
                borderRadius: 6,
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
                gap: 14,
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
              <Icon
                size={40}
                color={isHovered ? HOVER_TEXT : TEXT_COLOR}
                style={{ transition: 'color 0.2s' }}
              />
              <span style={{ fontWeight: 700, textAlign: 'center' }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}