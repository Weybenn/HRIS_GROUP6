import { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList, GraduationCap, Laptop, Wrench, HandCoins, Handshake } from 'lucide-react'; // Corrected import
import { useNavigate } from 'react-router-dom';
import LoadingOverlay from '../LoadingOverlay'; // 1. Import the component

const FONT = 'Poppins, sans-serif';

const JOB_CATEGORIES = [
  { label: 'Administrative Staff', icon: ClipboardList, slug: 'administrative-staff' },
  { label: 'Academic Faculty', icon: GraduationCap, slug: 'academic-faculty' },
  { label: 'IT & Technical Support', icon: Laptop, slug: 'it-technical-support' },
  { label: 'Facilities & Maintenance', icon: Wrench, slug: 'facilities-maintenance' },
  { label: 'Finance & Accounting', icon: HandCoins, slug: 'finance-accounting' }, // Corrected icon
  { label: 'Student Support Services', icon: Handshake, slug: 'student-support-services' },
];

export default function ApplicantsManagement() {
  const navigate = useNavigate();
  const [applicantCounts, setApplicantCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true); // 2. Add loading state, start as true

  useEffect(() => {
    fetchApplicantCounts();
  }, []);

  const fetchApplicantCounts = async () => {
    setIsLoading(true); // 3. Set loading to true before fetch
    try {
      const res = await fetch('http://localhost:5000/applicants/counts-by-category');
      if (res.ok) {
        const data = await res.json();
        setApplicantCounts(data);
      }
    } catch (error) {
      console.error('Failed to fetch applicant counts:', error);
    } finally {
      setIsLoading(false); // 4. Set loading to false after fetch completes
    }
  };

  const handleBackClick = () => {
    navigate('/dashboard_admin/data');
  };

  const handleCategoryClick = (category) => {
    navigate(`/dashboard_admin/applicants-status-update/${category.slug}`);
  };

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 2rem 2rem 2rem' }}>
      {/* 5. Pass the state to the overlay's 'open' prop */}
      <LoadingOverlay open={isLoading} message="Fetching applicant counts..." />
      
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button
            onClick={handleBackClick}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 16 }}
            aria-label="Back to dashboard"
          >
            <ArrowLeft color="#6D2323" size={32} />
          </button>
          <h1 style={{ color: '#6D2323', fontWeight: 700, fontSize: 32, margin: 0 }}>
            Applicants Management
          </h1>
        </div>
        <p style={{ color: '#666', fontSize: 18, margin: 0, maxWidth: 1220 }}>
          Select a specific category to manage applicants' forms and review their applications.
        </p>
      </div>

      {/* Job Categories Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
        {JOB_CATEGORIES.map((category) => {
          const IconComponent = category.icon;
          const count = applicantCounts[category.slug] || 0;
          
          return (
            <button
              key={category.label}
              onClick={() => handleCategoryClick(category)}
              style={{
                background: '#ffffff',
                border: '2px solid #6D2323',
                borderRadius: 4,
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minHeight: 180,
                fontFamily: FONT,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                color: '#6D2323'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#6D2323';
                e.currentTarget.style.color = '#FEF9E1';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(163, 29, 29, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#6D2323';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
              }}
            >
              <IconComponent size={48} style={{ color: 'inherit' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'inherit' }}>
                  {category.label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'inherit', opacity: 0.8 }}>
                  {count} applicant{count !== 1 ? 's' : ''}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}