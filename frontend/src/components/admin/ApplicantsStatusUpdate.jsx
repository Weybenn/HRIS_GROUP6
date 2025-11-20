import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Edit3, Filter, Save, X, Users, Clock, CheckCircle, MessagesSquare, ClipboardList, Mail, CirclePlus, Footprints, Info } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import LoginModal from '../modals/LoginModal';
import phFlag from "../../assets/logo/philippines.png";

const FONT = 'Poppins, sans-serif';
const TEXT_COLOR = '#6D2323';

const STATUS_STYLES = {
  pending: { text: '#F59E0B', bg: '#fef3cd' },
  exam: { text: '#8B5CF6', bg: '#f3e8ff' },
  interview: { text: '#1976d2', bg: '#e3f2fd' },
  approved: { text: '#10B981', bg: '#d1fae5' },
  declined: { text: '#EF4444', bg: '#fee2e2' },
};

const TITLE_MAP = {
  'administrative-staff': 'Administrative Staff',
  'academic-faculty': 'Academic Faculty',
  'it-technical-support': 'IT & Technical Support',
  'facilities-maintenance': 'Facilities & Maintenance',
  'finance-accounting': 'Finance & Accounting',
  'student-support-services': 'Student Support Services',
};

export default function ApplicantsStatusUpdate() {
  const navigate = useNavigate();
  const params = useParams();
  const category = params.category || params.slug || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '');
  
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, exam: 0, interview: 0, approved: 0, declined: 0 });
  const [actionMessage, setActionMessage] = useState({ type: '', message: '' });
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingStatus, setEditingStatus] = useState(null);
  const [tempStatus, setTempStatus] = useState('');
  const [openWalkIn, setOpenWalkIn] = useState(false);
  const [walkInJobs, setWalkInJobs] = useState([]);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ joboffer_id: '', first_name: '', last_name: '', email: '', phone_number: '', address: '' });
  const [walkInErrors, setWalkInErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [walkInMessage, setWalkInMessage] = useState({ type: '', message: '' });

  const validateWalkInForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^9\d{9}$/;

    if (!walkInForm.joboffer_id) errors.joboffer_id = 'Please select a job offering';
    if (!walkInForm.first_name?.trim()) errors.first_name = 'First name is required';
    if (!walkInForm.last_name?.trim()) errors.last_name = 'Last name is required';
    if (!walkInForm.email?.trim()) errors.email = 'Email is required';
    else if (!emailRegex.test(walkInForm.email)) errors.email = 'Please enter a valid email';
    if (!walkInForm.phone_number) errors.phone_number = 'Phone number is required';
    else if (!phoneRegex.test(walkInForm.phone_number)) errors.phone_number = 'Phone number must be 10 digits starting with 9';
    if (!walkInForm.address?.trim()) errors.address = 'Address is required';

    setWalkInErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    fetchApplicants();
  }, [category]);

  useEffect(() => {
    if (openWalkIn) {
      const loadJobs = async () => {
        try {
          const res = await fetch(`http://localhost:5000/job-postings?category=${category}`);
          const data = await res.json();
          const active = Array.isArray(data) ? data.filter(j => j.status === 'Active') : [];
          setWalkInJobs(active);
        } catch (_) {
          setWalkInJobs([]);
        }
      };
      loadJobs();
    }
  }, [openWalkIn, category]);

  const recalcStats = (list) => {
    const total = list.length;
    const pending = list.filter(app => app.status === 'pending').length;
    const exam = list.filter(app => app.status === 'exam').length;
    const interview = list.filter(app => app.status === 'interview').length;
    const approved = list.filter(app => app.status === 'approved').length;
    const declined = list.filter(app => app.status === 'declined').length;
    setStats({ total, pending, exam, interview, approved, declined });
  };

  const fetchApplicants = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/applicants/category/${category}`);
      if (!res.ok) throw new Error('Failed to fetch applicants');
      const data = await res.json();
      setApplicants(data || []);
      recalcStats(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch applicants');
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/dashboard_admin/applicants-management');
  };

  const handleStatusUpdate = async (applicantId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/applicants/${applicantId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      setApplicants((prev) => {
        const updated = prev.map((a) => (a.id === applicantId ? { ...a, status: newStatus } : a));
        recalcStats(updated);
        return updated;
      });
      setEditingStatus(null);
      
      fetchApplicants();
    } catch (err) {
      setActionMessage({ type: 'error', message: err.message });
      setTimeout(() => setActionMessage({ type: '', message: '' }), 3000);
    }
  };

  const handleResumeClick = (resumePath) => {
    if (resumePath) {
      const url = resumePath.startsWith('http')
        ? resumePath
        : `http://localhost:5000/uploads/${resumePath.startsWith('resume/') ? resumePath : `resume/${resumePath}`}`;
      window.open(url, '_blank');
    }
  };

  const getFilteredApplicants = () => {
    if (statusFilter === 'All') {
      return applicants.filter((a) => a.status.toLowerCase() !== 'declined');
    }
    return applicants.filter((a) => a.status.toLowerCase() === statusFilter.toLowerCase());
  };

  const startEditing = (applicant) => {
    setEditingStatus(applicant.id);
    setTempStatus(applicant.status);
  };

  const cancelEditing = () => {
    setEditingStatus(null);
    setTempStatus('');
  };

  const saveStatus = () => {
    if (!tempStatus || editingStatus == null) {
      cancelEditing();
      return;
    }
    const current = applicants.find((a) => a.id === editingStatus)?.status;
    if (current !== tempStatus) {
      handleStatusUpdate(editingStatus, tempStatus);
    } else {
      cancelEditing();
    }
  };

  const title = TITLE_MAP[category] || 'Job Category';

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', padding: '0 2rem 2rem 2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <button
            onClick={handleBackClick}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 16 }}
            aria-label="Back to applicants management"
          >
            <ArrowLeft color="#6D2323" size={32} />
          </button>
          <h1 style={{ color: '#6D2323', fontWeight: 700, fontSize: 32, margin: 0 }}>
            {title} - Applicants
          </h1>
        </div>
      </div>

      {/* Top banner for actions/errors */}
      {actionMessage.message && (
        <div style={{ 
          position: 'fixed', 
          top: 12, 
          left: 16, 
          right: 16, 
          margin: '0 auto', 
          maxWidth: 900, 
          backgroundColor: actionMessage.type === 'success' ? '#1DA34A' : '#6D2323', 
          color: '#fff', 
          padding: '10px 16px', 
          borderRadius: 10, 
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)', 
          textAlign: 'center', 
          fontWeight: 500, 
          zIndex: 300 
        }}>
          <span>{actionMessage.message}</span>
        </div>
      )}

      {/* Status Summary Cards - match RegistrationStatusUpdate style */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #f8f9fa 0%, #FEF9E1 100%)', 
          padding: 20, borderRadius: 12, border: '2px solid #c49543', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Users size={28} color="#c49543" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: '#c49543' }}>{stats.total}</div>
          <div style={{ fontSize: 16, color: '#c49543', fontWeight: 500 }}>Applicants</div>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, #fef3cd 0%, #fde68a 100%)', 
          padding: 20, borderRadius: 12, border: '2px solid #f59e0b', textAlign: 'center', boxShadow: '0 2px 8px rgba(245,158,11,0.2)'
        }}>
          <Clock size={28} color="#F59E0B" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: '#F59E0B' }}>{stats.pending}</div>
          <div style={{ fontSize: 16, color: '#F59E0B', fontWeight: 500 }}>Pending</div>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', 
          padding: 20, borderRadius: 12, border: '2px solid #8b5cf6', textAlign: 'center', boxShadow: '0 2px 8px rgba(139,92,246,0.2)'
        }}>
          <ClipboardList size={28} color="#8B5CF6" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: '#8B5CF6' }}>{stats.exam}</div>
          <div style={{ fontSize: 16, color: '#8B5CF6', fontWeight: 500 }}>Exam</div>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, #e3f2fd 0%, #cfe8ff 100%)', 
          padding: 20, borderRadius: 12, border: '2px solid #1976d2', textAlign: 'center', boxShadow: '0 2px 8px rgba(25,118,210,0.2)'
        }}>
          <MessagesSquare size={28} color="#1976d2" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1976d2' }}>{stats.interview}</div>
          <div style={{ fontSize: 16, color: '#1976d2', fontWeight: 500 }}>Interview</div>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
          padding: 20, borderRadius: 12, border: '2px solid #10b981', textAlign: 'center', boxShadow: '0 2px 8px rgba(16,185,129,0.2)'
        }}>
          <CheckCircle size={28} color="#10B981" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: '#10B981' }}>{stats.approved}</div>
          <div style={{ fontSize: 16, color: '#10B981', fontWeight: 500 }}>Approved</div>
        </div>
      </div>

      {/* Status Filter + Walk-in Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Filter size={20} color="#6D2323" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 24px 8px 12px',
              borderRadius: 4,
              border: '1px solid #ddd',
              fontFamily: FONT,
              fontSize: 14,
              background: 'white',
              minWidth: '160px',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='gray' height='16' viewBox='0 0 24 24' width='16' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center'
            }}
          >
            <option value="All">All Status</option>
            <option value="pending">Pending</option>
            <option value="exam">Exam</option>
            <option value="interview">Interview</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
          </select>
        </div>
        <div>
          <button
            onClick={() => setOpenWalkIn(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              background: '#6D2323',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              fontFamily: FONT,
              borderRadius: 6,
              padding: '10px 14px',
              cursor: 'pointer'
            }}
          >
            <CirclePlus size={18} color={'#fff'} /> Walk-in
          </button>
        </div>
      </div>

      {/* Applicants Table */}
      {loading ? (
        <div style={{ fontSize: 18, color: '#666', textAlign: 'center', padding: '40px 0' }}>
          Loading applicants...
        </div>
      ) : error ? (
        <div style={{ color: '#dc3545', textAlign: 'center', padding: '40px 0' }}>{error}</div>
      ) : applicants.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', fontSize: 18, padding: '40px 0' }}>
          No applicants found for this category.
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {getFilteredApplicants().length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#666', fontFamily: FONT }}>
              No applicants found for the selected filter.
            </div>
          ) : null}
          <div style={{ overflowX: 'auto', display: getFilteredApplicants().length === 0 ? 'none' : 'block' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
              <thead>
                <tr style={{ background: '#6D2323', borderBottom: '1px solid #e9ecef' }}>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: 'white' }}>Applicant</th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: 'white' }}>Job Applied</th>
                  <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: 'white' }}>Resume</th>
                  <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: 'white' }}>Date Applied</th>
                  <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: 'white' }}>Status</th>
                  <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: 'white' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredApplicants().map((applicant) => (
                  <tr key={applicant.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: 12, color: '#000000' }}>
                      <div style={{ fontWeight: 600 }}>
                        {applicant.first_name} {applicant.last_name}
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {applicant.email || "no-email@example.com"}
                      </div>
                    </td>
                    <td style={{ padding: 12, color: '#000000' }}>{applicant.job_title || '—'}</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      {applicant.resume ? (
                        <button
                          onClick={() => handleResumeClick(applicant.resume)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6D2323',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          aria-label="Open resume file"
                        >
                          <FileText size={18} />
                        </button>
                      ) : (
                        <span title="Walk-in" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#6D2323' }}>
                          <Footprints size={18} />
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 12, color: '#000000', textAlign: 'center' }}>
                      {new Date(applicant.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric'
                          }
                        )
                      }
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      {editingStatus === applicant.id ? (
                        <select
                          value={tempStatus}
                          onChange={(e) => setTempStatus(e.target.value)}
                          style={{
                            padding: '4px 20px 4px 8px',
                            borderRadius: 4,
                            border: '1px solid #ddd',
                            fontFamily: FONT,
                            fontSize: 12,
                            background: 'white',
                            minWidth: '120px',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='gray' height='14' viewBox='0 0 24 24' width='14' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 6px center'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="exam">Exam</option>
                          <option value="interview">Interview</option>
                          <option value="approved">Approved</option>
                          <option value="declined">Declined</option>
                        </select>
                      ) : (
                        <span style={{
                          color: STATUS_STYLES[applicant.status]?.text,
                          fontWeight: 600,
                          background: STATUS_STYLES[applicant.status]?.bg,
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 12,
                          display: 'inline-block'
                        }}>
                          {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      {editingStatus === applicant.id ? (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            onClick={saveStatus}
                            style={{
                              padding: '4px 8px',
                              background: '#10B981',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontFamily: FONT,
                              fontSize: 12,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Save size={12} />
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            style={{
                              padding: '4px 8px',
                              background: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontFamily: FONT,
                              fontSize: 12,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <X size={12} />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                          <button
                            onClick={() => startEditing(applicant)}
                            style={{
                              padding: '4px 8px',
                              background: '#F59E0B',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontFamily: FONT,
                              fontSize: 12,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Edit3 size={12} />
                            Edit
                          </button>
                          {/* Email button - opens Gmail compose with applicant's email */}
                          <button
                            onClick={() => {
                              const to = encodeURIComponent(applicant.email || '');
                              const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}`;
                              window.open(url, '_blank');
                            }}
                            title={`Email ${applicant.email || ''}`}
                            style={{
                              padding: '4px 8px',
                              background: '#10B981',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontFamily: FONT,
                              fontSize: 12,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <Mail size={12} />
                            Email
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Walk-in Modal */}
      {openWalkIn && (
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
            <button
              onClick={() => {
                setOpenWalkIn(false);
                setWalkInForm({ joboffer_id: '', first_name: '', last_name: '', email: '', phone_number: '', address: '' });
                setWalkInErrors({});
                setWalkInMessage({ type: '', message: '' });
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%'
              }}
              aria-label="Close Walk-in"
            >
              <X size={24} color={'#6D2323'} />
            </button>

            <h2 style={{
              color: TEXT_COLOR,
              fontSize: '28px',
              fontWeight: '600',
              marginBottom: '16px',
              textAlign: 'left',
              fontFamily: FONT
            }}>
              Walk-in Application Form
            </h2>

            <hr style={{
              border: 'none',
              height: '2px',
              backgroundColor: TEXT_COLOR,
              marginBottom: '32px'
            }} />

            {walkInMessage.message && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '24px',
                backgroundColor: walkInMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                color: walkInMessage.type === 'success' ? '#155724' : '#721c24',
                border: `1px solid ${walkInMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                fontFamily: FONT,
                fontSize: '14px'
              }}>
                {walkInMessage.message}
              </div>
            )}

            {/* Job Offering */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                color: TEXT_COLOR,
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '12px',
                fontFamily: FONT
              }}>
                Job Offering
              </h3>
              <select
                name="joboffer_id"
                value={walkInForm.joboffer_id}
                onChange={(e) => {
                  setWalkInForm(prev => ({ ...prev, joboffer_id: e.target.value }));
                  setWalkInErrors(prev => ({ ...prev, joboffer_id: undefined }));
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: `2px solid ${walkInErrors.joboffer_id ? '#dc2626' : '#6D2323'}`,
                  backgroundColor: walkInErrors.joboffer_id ? '#fff5f5' : 'white',
                  fontFamily: FONT,
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='${encodeURIComponent('#6D2323')}' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 14px center'
                }}
              >
                <option value="">Select Job Offering</option>
                {walkInJobs.map(j => (
                  <option key={j.id} value={j.id}>{j.job_title}</option>
                ))}
              </select>
            </div>

            {/* Personal Details */}
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
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      name="first_name"
                      type="text"
                      value={walkInForm.first_name}
                      onChange={(e) => {
                        setWalkInForm(prev => ({ ...prev, first_name: e.target.value }));
                        setWalkInErrors(prev => ({ ...prev, first_name: undefined }));
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: `2px solid ${walkInErrors.first_name ? '#dc2626' : '#6D2323'}`,
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontFamily: FONT,
                        backgroundColor: walkInErrors.first_name ? '#fff5f5' : 'white'
                      }}
                      required
                    />
                    {walkInErrors.first_name && (
                      <div style={{
                        position: 'absolute',
                        right: -25,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#dc2626'
                      }}>
                      </div>
                    )}
                  </div>
                </div>
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
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      name="last_name"
                      type="text"
                      value={walkInForm.last_name}
                      onChange={(e) => {
                        setWalkInForm(prev => ({ ...prev, last_name: e.target.value }));
                        setWalkInErrors(prev => ({ ...prev, last_name: undefined }));
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: `2px solid ${walkInErrors.last_name ? '#dc2626' : '#6D2323'}`,
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontFamily: FONT,
                        backgroundColor: walkInErrors.last_name ? '#fff5f5' : 'white'
                      }}
                      required
                    />
                    {walkInErrors.last_name && (
                      <div style={{
                        position: 'absolute',
                        right: -25,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#dc2626'
                      }}>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    name="email"
                    type="email"
                    value={walkInForm.email}
                    onChange={(e) => {
                      setWalkInForm(prev => ({ ...prev, email: e.target.value }));
                      setWalkInErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${walkInErrors.email ? '#dc2626' : '#6D2323'}`,
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontFamily: FONT,
                      backgroundColor: walkInErrors.email ? '#fff5f5' : 'white'
                    }}
                    required
                  />
                  {walkInErrors.email && (
                    <div style={{
                      position: 'absolute',
                      right: -25,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#dc2626'
                    }}>
                    </div>
                  )}
                </div>
              </div>
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
                <div style={{ display: 'flex', alignItems: 'center', border: `2px solid ${walkInErrors.phone_number ? '#dc2626' : '#6D2323'}`, borderRadius: 8, overflow: 'hidden' }}>
                  <span style={{ padding: '8px 12px', background: '#fff', color: TEXT_COLOR, fontWeight: 700, borderRight: `1px solid ${walkInErrors.phone_number ? '#dc2626' : '#6D2323'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 96 }}>
                    <img src={phFlag} alt="Philippines" style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2 }} />
                    +63
                  </span>
                  <input
                    name="phone_number"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={walkInForm.phone_number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setWalkInForm(prev => ({ ...prev, phone_number: value }));
                      setWalkInErrors(prev => ({ ...prev, phone_number: undefined }));
                    }}
                    placeholder="9XXXXXXXXX"
                    style={{ 
                      flex: 1, 
                      padding: '12px 16px', 
                      border: 'none', 
                      outline: 'none', 
                      fontSize: 16, 
                      background: walkInErrors.phone_number ? '#fff5f5' : 'transparent'
                    }}
                    required
                  />
                  {walkInErrors.phone_number && (
                    <div style={{
                      position: 'absolute',
                      right: -25,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#dc2626'
                    }}>
                    </div>
                  )}
                </div>
              </div>
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
                <div style={{ position: 'relative', width: '100%' }}>
                  <textarea
                    name="address"
                    value={walkInForm.address}
                    onChange={(e) => {
                      setWalkInForm(prev => ({ ...prev, address: e.target.value }));
                      setWalkInErrors(prev => ({ ...prev, address: undefined }));
                    }}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${walkInErrors.address ? '#dc2626' : '#6D2323'}`,
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontFamily: FONT,
                      backgroundColor: walkInErrors.address ? '#fff5f5' : 'white',
                      resize: 'vertical'
                    }}
                    required
                  />
                  {walkInErrors.address && (
                    <div style={{
                      position: 'absolute',
                      right: -25,
                      top: 12,
                      color: '#dc2626'
                    }}>
                    </div>
                  )}
                </div>
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
                Please double-check all the information before submitting. All fields are required and must be filled out completely.
              </p>
            </div>

            {/* Validation summary - persistent until errors are fixed */}
            {Object.keys(walkInErrors).length > 0 && (
              <div style={{
                color: '#dc3545',
                fontSize: '14px',
                padding: '12px 16px',
                background: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '8px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: FONT
              }}>
                <span>Please fill out all required fields.</span>
                <Info size={16} color="#dc3545" />
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button
                disabled={walkInSubmitting}
                onClick={async () => {
                  if (!validateWalkInForm()) {
                    const firstErrorField = Object.keys(walkInErrors)[0];
                    const element = document.querySelector(`[name="${firstErrorField}"]`);
                    if (element) element.focus();
                    return;
                  }
                  try {
                    setWalkInSubmitting(true);
                    const res = await fetch('http://localhost:5000/applicants/walkin', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(walkInForm)
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({ error: 'Failed to submit walk-in' }));
                      throw new Error(err.error || 'Failed to submit walk-in');
                    }
                    setOpenWalkIn(false);
                    setWalkInErrors({});
                    setWalkInMessage({ type: '', message: '' });
                    setShowSuccessModal(true);
                    setWalkInForm({ joboffer_id: '', first_name: '', last_name: '', email: '', phone_number: '', address: '' });
                    fetchApplicants();
                  } catch (e) {
                    setWalkInMessage({ type: 'error', message: e.message || 'Failed to submit walk-in' });
                    setTimeout(() => setWalkInMessage({ type: '', message: '' }), 2500);
                  } finally {
                    setWalkInSubmitting(false);
                  }
                }}
                style={{
                  backgroundColor: walkInSubmitting ? '#ccc' : '#6D2323',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '16px 48px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: walkInSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: FONT,
                  width: '100%'
                }}
              >
                {walkInSubmitting ? 'Submitting…' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <LoginModal
          type="success"
          message="Application submitted successfully."
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
}
