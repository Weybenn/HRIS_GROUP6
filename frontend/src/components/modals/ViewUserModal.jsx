import { useMemo, useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';

const poppins = {
  fontFamily: 'Poppins, sans-serif',
};

const maskEmployeeId = (employeeId, revealed) => {
  if (revealed) return employeeId;
  if (!employeeId) return '';
  const chars = employeeId.split('');
  return chars
    .map((ch, idx) => {
      if (ch === '-') return ch;
      if (idx === 0 || idx === chars.length - 1) return ch;
      return '*';
    })
    .join('');
};

const getInitials = (firstName, lastName) => {
  const f = (firstName || '').trim();
  const l = (lastName || '').trim();
  return `${f.charAt(0) || ''}${l.charAt(0) || ''}`.toUpperCase() || '?';
};

const labelStyle = {
  color: '#7B1212',
  fontWeight: 600,
  fontSize: 14,
  marginBottom: 4,
};

const valueStyle = {
  color: '#2B0C0C',
  fontWeight: 600,
  fontSize: 18,
};

const ViewUserModal = ({ open, onClose, user }) => {
  const [revealEmpId, setRevealEmpId] = useState(false);
  const [showImage, setShowImage] = useState(true);

  useEffect(() => {
    if (!open) {
      setRevealEmpId(false);
    }
  }, [open]);

  const handleClose = () => {
    setRevealEmpId(false);
    setShowImage(true);
    if (onClose) onClose();
  };

  const maskedEmployeeId = useMemo(
    () => maskEmployeeId(user?.employee_id || '', revealEmpId),
    [user?.employee_id, revealEmpId]
  );

  if (!open) return null;

  const resolveImageSrc = (p) => {
    if (!p) return null;
    return p.startsWith('http') ? p : `http://localhost:5000${p}`;
  };
  const imageSrc = resolveImageSrc(user?.profile_picture);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          ...poppins,
          width: 620,
          background: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ height: 0 }} />
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X color="#7B1212" size={28} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 24 }}>
          <div>
            <div style={{ ...labelStyle }}>Employee Number:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ ...valueStyle, letterSpacing: 2 }}>{maskedEmployeeId}</div>
              <button
                onClick={() => setRevealEmpId(v => !v)}
                aria-label={revealEmpId ? 'Hide employee number' : 'Show employee number'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                {revealEmpId ? <Eye color="#7B1212" size={24} /> : <EyeOff color="#7B1212" size={24} />}
              </button>
            </div>

            <div style={{ marginTop: 14, ...labelStyle }}>Email:</div>
            <div style={valueStyle}>{user?.email || '—'}</div>

            <div style={{ marginTop: 14, ...labelStyle }}>Name:</div>
            <div style={valueStyle}>
              {user?.first_name} {user?.middle_name && user?.middle_name !== 'NA' ? user?.middle_name + ' ' : ''}
              {user?.last_name}
            </div>

            {String(user?.position || '').toLowerCase() !== 'admin' && (
              <>
                <div style={{ marginTop: 14, ...labelStyle }}>Department:</div>
                <div style={valueStyle}>{user?.department || '—'}</div>

                <div style={{ marginTop: 14, ...labelStyle }}>Program:</div>
                <div style={valueStyle}>{user?.program || '—'}</div>
              </>
            )}

            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={labelStyle}>Position:</div>
                <div style={valueStyle}>{user?.position ? user.position.charAt(0).toUpperCase() + user.position.slice(1) : '—'}</div>
              </div>
              <div>
                <div style={labelStyle}>Status:</div>
                <div style={valueStyle}>{user?.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : '—'}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
            {imageSrc && showImage ? (
              <img
                src={imageSrc}
                alt="Profile"
                style={{ width: 140, height: 140, borderRadius: 12, objectFit: 'cover', background: '#EFEFEF' }}
                onError={() => setShowImage(false)}
              />
            ) : (
              <div
                aria-label="Initials Avatar"
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 12,
                  background: '#D9D9D9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7B1212',
                  fontWeight: 700,
                  fontSize: 56,
                }}
              >
                {getInitials(user?.first_name, user?.last_name)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal;

