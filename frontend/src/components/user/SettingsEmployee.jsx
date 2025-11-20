import { useState } from 'react';
import { CircleUserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BUTTONS = [
  { label: 'My Profile', icon: CircleUserIcon },
];

const FONT = 'Poppins, sans-serif';
const BORDER_COLOR = '#6D2323';
const HOVER_BG = '#6D2323';
const HOVER_TEXT = '#FEF9E1';
const TEXT_COLOR = '#6D2323';
const BUTTON_WIDTH = 280; // Reduced from 340
const BUTTON_HEIGHT = 100; // Reduced from 120

export default function SettingsEmployee({ manualExpand }) {
  const columns = manualExpand ? 2 : 3;
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const navigate = useNavigate();

  const handleButtonClick = (label) => {
    if (label === 'My Profile') navigate('/dashboard_employee/profile');
  };

  return (
    <>
      <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 1rem 1rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ 
            color: '#6D2323', 
            fontWeight: 700, 
            fontSize: 28, // Reduced from 32
            margin: '0 0 8px 0',
            fontFamily: FONT
          }}>
            Settings
          </h1>
          <p style={{ 
            color: '#666', 
            fontSize: 16, // Reduced from 18
            margin: 0,
            fontFamily: FONT
          }}>
            Manage your account preferences.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(${BUTTON_WIDTH}px, 1fr))`,
            gap: 24, // Reduced from 40
            padding: '20px 0', // Reduced from 40px
            fontFamily: FONT,
            justifyItems: 'center',
            alignItems: 'center',
            width: '100%',
            maxWidth: 1000, // Reduced from 1200
            margin: '0 auto',
          }}
        >
        {BUTTONS.map(({ label, icon: Icon }, idx) => {
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
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16, // Reduced from 24
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
              <span style={{ fontWeight: 700 }}>{label}</span>
            </button>
          );
        })}
        </div>
      </div>

      {/* No modal here; navigation to dedicated profile page */}
    </>
  );
}