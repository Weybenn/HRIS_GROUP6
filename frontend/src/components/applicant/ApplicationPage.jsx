import { useState, useEffect, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, FileText, Info } from 'lucide-react';
import LoginModal from '../modals/LoginModal';
import logo from "../../assets/logo/EARIST_Logo.png";
import phFlag from "../../assets/logo/philippines.png";
import cover from "../../assets/images/EARIST_cover.jpg";
import "../../assets/style/landing.css";

const FONT = 'Poppins, sans-serif';
const TEXT_COLOR = '#6D2323';

function ApplicationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const job = location.state?.job;
  const recaptchaRef = useRef(null);
  const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', message: '' });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showModal, setShowModal] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  useEffect(() => {
    if (!job) {
      navigate('/earist_job-categories');
    }
    document.title = `Application for ${job?.job_title || 'Job Position'} - EARIST`;
  }, [job, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, phoneNumber: digitsOnly }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setSubmitMessage({ type: 'error', message: 'Please upload a valid PDF or Word document' });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setSubmitMessage({ type: 'error', message: 'File size must be less than 10MB' });
        return;
      }
      
      setUploadedFile(file);
      setSubmitMessage({ type: '', message: '' });
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    const fileInput = document.getElementById('resume-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage({ type: '', message: '' });

    try {
      if (!captchaToken) {
        throw new Error('Please complete the captcha to continue');
      }
      const form = new FormData();
      form.append('job_id', job.id);
      form.append('first_name', formData.firstName);
      form.append('last_name', formData.lastName);
      form.append('email', formData.email);
      const phoneFormatted = formData.phoneNumber ? `+63${formData.phoneNumber}` : '';
      form.append('phone_number', phoneFormatted);
      form.append('address', formData.address);
      form.append('captcha_token', captchaToken);
      if (uploadedFile) {
        form.append('resume', uploadedFile);
      }

      const response = await fetch('http://localhost:5000/applicants', {
        method: 'POST',
        body: form,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application');
      }

      setSubmitMessage({ type: 'success', message: 'Application submitted successfully!' });
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        address: ''
      });
      setUploadedFile(null);
      const fileInput = document.getElementById('resume-upload');
      if (fileInput) {
        fileInput.value = '';
      }
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.reset();
        } catch (_) {}
      }
      setCaptchaToken('');
      
      setShowModal(false);
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowModal(false);
        navigate('/earist_job-categories');
      }, 2000);

    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitMessage({ type: 'error', message: error.message || 'Failed to submit application' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate(-1);
  };

  const handleLogoClick = () => {
    navigate('/earist_main');
  };

  if (!job) {
    return null;
  }

  return (
    <div className="app-bg" style={{ fontFamily: FONT }}>
      <div className="header header-invert">
        <img 
          src={logo} 
          alt="EARIST Logo" 
          className="header-logo" 
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }}
        />
        <span className="header-title header-title-invert">
          Eulogio "Amang" Rodriguez Institute of Science and Technology
        </span>
      </div>

      {/* Application Modal */}
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(128, 128, 128, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            fontFamily: FONT,
            isolation: 'isolate'
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              padding: '32px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              zIndex: 1100
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: TEXT_COLOR
              }}
            >
              <X size={24} />
            </button>

            {/* Title */}
            <h2 style={{
              color: TEXT_COLOR,
              fontSize: '28px',
              fontWeight: '600',
              marginBottom: '16px',
              textAlign: 'left',
              fontFamily: FONT
            }}>
              Job Application Form
            </h2>
            
            {/* Horizontal Line */}
            <hr style={{
              border: 'none',
              height: '2px',
              backgroundColor: TEXT_COLOR,
              marginBottom: '32px'
            }} />

            {/* Success/Error Message */}
            {submitMessage.message && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '24px',
                backgroundColor: submitMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                color: submitMessage.type === 'success' ? '#155724' : '#721c24',
                border: `1px solid ${submitMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                fontFamily: FONT,
                fontSize: '14px'
              }}>
                {submitMessage.message}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Personal Details Section */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{
                  color: TEXT_COLOR,
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  fontFamily: FONT
                }}>
                  Personal Details
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  {/* First Name */}
                  <div>
                    <label style={{
                      display: 'block',
                      color: TEXT_COLOR,
                      fontSize: '16px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      fontFamily: FONT
                    }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #6D2323',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontFamily: FONT,
                        backgroundColor: 'white'
                      }}
                      required
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label style={{
                      display: 'block',
                      color: TEXT_COLOR,
                      fontSize: '16px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      fontFamily: FONT
                    }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #6D2323',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontFamily: FONT,
                        backgroundColor: 'white'
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    color: TEXT_COLOR,
                    fontSize: '16px',
                    fontWeight: '500',
                    marginBottom: '8px',
                    fontFamily: FONT
                  }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #6D2323',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontFamily: FONT,
                      backgroundColor: 'white'
                    }}
                    required
                  />
                </div>

                {/* Phone Number */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    color: TEXT_COLOR,
                    fontSize: '16px',
                    fontWeight: '500',
                    marginBottom: '8px',
                    fontFamily: FONT
                  }}>
                    Phone Number *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #6D2323', borderRadius: 8, overflow: 'hidden' }}>
                    <span style={{ padding: '8px 12px', background: '#fff', color: TEXT_COLOR, fontWeight: 700, borderRight: '1px solid #6D2323', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 96 }}>
                      <img src={phFlag} alt="Philippines" style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2 }} />
                      +63
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="9XXXXXXXXX"
                      style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: 16, background: 'transparent' }}
                      required
                    />
                  </div>
                </div>

                {/* Complete Address */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    color: TEXT_COLOR,
                    fontSize: '16px',
                    fontWeight: '500',
                    marginBottom: '8px',
                    fontFamily: FONT
                  }}>
                    Complete Address *
                  </label>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                    House Number, Street Name, Village/Subdivision, Barangay, City/Province, Zip Code
                  </div>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #6D2323',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontFamily: FONT,
                      backgroundColor: 'white',
                      resize: 'vertical'
                    }}
                    required
                  />
                </div>
              </div>

              {/* Upload Section */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{
                  color: TEXT_COLOR,
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  fontFamily: FONT
                }}>
                  Upload Your Resume *
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('resume-upload').click()}
                    style={{
                      backgroundColor: TEXT_COLOR,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 20px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontFamily: FONT,
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#8A1A1A'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = TEXT_COLOR}
                  >
                    <FileText size={20} />
                    Upload File
                  </button>
                  
                  {uploadedFile && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#f8f9fa',
                      border: '2px solid #6D2323',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      flex: 1
                    }}>
                      <FileText size={16} style={{ color: TEXT_COLOR }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {uploadedFile.name}
                        </span>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleRemoveFile} 
                        style={{ 
                          backgroundColor: 'transparent', 
                          border: 'none', 
                          color: '#dc3545', 
                          cursor: 'pointer' 
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notice */}
              <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #6D2323',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <Info size={20} style={{ color: TEXT_COLOR, marginTop: '2px', flexShrink: 0 }} />
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#333',
                  lineHeight: '1.5',
                  fontFamily: FONT
                }}>
                  Please double-check all your information before submitting. All fields are required and must be filled out completely.
                </p>
              </div>

            {/* Captcha */}
            <div style={{ marginBottom: '24px' }}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={SITE_KEY}
                onChange={(token) => setCaptchaToken(token || '')}
                onExpired={() => setCaptchaToken('')}
              />
              {!captchaToken && (
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                  Complete the captcha to enable submission.
                </div>
              )}
            </div>

              {/* Submit Button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="submit"
                  disabled={isSubmitting || !uploadedFile || !captchaToken}
                  style={{
                    backgroundColor: (isSubmitting || !uploadedFile || !captchaToken) ? '#ccc' : TEXT_COLOR,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '16px 48px',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: (isSubmitting || !uploadedFile || !captchaToken) ? 'not-allowed' : 'pointer',
                    fontFamily: FONT,
                    transition: 'background-color 0.2s',
                    width: '100%',
                    opacity: (isSubmitting || !uploadedFile || !captchaToken) ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting && uploadedFile && captchaToken) {
                      e.target.style.backgroundColor = '#8A1A1A';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting && uploadedFile && captchaToken && captchaReady) {
                      e.target.style.backgroundColor = TEXT_COLOR;
                    }
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <LoginModal type="success" message="Application submitted successfully." onClose={handleSuccessClose} />
      )}

      <img src={cover} alt="Background Cover" className="background-cover" />
    </div>
  );
}

export default ApplicationPage;
