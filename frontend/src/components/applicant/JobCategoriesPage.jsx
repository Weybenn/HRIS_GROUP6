import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo/EARIST_Logo.png";
import cover from "../../assets/images/EARIST_cover.jpg";
import { 
  ClipboardList, 
  GraduationCap, 
  Laptop, 
  Wrench, 
  HandCoinsIcon, 
  Handshake,
  MapPin,
  Mail,
  Phone,
  Facebook,
  Link
} from "lucide-react";
import "../../assets/style/landing.css";

function JobCategoriesPage() {
  const navigate = useNavigate();
  const [showMapModal, setShowMapModal] = useState(false);
  
  useEffect(() => {
    document.title = "EARIST Application and Recruitment Portal";
  }, []);

  const JOB_CATEGORIES = [
    { label: 'Administrative Staff', icon: ClipboardList, slug: 'administrative-staff' },
    { label: 'Academic Faculty', icon: GraduationCap, slug: 'academic-faculty' },
    { label: 'IT & Technical Support', icon: Laptop, slug: 'it-technical-support' },
    { label: 'Facilities & Maintenance', icon: Wrench, slug: 'facilities-maintenance' },
    { label: 'Finance & Accounting', icon: HandCoinsIcon, slug: 'finance-accounting' },
    { label: 'Student Support Services', icon: Handshake, slug: 'student-support-services' },
  ];

  const handleCategoryClick = (category) => {
    navigate(`/job-available/${category.slug}`);
  };

  const handleEmailClick = () => {
    window.open('mailto:earistofficial1945@gmail.com', '_blank');
  };

  const handleFacebookClick = () => {
    window.open('https://web.facebook.com/EARISTOfficial', '_blank');
  };

  const handleWebsiteClick = () => {
    window.open('https://earist.edu.ph/', '_blank');
  };

  const handleLogoClick = () => {
    navigate('/earist_main');
  };

  return (
    <div className="app-bg" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="header header-invert">
        <img 
          src={logo} 
          alt="EARIST Logo" 
          className="header-logo" 
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }}
        />
        <div className="header-titles">
          <span className="header-title header-title-invert">
            Eulogio "Amang" Rodriguez Institute of Science and Technology
          </span>
          <span className="header-subtitle header-subtitle-invert">
            Application and Recruitment System
          </span>
        </div>
      </div>

      <div className="job-categories-container">
        <div className="job-categories-content">
          <h1 className="job-categories-title">Explore Our Teams & Join Us</h1>
          
          <div className="job-categories-grid">
            {JOB_CATEGORIES.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.label}
                  className="job-category-card"
                  onClick={() => handleCategoryClick(category)}
                >
                  <IconComponent size={44} className="job-category-icon" />
                  <span className="job-category-label">{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="job-categories-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">Contact Us</h3>
            <div className="footer-item" onClick={() => setShowMapModal(true)} style={{ cursor: 'pointer' }}>
              <MapPin size={20} />
              <span>Nagtahan St, Sampaloc, Manila, 1008 Metro Manila</span>
            </div>
            <div className="footer-item" onClick={() => window.open('https://mail.google.com/mail/?view=cm&fs=1&to=earistofficial1945@gmail.com', '_blank', 'noopener,noreferrer')} style={{ cursor: 'pointer' }}>
              <Mail size={20} />
              <span>earistofficial1945@gmail.com</span>
            </div>
            <div className="footer-item">
              <Phone size={20} />
              <span>(028)243-9467</span>
            </div>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-title">Follow and Visit Us</h3>
            <div className="footer-item" onClick={handleFacebookClick} style={{ cursor: 'pointer' }}>
              <Facebook size={20} />
              <span>EARISTOfficial</span>
            </div>
            <div className="footer-item" onClick={handleWebsiteClick} style={{ cursor: 'pointer' }}>
              <Link size={20} />
              <span>earist.edu.ph</span>
            </div>
          </div>
        </div>
        
        <div className="footer-copyright">
          © Eulogio "Amang" Rodriguez Institute of Science and Technology 2025
        </div>
      </div>

      {/* Map Modal */}
      {showMapModal && (
        <div className="modal-overlay" onClick={() => setShowMapModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>EARIST Location</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowMapModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.3056530517983!2d121.0006314!3d14.598802099999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c9e5410eb845%3A0xc70728ea6c31355!2sNagtahan%20St%2C%20Santa%20Mesa%2C%20Manila%2C%20Metro%20Manila!5e1!3m2!1sen!2sph!4v1759593492544!5m2!1sen!2sph"
                width="100%"
                height="400"
                style={{ border: 0, borderRadius: '8px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="EARIST Location Map"
              ></iframe>
              <p style={{ marginTop: '16px', fontSize: '14px', color: '#6D2323' }}>
                Eulogio "Amang" Rodriguez Institute of Science and Technology<br />
                Nagtahan St, Sampaloc, Manila, 1008 Metro Manila
              </p>
            </div>
          </div>
        </div>
      )}

      <img src={cover} alt="Background Cover" className="background-cover" />
    </div>
  );
}

export default JobCategoriesPage;