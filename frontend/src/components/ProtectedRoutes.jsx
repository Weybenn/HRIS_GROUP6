import { Navigate, Outlet, useLocation } from "react-router-dom";

/**
 * ProtectedRoutes component
 * @param {string[]} allowedRoles - array of allowed roles for this route (e.g., ["admin"])
 */
const ProtectedRoutes = ({ allowedRoles }) => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  if (user && location.pathname === '/login') {
    if (user.position === "admin") {
      return <Navigate to="/dashboard_admin" replace />;
    } else if (user.position === "employee") {
      return <Navigate to="/dashboard_employee" replace />;
    }
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.position)) {
    if (user.position === "admin") {
      return <Navigate to="/dashboard_admin" replace />;
    } else if (user.position === "employee") {
      return <Navigate to="/dashboard_employee" replace />;
    } else {
      localStorage.removeItem("user");
      return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoutes;
