import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

const FONT = 'Poppins, sans-serif';

export default function OTPModal({ open, onClose, email, onVerify, resending, onResend }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  if (!open) return null;

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().slice(0, 6);
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setError('');
      document.getElementById('otp-5')?.focus();
    }
  };

  const handleSubmit = async () => {
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setError('Please enter a complete 6-digit OTP code');
      return;
    }

    if (!/^\d{6}$/.test(otpValue)) {
      setError('OTP must contain only digits');
      return;
    }

    try {
      setVerifying(true);
      setError('');
      await onVerify(otpValue);
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      fontFamily: FONT,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '32px 36px',
        maxWidth: 440,
        width: '90%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        fontFamily: FONT,
      }}>
        <h2 style={{
          color: '#6D2323',
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 12,
          textAlign: 'center',
        }}>
          Two-Factor Authentication
        </h2>
        
        <p style={{
          color: '#666',
          fontSize: 14,
          textAlign: 'center',
          marginBottom: 24,
          lineHeight: 1.6,
        }}>
          Enter the 6-digit code sent to<br />
          <strong style={{ color: '#6D2323' }}>{email}</strong>
        </p>

        <div style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              autoFocus={index === 0}
              style={{
                width: 48,
                height: 56,
                border: error ? '2px solid #dc3545' : '2px solid #ddd',
                borderRadius: 8,
                fontSize: 24,
                fontWeight: 600,
                textAlign: 'center',
                fontFamily: FONT,
                outline: 'none',
                transition: 'all 0.2s',
                color: '#6D2323',
              }}
              onFocus={(e) => e.target.select()}
              disabled={verifying}
            />
          ))}
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#dc3545',
            fontSize: 13,
            marginBottom: 16,
            padding: '8px 12px',
            background: '#ffe6e6',
            borderRadius: 8,
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={verifying || otp.join('').length !== 6}
          style={{
            width: '100%',
            background: verifying || otp.join('').length !== 6 ? '#ccc' : '#6D2323',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '14px 16px',
            fontSize: 16,
            fontWeight: 700,
            cursor: verifying || otp.join('').length !== 6 ? 'not-allowed' : 'pointer',
            marginBottom: 16,
            transition: 'all 0.2s',
            fontFamily: FONT,
          }}
        >
          {verifying ? 'Verifying...' : 'Verify Code'}
        </button>

        <button
          onClick={onResend}
          disabled={resending || verifying}
          style={{
            width: '100%',
            background: 'transparent',
            color: '#6D2323',
            border: '2px solid #6D2323',
            borderRadius: 12,
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
            cursor: resending || verifying ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontFamily: FONT,
            opacity: resending || verifying ? 0.5 : 1,
          }}
        >
          {resending ? 'Sending...' : "Didn't receive code? Resend"}
        </button>

        <button
          onClick={handleClose}
          disabled={verifying}
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#999',
            fontSize: 28,
            fontWeight: 'bold',
            lineHeight: 1,
            padding: 0,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
