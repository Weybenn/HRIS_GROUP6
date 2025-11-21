import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cover from "../../assets/images/EARIST_cover.jpg";
import "../../assets/style/landing.css";

function MainPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = "EARIST Application and Recruitment Portal";
  }, []);

  return (
    <div className="app-bg" style={{ fontFamily: 'Poppins, sans-serif' }}>
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
      </div>
      <img src={cover} alt="Background Cover" className="background-cover" />
    </div>
  );
}

export default MainPage;