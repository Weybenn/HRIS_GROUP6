import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo/EARIST_Logo.png";
import cover from "../../assets/images/EARIST_cover.jpg";
import "../../assets/style/landing.css";

function MainPage() {
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

      <div className="page-center">
        <div className="hero-contained">
        <div className="hero-col hero-col-left">
          <div>
            <div className="hero-title center">Your Next Opportunity<br/>Starts Here</div>
            <div className="hero-sub center">Elevate your potential in a place where your skills and ideas truly matter.</div>
          </div>
        </div>
        <div className="hero-col hero-col-right">
          <div className="hero-actions center">
            <button className="hero-btn" onClick={() => navigate('/earist_welcome')}>Learn more</button>
          </div>
        </div>
        </div>
        <div className="hero-footer">
        © Eulogio "Amang" Rodriguez Institute of Science and Technology 2025
        </div>
      </div>
      <img src={cover} alt="Background Cover" className="background-cover" />
    </div>
  );
}

export default MainPage;

