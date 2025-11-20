import { useState } from 'react';
import { Eye, EyeClosed, Info, CheckCircle2 } from 'lucide-react';

const FONT = 'Poppins, sans-serif';
const PRIMARY_COLOR = '#6D2323';
const PRIMARY_TEXT = '#FEF9E1';

export default function ChangePasswordModal({ open, onClose, user }) {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, type: 'success', message: '' });

  if (!open) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          old_password: formData.oldPassword,
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswords({ oldPassword: false, newPassword: false, confirmPassword: false });
      setModal({ open: true, type: 'success', message: 'Password changed successfully.' });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswords({ oldPassword: false, newPassword: false, confirmPassword: false });
    setError('');
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
    }
  };

  const renderPasswordField = (field, label, placeholder) => (
    <div style={{ marginBottom: 24 }}>
      <label style={{
        display: 'block',
        fontSize: 16,
        fontWeight: 600,
        color: PRIMARY_COLOR,
        marginBottom: 8,
        fontFamily: FONT
      }}>
        {label}:
      </label>
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type={showPasswords[field] ? 'text' : 'password'}
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '14px 50px 14px 16px',
            border: `2px solid ${PRIMARY_COLOR}`,
            borderRadius: 8,
            fontSize: 16,
            fontFamily: FONT,
            outline: 'none',
            boxSizing: 'border-box',
            color: PRIMARY_COLOR,
            background: '#fff'
          }}
          autoComplete={field === 'oldPassword' ? 'current-password' : 'new-password'}
        />
        {formData[field] && (
          <span
            onClick={() => togglePasswordVisibility(field)}
            style={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              color: PRIMARY_COLOR,
              display: 'flex',
              alignItems: 'center',
              zIndex: 2
            }}
            tabIndex={0}
            aria-label={showPasswords[field] ? 'Hide password' : 'Show password'}
          >
            {showPasswords[field] ? <Eye size={20} /> : <EyeClosed size={20} />}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        fontFamily: FONT
      }}
      onClick={handleOverlayClick}
    >
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 32px rgba(0, 0, 0, 0.2)',
        padding: '32px 40px',
        minWidth: 400,
        maxWidth: 500,
        width: '90%',
        fontFamily: FONT
      }}>
        <h2 style={{
          color: PRIMARY_COLOR,
          fontSize: 24,
          fontWeight: 700,
          margin: '0 0 32px 0',
          textAlign: 'center',
          fontFamily: FONT
        }}>
          Change Password
        </h2>

        <form onSubmit={handleSubmit}>
          {renderPasswordField('oldPassword', 'Old Password', 'Enter your current password')}
          {renderPasswordField('newPassword', 'New Password', 'Enter your new password')}
          {renderPasswordField('confirmPassword', 'Confirm Password', 'Confirm your new password')}

          {error && (
            <div style={{
              color: '#dc3545',
              fontSize: 14,
              marginBottom: 16,
              padding: '8px 12px',
              background: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: 4,
              fontFamily: FONT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>{error}</span>
              <Info size={16} color="#dc3545" />
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            marginTop: 24
          }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 24px',
                border: `2px solid ${PRIMARY_COLOR}`,
                borderRadius: 8,
                background: PRIMARY_COLOR,
                color: PRIMARY_TEXT,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: FONT,
                opacity: loading ? 0.6 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 24px',
                border: `2px solid ${PRIMARY_COLOR}`,
                borderRadius: 8,
                background: PRIMARY_COLOR,
                color: PRIMARY_TEXT,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: FONT,
                opacity: loading ? 0.6 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
        {modal.open && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 25,
                boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
                padding: '40px 32px',
                minWidth: 380,
                maxWidth: '95vw',
                fontFamily: FONT,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
                <CheckCircle2 size={48} color="#1DA34A" />
              </div>
              <div style={{ fontSize: 20, color: '#222', marginBottom: 32, textAlign: 'center' }}>
                {modal.message}
              </div>
              <button
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
                onClick={() => {
                  setModal({ ...modal, open: false });
                  onClose?.();
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
