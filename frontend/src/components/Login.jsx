import { useState } from "react";
import loginPic from "../assets/images/EARIST_login.png";
import { Eye, EyeClosed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoginModal from "./modals/LoginModal";
import ForgotPasswordModal from "./modals/ForgotPasswordModal";
import OTPModal from "./modals/OTPModal";
import LoadingOverlay from "./LoadingOverlay"; //1. Import it


function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [modal, setModal] = useState({ open: false, type: "error", message: "" });
  const [forgotOpen, setForgotOpen] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 2. Add loading state
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId && !password) {
      setModal({ open: true, type: "error", message: "Username and password are required." });
      return;
    }
    if (!employeeId) {
      setModal({ open: true, type: "error", message: "Username is required." });
      return;
    }
    if (!password) {
      setModal({ open: true, type: "error", message: "Password is required." });
      return;
    }
    
    setIsLoading(true); // 3. Set loading to true before fetch
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId, password }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.error === "Invalid username or password") {
          setModal({ open: true, type: "error", message: "Invalid login. Please check your username and password." });
        } else {
          setModal({ open: true, type: "error", message: data.error || "Login failed." });
        }
        return;
      }
      if (data.user && data.user.status === "inactive") {
        setPendingRedirect(null);
        setModal({
          open: true,
          type: "error",
          message:
            "Your account has been marked as inactive. If you believe this is a mistake or you need assistance, please contact your HR Administrator.",
        });
        return;
      }
      
      setPendingRedirect(data.user);
      setUserEmail(data.user.email);
      
      setModal({ 
        open: true, 
        type: "success", 
        message: `Credentials verified. Please check your email (${data.user.email}) for the OTP code.` 
      });
      
      try {
        await fetch("http://localhost:5000/login/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employee_id: employeeId }),
        });
      } catch (otpErr) {
        console.error("Error sending OTP:", otpErr);
        setModal({ 
          open: true, 
          type: "error", 
          message: "Failed to send OTP. Please try again." 
        });
      }
    } catch (err) {
      setModal({ open: true, type: "error", message: err.message || "Login failed." });
    } finally {
      setIsLoading(false); // 4. Set loading to false in a finally block
    }
  };

  const handleModalClose = () => {
    if (modal.type === "success" && pendingRedirect) {
      setModal({ ...modal, open: false });
      setTimeout(() => {
        setOtpOpen(true);
      }, 300);
    } else {
      setModal({ ...modal, open: false });
    }
  };

  const handleOTPVerify = async (otpCode) => {
    setIsLoading(true); // 5. Set loading to true for OTP verification
    try {
      const res = await fetch("http://localhost:5000/login/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          employee_id: employeeId, 
          otp: otpCode 
        }),
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "Invalid OTP code. Please try again.");
      }
      
      localStorage.setItem("user", JSON.stringify(pendingRedirect));
      setOtpOpen(false);
      
      setModal({ 
        open: true, 
        type: "success", 
        message: `Welcome, ${pendingRedirect.first_name} ${pendingRedirect.last_name}` 
      });
      
      setTimeout(() => {
        if (pendingRedirect.position === "admin") {
          navigate("/dashboard_admin");
        } else if (pendingRedirect.position === "employee") {
          navigate("/dashboard_employee");
        }
        setPendingRedirect(null);
      }, 1000);
      
    } catch (err) {
      setIsLoading(false); // Turn off loading on error to allow retry
      throw err; // Re-throw the error to be handled by the OTPModal
    }
  };

  const handleResendOTP = async () => {
    try {
      setResending(true); // This state is already managed
      await fetch("http://localhost:5000/login/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId }),
      });
      setModal({ 
        open: true, 
        type: "success", 
        message: "OTP code has been resent to your email." 
      });
    } catch (err) {
      setModal({ 
        open: true, 
        type: "error", 
        message: "Failed to resend OTP. Please try again." 
      });
    } finally {
      setResending(false);
    }
  };

  const handleOTPClose = () => {
    setOtpOpen(false);
    setPendingRedirect(null);
  };

  return (
    <div className="login-container">
      <div className="login-box login-box-bordered">
        <h2 className="login-title">User Authentication</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            className="login-input login-input-bordered"
            autoComplete="username"
            value={employeeId}
            onChange={e => setEmployeeId(e.target.value)}
          />
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="login-input login-input-bordered password-input"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {password && (
              <span
                onClick={() => setShowPassword((v) => !v)}
                className="password-toggle-icon"
                tabIndex={0}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Eye size={22} /> : <EyeClosed size={22} />}
              </span>
            )}
          </div>
          <div className="forgot-row">
            <button type="button" className="forgot-link" onClick={() => setForgotOpen(true)}>
              Forgot password?
            </button>
          </div>
          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        <img src={loginPic} alt="EARIST Login" className="login-image login-image-stretch" />
      </div>
      {modal.open && (
        <LoginModal
          type={modal.type}
          message={modal.message}
          onClose={handleModalClose}
        />
      )}
      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
      
      {otpOpen && pendingRedirect && (
        <OTPModal
          open={otpOpen}
          onClose={handleOTPClose}
          email={userEmail}
          onVerify={handleOTPVerify}
          resending={resending}
          onResend={handleResendOTP}
        />
      )}

      {/* 6. Add the LoadingOverlay, controlled by isLoading or resending */}
      <LoadingOverlay open={isLoading || resending} />
    </div>
  );
}

export default Login;