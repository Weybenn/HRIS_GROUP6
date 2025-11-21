import { useState, useEffect } from 'react';
import SidebarAdmin from './SidebarAdmin';
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

const FONT = 'Poppins, sans-serif';

export default function DashboardAdmin() {
  const [expanded, setExpanded] = useState(false);
  const [manualExpand, setManualExpand] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.position !== "admin") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (location.state && location.state.openAddTraining) {
      setIsModalOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: FONT }}>
      {/* Sidebar */}
      <SidebarAdmin
        expanded={expanded}
        setExpanded={setExpanded}
        headerHeight={0}
        manualExpand={manualExpand}
        setManualExpand={setManualExpand}
        onOpenModal={() => setIsModalOpen(true)}
        isModalOpen={isModalOpen}
        style={{
          position: 'fixed',
          top: 70,
          left: 0,
          height: 'calc(100vh - 70px)',
          zIndex: 200,
        }}
      />
      
      {/* Main Content */}
      <div
        style={{
          flex: 1,
          background: 'none',
          padding: 40,
          paddingBottom: 60,
          marginLeft: expanded ? 250 : 80,
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