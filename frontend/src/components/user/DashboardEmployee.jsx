import { useState, useEffect } from 'react';
import SidebarEmployee from './SidebarEmployee';
import SettingsEmployee from './SettingsEmployee';
import ProfileEmployee from './ProfileEmployee';
import { useNavigate, useLocation } from "react-router-dom";
import HomeEmployee from './HomeEmployee';
import EvaluationEmployee from './EvaluationEmployee';
import NotificationEmployee from './NotificationEmployee';
import TrainingRegistration from './TrainingRegistration';

const FONT = 'Poppins, sans-serif';

export default function DashboardEmployee() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [manualExpand, setManualExpand] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.position !== "employee") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: FONT }}>
      {/* Sidebar */}
      <SidebarEmployee
        expanded={expanded}
        setExpanded={setExpanded}
        headerHeight={0}
        manualExpand={manualExpand}
        setManualExpand={setManualExpand}
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
        {location.pathname === '/dashboard_employee/settings' ? (
          <SettingsEmployee manualExpand={manualExpand} />
        ) : location.pathname === '/dashboard_employee/profile' ? (
          <ProfileEmployee />
        ) : location.pathname === '/dashboard_employee/evaluation' ? (
          <EvaluationEmployee />
        ) : location.pathname === '/dashboard_employee/notifications' ? (
          <NotificationEmployee />
        ) : location.pathname === '/dashboard_employee/training-registration' ? (
          <TrainingRegistration />
        ) : (
          <HomeEmployee />
        )}
      </div>
    </div>
  );
}