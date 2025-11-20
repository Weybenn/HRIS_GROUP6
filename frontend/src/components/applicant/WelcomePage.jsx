import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo/EARIST_Logo.png";
import campus from "../../assets/images/EARIST_login.png";
import { ArrowRight } from "lucide-react";
import "../../assets/style/landing.css";

function WelcomePage() {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = "EARIST Application and Recruitment Portal";
  }, []);

  return (
    <div className="app-bg" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="header header-invert">
        <img 
          src={logo} 
          alt="EARIST Logo" 
          className="header-logo" 
          onClick={() => navigate('/earist_main')}
          style={{ cursor: 'pointer' }}
        />
        <span className="header-title header-title-invert">
          Eulogio "Amang" Rodriguez Institute of Science and Technology
        </span>
      </div>

      <div className="welcome-wrap no-overflow-x">
        <div className="welcome-left">
          <h1 className="welcome-title welcome-title-center">Welcome to the
            <br/>EARIST Application
            <br/>and Recruitment
            <br/>Portal
          </h1>
          <img src={campus} alt="EARIST Campus" className="welcome-image" />
        </div>
        <div className="welcome-right">
          <div className="welcome-right-inner">
            <p className="welcome-text">
              This platform is designed with applicants in mind, offering a simple, secure, and efficient way to explore job openings, submit applications, and track your progress in real time. Whether you're a fresh graduate or an experienced professional, our goal is to make your application journey smooth and transparent.
            </p>
            <p className="welcome-text">
              We believe in providing equal opportunities and a seamless experience, so you can focus on what matters most — showcasing your skills and potential.
            </p>
            <p className="welcome-text">Start your journey with us today!</p>
            <div className="welcome-actions">
              <button className="welcome-btn solid-white" onClick={() => navigate('/earist_job-categories')}>
                Browse Job Opportunities
                <ArrowRight size={20} style={{ marginLeft: 10 }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;


