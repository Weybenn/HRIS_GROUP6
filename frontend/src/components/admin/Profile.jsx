import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ImagePlus, KeyRoundIcon } from 'lucide-react';
import UpdateProfileModal from '../modals/UpdateProfileModal';
import ChangePasswordModal from '../modals/ChangePasswordModal';

const BUTTONS = [
  { label: 'Update Profile', icon: ImagePlus },
  { label: 'Change Password', icon: KeyRoundIcon },
];

const FONT = 'Poppins, sans-serif';
const BORDER_COLOR = '#6D2323';
const HOVER_BG = '#6D2323';
const HOVER_TEXT = '#FEF9E1';
const TEXT_COLOR = '#6D2323';
const BUTTON_HEIGHT = 80;

export default function Profile() {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleButtonClick = (label) => {
    if (label === 'Update Profile') {
      setModalOpen(true);
    } else if (label === 'Change Password') {
      setPasswordModalOpen(true);
    }
  };

  return (
    <div style={{ ...{ fontFamily: FONT }, minHeight: '100vh', padding: '0 2rem 2rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={() => navigate('/dashboard_admin/settings')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 16 }}
          aria-label="Back to settings"
        >
          <ArrowLeft color="#6D2323" size={32} />
        </button>
        <h2 style={{ color: '#6D2323', fontWeight: 700, fontSize: 32, margin: 0 }}>My Profile</h2>
      </div>
      
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          padding: '40px 0',
          fontFamily: FONT,
          width: '100%',
          maxWidth: 600,
          margin: '0',
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
                fontSize: 24,
                fontFamily: FONT,
                borderRadius: 4,
                width: '100%',
                height: BUTTON_HEIGHT,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 24,
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s',
                outline: 'none',
                boxSizing: 'border-box',
                padding: '0 32px',
              }}
              onMouseOver={() => setHoveredIdx(idx)}
              onFocus={() => setHoveredIdx(idx)}
              onMouseOut={() => setHoveredIdx(null)}
              onBlur={() => setHoveredIdx(null)}
              onClick={() => handleButtonClick(label)}
            >
              <Icon size={36} color={isHovered ? HOVER_TEXT : TEXT_COLOR} style={{ transition: 'color 0.2s' }} />
              <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
      {modalOpen && (
        <UpdateProfileModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          user={user}
          onUpdated={(profile_picture) => {
            const updated = { ...user, profile_picture };
            setUser(updated);
            localStorage.setItem('user', JSON.stringify(updated));
          }}
        />
      )}
      {passwordModalOpen && (
        <ChangePasswordModal
          open={passwordModalOpen}
          onClose={() => setPasswordModalOpen(false)}
          user={user}
        />
      )}
    </div>
  );
}
