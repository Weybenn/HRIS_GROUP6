import { useState } from 'react';
import RegistrationRegisteredModal from './RegistrationRegisteredModal';

const FONT = 'Poppins, sans-serif';

export default function RegisterModal({ open, onClose, defaultEmail, userId, trainingId, onSuccess }) {
  const [email, setEmail] = useState(defaultEmail || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resultOpen, setResultOpen] = useState(false);
  const [resultSuccess, setResultSuccess] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!open) return null;

  const handleRegisterClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setConfirmOpen(false);
    try {
      setSubmitting(true);
      setError('');
      if (!userId || !trainingId) {
        throw new Error('Missing user or training information');
      }
      const res = await fetch('http://localhost:5000/api/training/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, training_id: trainingId })
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        setResultSuccess(false);
        setResultMessage(data?.error || 'Registration failed');
        setResultOpen(true);
        return;
      }
      setResultSuccess(true);
      setResultMessage('The registration was successfully submitted.');
      setResultOpen(true);
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (e) {
      const msg = e.message || 'Something went wrong';
      setError(msg);
      setResultSuccess(false);
      setResultMessage(msg);
      setResultOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelConfirm = () => {
    setConfirmOpen(false);
  };

  const handleDone = () => {
    setResultOpen(false);
    onClose();
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 420, boxShadow: '0 10px 30px #0003', fontFamily: FONT, position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#6D2323', fontSize: 14, fontWeight: 'bold' }}>✕</button>
          <div style={{ height: 10 }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={!!defaultEmail}
              style={{
                width: '100%',
                border: '2px solid #6D2323',
                borderRadius: 12,
                padding: '14px 16px',
                fontFamily: FONT,
                fontSize: 16,
                marginBottom: 10,
                backgroundColor: defaultEmail ? '#f3f3f3' : '#fff',
                cursor: defaultEmail ? 'not-allowed' : 'text'
              }}
            />
          {error && (
            <div style={{ color: '#c00', fontSize: 13, marginBottom: 10 }}>{error}</div>
          )}
          <button
            onClick={handleRegisterClick}
            disabled={submitting}
            style={{ width: '100%', background: '#6D2323', color: '#fff', border: 'none', borderRadius: 20, padding: '12px 16px', fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Submitting...' : 'Register'}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 380, boxShadow: '0 10px 40px #0004', fontFamily: FONT }}>
            <h3 style={{ color: '#6D2323', fontSize: 20, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>
              Confirm Registration
            </h3>
            <p style={{ color: '#333', fontSize: 15, marginBottom: 24, textAlign: 'center', lineHeight: 1.5 }}>
              Are you sure you want to register for this training program? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleCancelConfirm}
                style={{ 
                  flex: 1, 
                  background: '#f0f0f0', 
                  color: '#333', 
                  border: '2px solid #ddd', 
                  borderRadius: 12, 
                  padding: '12px 16px', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontFamily: FONT
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                style={{ 
                  flex: 1, 
                  background: '#6D2323', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 12, 
                  padding: '12px 16px', 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  fontFamily: FONT
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <RegistrationRegisteredModal open={resultOpen} onClose={handleDone} success={resultSuccess} message={resultMessage} />
    </>
  );
}

