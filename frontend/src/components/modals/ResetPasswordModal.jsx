import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const FONT = 'Poppins, sans-serif';
const PRIMARY = '#6D2323';

export default function ResetPasswordModal({ open, onClose, user, onReset }) {
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  if (!open || !user) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to reset password');
      }
      setShowSuccessModal(true); 
    } catch (e) {
      alert(e.message);
      onClose(); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!showSuccessModal ? (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 15, padding: 24, width: 420, maxWidth: '95vw', position: 'relative', fontFamily: FONT }}>
            <div style={{ color: PRIMARY, fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Reset Password</div>
            <div style={{ fontSize: 14, color: '#374151', marginBottom: 16 }}>
              Are you sure you want to reset the password for <b>{user.first_name} {user.last_name}</b> to the default password?
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={onClose} disabled={loading} style={{ background: '#e5e7eb', color: '#111827', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>Cancel</button>
              <button onClick={handleConfirm} disabled={loading} style={{ background: loading ? '#ccc' : PRIMARY, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>Confirm</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 25, boxShadow: '0 4px 32px rgba(0,0,0,0.18)', padding: '40px 32px', minWidth: 380, maxWidth: '95vw', fontFamily: FONT, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
              <CheckCircle2 size={48} color="#1DA34A" />
            </div>
            <div style={{ fontSize: 20, color: '#222', marginBottom: 32, textAlign: 'center' }}>
              Password has been successfully reset.
            </div>
            <button
              onClick={() => { setShowSuccessModal(false); onReset && onReset(); onClose(); }}
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
      )}
    </>
  );
}

