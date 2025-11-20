import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserPlus, UserCog, UserMinus, UserSearch, MonitorCog, UserPen, CircleUserIcon, Settings } from 'lucide-react';
import CreateAccount from './CreateAccount';

const BUTTONS = [
  //{ label: 'Personalisation', icon: MonitorCog },
  { label: 'My Profile', icon: CircleUserIcon },
  { label: 'Create Account', icon: UserPlus },
  { label: 'User Settings', icon: UserCog },
  //{ label: 'Update Account', icon: UserPen },
  //{ label: 'Delete Account', icon: UserMinus },
  //{ label: 'Recover Account', icon: UserSearch },
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
const BUTTON_HEIGHT = 100; // Reduced from 120

export default function SettingsAdmin({ manualExpand }) {
  const columns = manualExpand ? 2 : 3;
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // If navigated from Home quick action, automatically open Create Account
  useEffect(() => {
    if (location.state && location.state.openCreateAccount) {
      setShowCreate(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate]);

  const handleButtonClick = (label) => {
    if (label === 'Create Account') setShowCreate(true);
    else if (label === 'User Settings') navigate('/dashboard_admin/view-users');
    else if (label === 'My Profile') navigate('/dashboard_admin/profile');
    // Add other button actions as needed
  };

  return (
    <>
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
                <Settings size={22} /> Settings
              </h1>
              <p style={{ 
                margin: 0,
                fontFamily: FONT,
                opacity: 0.9,
                fontSize: '14px'
              }}>
                Manage your account and system preferences
              </p>
            </div>
          </div>
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
            marginTop: '60px' // Reduced from 100px
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
      <CreateAccount open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => setShowCreate(false)} />
    </>
  );
}