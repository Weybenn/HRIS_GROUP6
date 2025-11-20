import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const FONT = 'Poppins, sans-serif';
const PRIMARY = '#A31D1D';
const PRIMARY_TEXT = '#FEF9E1';

export default function ForgotPasswordModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  if (!open) return null;

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !email.trim()) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/forgot-password/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to process request');
      }

      setUserInfo(data.user);
      setShowConfirmation(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRequest = async () => {
    if (!userInfo) return;
    
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(),
          user_id: userInfo.id
        })
      });
      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setShowConfirmation(false);
      setShowSuccessModal(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setEmail('');
    setUserInfo(null);
    setError('');
  };

  if (showSuccessModal) {
  return (
    <>
      <LoadingOverlay open={loading} message="Processing..." />
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 25, boxShadow: '0 4px 32px rgba(0,0,0,0.18)', padding: '40px 32px', minWidth: 380, maxWidth: '95vw', fontFamily: FONT, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
            <CheckCircle2 size={48} color="#1DA34A" />
          </div>
          <div style={{ fontSize: 20, color: '#222', marginBottom: 32, textAlign: 'center' }}>
            Password reset request has been submitted successfully.
          </div>
          <button
            onClick={() => {
              setShowSuccessModal(false);
              setEmail('');
              setUserInfo(null);
              onClose();
            }}
            style={{
              borderRadius: 12,
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 20,
              padding: '10px 32px',
              border: 'none',
              cursor: 'pointer',
              background: '#1DA34A',
              color: '#FEF9E1',
              transition: 'background 0.2s, color 0.2s'
            }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 520, maxWidth: '92vw', boxShadow: '0 10px 30px #0003', fontFamily: FONT, position: 'relative' }}>
        {!showConfirmation ? (
          <>
            <h3 style={{ margin: 0, marginBottom: 20, color: PRIMARY, fontSize: 20, fontWeight: 800, textAlign: 'center' }}>
              Forgot Password
            </h3>
            <p style={{ margin: 0, marginBottom: 20, color: '#666', lineHeight: 1.6, textAlign: 'center', fontSize: 14 }}>
              Enter your email address to request a password reset.
            </p>
            <form onSubmit={handleEmailSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, color: '#333', fontWeight: 600, fontSize: 14 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your email address"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${error ? '#dc3545' : '#ddd'}`,
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: FONT,
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = PRIMARY}
                  onBlur={(e) => e.target.style.borderColor = error ? '#dc3545' : '#ddd'}
                  disabled={loading}
                />
                {error && (
                  <div style={{ marginTop: 8, color: '#dc3545', fontSize: 12 }}>
                    {error}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    background: '#e5e7eb',
                    color: '#111827',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 8,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    fontFamily: FONT
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? '#ccc' : PRIMARY,
                    color: PRIMARY_TEXT,
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 8,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: 14,
                    fontFamily: FONT,
                    transition: 'background 0.2s'
                  }}
                >
                  {loading ? 'Processing...' : 'Request Reset'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3 style={{ margin: 0, marginBottom: 20, color: PRIMARY, fontSize: 20, fontWeight: 800, textAlign: 'center' }}>
              Confirm Password Reset Request
            </h3>
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: 0, marginBottom: 12, color: '#333', lineHeight: 1.6, fontSize: 14 }}>
                A password reset request will be sent for the following account:
              </p>
              {userInfo && (
                <div style={{
                  background: '#FEF9E1',
                  border: `1px solid ${PRIMARY}`,
                  borderRadius: 8,
                  padding: 16,
                  marginTop: 12
                }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ color: PRIMARY }}>Name:</strong>{' '}
                    <span>{userInfo.first_name} {userInfo.middle_name ? userInfo.middle_name + ' ' : ''}{userInfo.last_name}</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ color: PRIMARY }}>Employee ID:</strong>{' '}
                    <span>{userInfo.employee_id}</span>
                  </div>
                  <div>
                    <strong style={{ color: PRIMARY }}>Email:</strong>{' '}
                    <span>{userInfo.email}</span>
                  </div>
                </div>
              )}
              <p style={{ margin: 0, marginTop: 16, color: '#666', lineHeight: 1.6, fontSize: 14 }}>
                Do you want to proceed?
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                style={{
                  background: '#e5e7eb',
                  color: '#111827',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 8,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  fontFamily: FONT
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRequest}
                disabled={loading}
                style={{
                  background: loading ? '#ccc' : PRIMARY,
                  color: PRIMARY_TEXT,
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 8,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: FONT,
                  transition: 'background 0.2s'
                }}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
