import { useState, useEffect } from 'react';
import SidebarEmployee from './SidebarEmployee';
import SettingsEmployee from './SettingsEmployee';
import ProfileEmployee from './ProfileEmployee';
import { Menu } from 'lucide-react';
import logo from '../../assets/logo/EARIST_Logo.png';
import { useNavigate, useLocation } from "react-router-dom";
import HomeEmployee from './HomeEmployee';
import EvaluationEmployee from './EvaluationEmployee';
import NotificationEmployee from './NotificationEmployee';
import TrainingRegistration from './TrainingRegistration';


const HEADER_BG = '#6D2323';
const HEADER_TEXT = '#FEF9E1';
const FONT = 'Poppins, sans-serif';
const HEADER_HEIGHT = 70;

export default function DashboardEmployee() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.position !== "employee") {
      navigate("/login", { replace: true });
    }
    setUser(user);
    const onProfileUpdated = (e) => {
      const pic = e?.detail?.profile_picture ?? null;
      setUser(prev => prev ? { ...prev, profile_picture: pic } : prev);
      setAvatarKey(Date.now());
    };
    window.addEventListener('profile:updated', onProfileUpdated);
    return () => window.removeEventListener('profile:updated', onProfileUpdated);
  }, [navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const [expanded, setExpanded] = useState(false);
  const [manualExpand, setManualExpand] = useState(false);

  const handleMenuClick = () => {
    if (manualExpand) {
      setManualExpand(false);
      setExpanded(false);
    } else {
      setManualExpand(true);
      setExpanded(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'none', paddingTop: HEADER_HEIGHT }}>
      {/* Header (fixed) */}
      <div style={{
        width: '100vw',
        background: HEADER_BG,
        display: 'flex',
        alignItems: 'center',
        padding: '0.5rem 2rem',
        minHeight: HEADER_HEIGHT,
        height: HEADER_HEIGHT,
        fontFamily: FONT,
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
      }}>
        <button
          onClick={handleMenuClick}
          style={{
            background: 'none',
            border: 'none',
            marginRight: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <Menu size={36} color={HEADER_TEXT} />
        </button>
        <img src={logo} alt="EARIST Logo" style={{ height: 45, marginRight: 18 }} />
        <span style={{ color: HEADER_TEXT, fontSize: 24, fontWeight: 700, letterSpacing: 0.5 }}>
          Eulogio "Amang" Rodriguez Institute of Science and Technology
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/dashboard_employee/profile')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
            aria-label="My Profile"
          >
            {user && user.profile_picture ? (
              (() => {
                const base = user.profile_picture.startsWith('http') ? user.profile_picture : `http://localhost:5000${user.profile_picture}`;
                const src = `${base}?v=${avatarKey}`;
                return (
                  <img
                    src={src}
                    alt="Profile"
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #FEF9E1' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                );
              })()
            ) : (
              <div
                aria-label="Initials Avatar"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#E5D0AC',
                  color: '#6D2323',
                  fontWeight: 800,
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #FEF9E1',
                }}
              >
                {`${(user?.first_name || '').charAt(0)}${(user?.last_name || '').charAt(0)}`.toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </div>
      {/* Sidebar and Main Content */}
      <SidebarEmployee
        expanded={expanded}
        setExpanded={setExpanded}
        headerHeight={HEADER_HEIGHT}
        manualExpand={manualExpand}
        setManualExpand={setManualExpand}
        style={{
          position: 'fixed',
          top: HEADER_HEIGHT,
          left: 0,
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
          zIndex: 200,
        }}
      />
      <div
        style={{
          flex: 1,
          background: 'none',
          padding: 40,
          marginLeft: expanded ? 250 : 80,
          marginRight: expanded ? -20 : 10,
          minHeight: '100vh',
          transition: 'margin-left 0.2s',
        }}
      >
        {window.location.pathname === '/dashboard_employee/settings' ? (
          <SettingsEmployee manualExpand={manualExpand} />
        ) : window.location.pathname === '/dashboard_employee/profile' ? (
          <ProfileEmployee />
        ) : window.location.pathname === '/dashboard_employee/evaluation' ? (
          <EvaluationEmployee />
        ) : window.location.pathname === '/dashboard_employee/notifications' ? (
          <NotificationEmployee />
        ) : window.location.pathname === '/dashboard_employee/training-registration' ? (
          <TrainingRegistration />
        ) : (
          <HomeEmployee />
        )}
      </div>
    </div>
  );
}
