import { useState, useEffect } from 'react';
import SidebarAdmin from './SidebarAdmin';
import { Menu } from 'lucide-react';
import logo from '../../assets/logo/EARIST_Logo.png';
import SettingsAdmin from './SettingsAdmin';
import ViewUsers from './ViewUsers';
import Profile from './Profile';
import JobOffering from './JobCategories';
import AddTrainingModal from '../modals/AddTrainingModal';
import TrainingPrograms from './TrainingPrograms';
import { useLocation, useNavigate } from 'react-router-dom';
import HomeAdmin from './HomeAdmin';
import Data from './Data';
import RegistrationManagement from './RegistrationManagement';
import RegistrationStatusUpdate from './RegistrationStatusUpdate';
import TrainingManagement from './TrainingManagement';
import TrainingProgressUpdate from './TrainingProgressUpdate';
import JobPosting from './JobPosting';
import ApplicantsManagement from './ApplicantsManagement';
import ApplicantsStatusUpdate from './ApplicantsStatusUpdate';
import EvaluationManagement from './EvaluationManagement';
import EvaluationAnalytics from './EvaluationAnalytics';
import NotificationAdmin from './NotificationAdmin';
import CertificatesAdmin from './CertificatesManagement';

const HEADER_BG = '#6D2323';
const HEADER_TEXT = '#FEF9E1';
const FONT = 'Poppins, sans-serif';
const HEADER_HEIGHT = 50;

export default function DashboardAdmin() {
  const [expanded, setExpanded] = useState(false);
  const [manualExpand, setManualExpand] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.position !== "admin") {
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

  // Open global Add Training modal when navigated from Home quick action
  useEffect(() => {
    if (location.state && location.state.openAddTraining) {
      setIsModalOpen(true);
      // Clear state so it doesn't reopen on every render
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate]);

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
         
        </button>
        <img src={logo} alt="EARIST Logo" style={{ height: 40, marginRight: 5, marginLeft: -30 }} />
        <span style={{ color: HEADER_TEXT, fontSize: 20, fontWeight: 700, letterSpacing: 0.5 }}>
          Eulogio "Amang" Rodriguez Institute of Science and Technology
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/dashboard_admin/profile')}
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
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #FEF9E1' }}
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
      <SidebarAdmin
        expanded={expanded}
        setExpanded={setExpanded}
        headerHeight={HEADER_HEIGHT}
        manualExpand={manualExpand}
        setManualExpand={setManualExpand}
        onOpenModal={() => setIsModalOpen(true)}
        isModalOpen={isModalOpen}
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
          marginLeft: expanded ? 230 : 80,
          marginRight: expanded ? -20 : 10, // tighter spacing when sidebar is expanded
          minHeight: '100vh',
          transition: 'margin-left 0.2s',
        }}
      >
        {location.pathname === '/dashboard_admin/settings' ? (
          <SettingsAdmin manualExpand={manualExpand} />
        ) : location.pathname === '/dashboard_admin/view-users' ? (
          <ViewUsers />
        ) : location.pathname === '/dashboard_admin/profile' ? (
          <Profile />
        ) : location.pathname === '/dashboard_admin/job-categories' ? (
          <JobOffering manualExpand={manualExpand} />
        ) : location.pathname === '/dashboard_admin/training-programs' ? (
          <TrainingPrograms expanded={expanded} />
        ) : location.pathname === '/dashboard_admin/data' ? (
          <Data manualExpand={manualExpand} />
        ) : location.pathname === '/dashboard_admin/registration-management' ? (
          <RegistrationManagement manualExpand={manualExpand} />
        ) : location.pathname === '/dashboard_admin/registration-status-update' ? (
          <RegistrationStatusUpdate />
        ) : location.pathname === '/dashboard_admin/training-management' ? (
          <TrainingManagement manualExpand={manualExpand} />
        ) : location.pathname === '/dashboard_admin/training-progress-update' ? (
          <TrainingProgressUpdate />
        ) : location.pathname.startsWith('/dashboard_admin/job-categories') ? (
          <JobPosting />
        ) : location.pathname === '/dashboard_admin/applicants-management' ? (
          <ApplicantsManagement />
        ) : location.pathname.startsWith('/dashboard_admin/applicants-status-update') ? (
          <ApplicantsStatusUpdate />
        ) : location.pathname === '/dashboard_admin/evaluation-management' ? (
          <EvaluationManagement />
        ) : location.pathname.startsWith('/dashboard_admin/evaluation-analytics') ? (
          <EvaluationAnalytics />
        ) : location.pathname === '/dashboard_admin/notifications' ? (
          <NotificationAdmin />
        ) : location.pathname === '/dashboard_admin/certificates' ? (
          <CertificatesAdmin />
        ) : (
          <HomeAdmin />
        )}
      </div>
      
      {/* Add Training Modal */}
      <AddTrainingModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setManualExpand(false);
          setExpanded(false);
        }} 
      />
    </div>
  );
}