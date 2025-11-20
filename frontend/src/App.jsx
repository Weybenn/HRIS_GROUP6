import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
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

function AppLayout({ children }) {
  return (
    <div className="app-bg" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="header">
        <img src={logo} alt="EARIST Logo" className="header-logo" />
        <span className="header-title">
          Eulogio "Amang" Rodriguez Institute of Science and Technology
        </span>
      </div>
      <div className="main-content">{children}</div>
      <div className="footer">
        © Human Resource Information System, EARIST 2025
      </div>
      <img src={cover} alt="Background Cover" className="background-cover" />
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  if (location.pathname === "/earist_main") {
    return <MainPage />;
  }
  if (location.pathname === "/earist_welcome") {
    return <WelcomePage />;
  }
  if (location.pathname === "/earist_job-categories") {
    return <JobCategoriesPage />;
  }
  if (location.pathname.startsWith("/job-available/")) {
    return <JobAvailablePage />;
  }
  if (location.pathname.startsWith("/application/")) {
    return <ApplicationPage />;
  }
  if (location.pathname === "/login" && user) {
    if (user.position === "admin") {
      return <Navigate to="/dashboard_admin" replace />;
    } else if (user.position === "employee") {
      return <Navigate to="/dashboard_employee" replace />;
    }
  }
  if (location.pathname.startsWith('/dashboard_admin')) {
    return <DashboardAdmin />;
  }
  if (location.pathname.startsWith('/dashboard_employee')) {
    return <DashboardEmployee />;
  }
  return (
    <AppLayout>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Admin protected routes */}
        <Route element={<ProtectedRoutes allowedRoles={["admin"]} />}>
          <Route path="/dashboard_admin/*" element={<DashboardAdmin />} />
          {/* Add more admin-only routes here */}
        </Route>
        {/* Employee protected routes */}
        <Route element={<ProtectedRoutes allowedRoles={["employee"]} />}>
          <Route path="/dashboard_employee/*" element={<DashboardEmployee />} />
          {/* Add more employee-only routes here */}
        </Route>
        {/* Catch-all: redirect unknown routes */}
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
