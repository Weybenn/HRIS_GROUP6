import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./components/Login";
import logo from "./assets/logo/EARIST_Logo.png";
import cover from "./assets/images/EARIST_cover.jpg";
import DashboardAdmin from "./components/admin/DashboardAdmin";
import DashboardEmployee from "./components/user/DashboardEmployee";
import ProtectedRoutes from "./components/ProtectedRoutes";
import MainPage from "./components/applicant/MainPage";
import WelcomePage from "./components/applicant/WelcomePage";
import JobCategoriesPage from "./components/applicant/JobCategoriesPage";
import JobAvailablePage from "./components/applicant/JobAvailablePage";
import ApplicationPage from "./components/applicant/ApplicationPage";

const HEADER_BG = '#6D2323';
const HEADER_TEXT = '#FEF9E1';
const FOOTER_BG = '#6D2323';
const FOOTER_TEXT = '#FEF9E1';
const FONT = 'Poppins, sans-serif';
const HEADER_HEIGHT = 70;

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  const isDashboard = location.pathname.startsWith('/dashboard_admin') || location.pathname.startsWith('/dashboard_employee');
  const isRecruitmentPortal = location.pathname.startsWith('/earist_') || 
                              location.pathname.startsWith('/job-available/') || 
                              location.pathname.startsWith('/application/');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);

    const onProfileUpdated = (e) => {
      const pic = e?.detail?.profile_picture ?? null;
      setUser(prev => prev ? { ...prev, profile_picture: pic } : prev);
      setAvatarKey(Date.now());
    };
    window.addEventListener('profile:updated', onProfileUpdated);
    return () => window.removeEventListener('profile:updated', onProfileUpdated);
  }, [location.pathname]);

  const getProfilePath = () => {
    if (user?.position === 'admin') return '/dashboard_admin/profile';
    if (user?.position === 'employee') return '/dashboard_employee/profile';
    return '/login';
  };

  const getSubtitle = () => {
    if (isRecruitmentPortal) {
      return "Application and Recruitment System";
    }
    return "Training and Development Information System";
  };

  return (
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
      <img src={logo} alt="EARIST Logo" style={{ height: 50, marginRight: 10, marginLeft: -15 }} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{ color: HEADER_TEXT, fontSize: 18, fontWeight: 400, letterSpacing: 0.5 }}>
          Eulogio "Amang" Rodriguez Institute of Science and Technology
        </span>
        <span style={{ color: HEADER_TEXT, fontSize: 20, fontWeight: 700, letterSpacing: 0.5 }}>
          {getSubtitle()}
        </span>
      </div>
      
      {/* Profile Avatar - only show on dashboard */}
      {isDashboard && user && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => navigate(getProfilePath())}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
            aria-label="My Profile"
          >
            {user.profile_picture ? (
              <img
                src={`${user.profile_picture.startsWith('http') ? user.profile_picture : `http://localhost:5000${user.profile_picture}`}?v=${avatarKey}`}
                alt="Profile"
                style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid #FEF9E1' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: '#E5D0AC',
                  color: '#6D2323',
                  fontWeight: 800,
                  fontSize: 20,
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
      )}
    </div>
  );
}

function Footer() {
  const location = useLocation();
  
  const isRecruitmentPortal = location.pathname.startsWith('/earist_') || 
                              location.pathname.startsWith('/job-available/') || 
                              location.pathname.startsWith('/application/');

  const getFooterText = () => {
    if (isRecruitmentPortal) {
      return "© Application and Recruitment System - HRIS. EARIST 2025. All rights reserved.";
    }
    return "© Training and Development Information System - HRIS. EARIST 2025. All rights reserved.";
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      background: FOOTER_BG,
      color: FOOTER_TEXT,
      textAlign: 'center',
      padding: '10px 0',
      fontFamily: FONT,
      fontSize: 13,
      zIndex: 1000,
    }}>
      {getFooterText()}
    </div>
  );
}

function PublicLayout({ children }) {
  return (
    <>
      <Header />
      <div style={{ paddingTop: HEADER_HEIGHT }}>
        {children}
      </div>
      <Footer />
    </>
  );
}

function DashboardLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'none', paddingTop: HEADER_HEIGHT }}>
      <Header />
      {children}
      <Footer />
    </div>
  );
}

function AppLayout({ children }) {
  return (
    <div className="app-bg" style={{ fontFamily: FONT, paddingTop: HEADER_HEIGHT }}>
      <Header />
      <div className="main-content">{children}</div>
      <Footer />
      <img src={cover} alt="Background Cover" className="background-cover" />
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  
  // Applicant/Public pages
  if (location.pathname === "/earist_main") {
    return (
      <PublicLayout>
        <MainPage />
      </PublicLayout>
    );
  }
  if (location.pathname === "/earist_welcome") {
    return (
      <PublicLayout>
        <WelcomePage />
      </PublicLayout>
    );
  }
  if (location.pathname === "/earist_job-categories") {
    return (
      <PublicLayout>
        <JobCategoriesPage />
      </PublicLayout>
    );
  }
  if (location.pathname.startsWith("/job-available/")) {
    return (
      <PublicLayout>
        <JobAvailablePage />
      </PublicLayout>
    );
  }
  if (location.pathname.startsWith("/application/")) {
    return (
      <PublicLayout>
        <ApplicationPage />
      </PublicLayout>
    );
  }
  
  // Redirect logged in users away from login
  if (location.pathname === "/login" && user) {
    if (user.position === "admin") {
      return <Navigate to="/dashboard_admin" replace />;
    } else if (user.position === "employee") {
      return <Navigate to="/dashboard_employee" replace />;
    }
  }
  
  // Dashboard pages
  if (location.pathname.startsWith('/dashboard_admin')) {
    return (
      <DashboardLayout>
        <DashboardAdmin />
      </DashboardLayout>
    );
  }
  if (location.pathname.startsWith('/dashboard_employee')) {
    return (
      <DashboardLayout>
        <DashboardEmployee />
      </DashboardLayout>
    );
  }
  
  // Login and fallback routes
  return (
    <AppLayout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoutes allowedRoles={["admin"]} />}>
          <Route path="/dashboard_admin/*" element={<DashboardAdmin />} />
        </Route>
        <Route element={<ProtectedRoutes allowedRoles={["employee"]} />}>
          <Route path="/dashboard_employee/*" element={<DashboardEmployee />} />
        </Route>
        <Route path="*" element={<Login />} />
      </Routes>
    </AppLayout>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;