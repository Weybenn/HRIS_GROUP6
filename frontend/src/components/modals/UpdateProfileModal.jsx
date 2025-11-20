import { useMemo, useRef, useState } from 'react';
import { X, ImagePlus, Trash2, Camera, CheckCircle2 } from 'lucide-react';

const FONT = 'Poppins, sans-serif';
const BRAND = '#6D2323';

export default function UpdateProfileModal({ open, onClose, user, onUpdated }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ open: false, type: 'success', message: '' });
  const inputRef = useRef(null);

  const initials = useMemo(() => {
    if (!user) return '';
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase();
  }, [user]);

  if (!open) return null;

  const handlePick = () => inputRef.current?.click();

  const onFileChange = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('user_id', user.id);
      form.append('file', file);
      const res = await fetch('http://localhost:5000/api/profile-picture', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (data.success) {
        try {
          const stored = JSON.parse(localStorage.getItem('user') || 'null');
          if (stored) {
            stored.profile_picture = data.profile_picture;
            localStorage.setItem('user', JSON.stringify(stored));
          }
        } catch (e) {}
        try { window.dispatchEvent(new CustomEvent('profile:updated', { detail: { profile_picture: data.profile_picture } })); } catch (e) {}
        onUpdated?.(data.profile_picture);
        setModal({ open: true, type: 'success', message: 'Profile picture updated successfully.' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/profile-picture/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        try {
          const stored = JSON.parse(localStorage.getItem('user') || 'null');
          if (stored) {
            stored.profile_picture = null;
            localStorage.setItem('user', JSON.stringify(stored));
          }
        } catch (e) {}
        try { window.dispatchEvent(new CustomEvent('profile:updated', { detail: { profile_picture: null } })); } catch (e) {}
        onUpdated?.(null);
        setModal({ open: true, type: 'success', message: 'Profile picture removed successfully.' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)', zIndex: 1000, fontFamily: FONT
    }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 520, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: BRAND, fontSize: 28, fontWeight: 800 }}>Profile Picture</h3>
          <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={26} color={BRAND} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0 24px 0' }}>
          {preview || user?.profile_picture ? (
            <img
              src={preview || (user?.profile_picture?.startsWith('http') ? user.profile_picture : `http://localhost:5000${user.profile_picture}`)}
              alt="Preview"
              style={{ width: 240, height: 240, objectFit: 'cover', borderRadius: '50%', border: `6px solid ${BRAND}` }}
            />
          ) : (
            <div style={{ width: 240, height: 240, borderRadius: '50%', border: `6px solid ${BRAND}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', color: BRAND, fontWeight: 800, fontSize: 72 }}>
              {initials}
            </div>
          )}
        </div>
        {modal.open && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1200
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
                onClick={() => { setModal({ ...modal, open: false }); onClose?.(); }}
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

        <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button onClick={handlePick} disabled={submitting} style={{
            display: 'flex', alignItems: 'center', gap: 10, background: BRAND, color: '#FEF9E1', border: 'none', padding: '12px 22px', borderRadius: 999, cursor: 'pointer', fontWeight: 700
          }}>
            <Camera size={20} /> Change
          </button>
          <button onClick={handleRemove} disabled={submitting} style={{
            display: 'flex', alignItems: 'center', gap: 10, background: '#fff', color: BRAND, border: `2px solid ${BRAND}`, padding: '10px 20px', borderRadius: 999, cursor: 'pointer', fontWeight: 700
          }}>
            <Trash2 size={20} /> Remove
          </button>
          {file && (
            <button onClick={handleUpload} disabled={submitting} style={{
              display: 'flex', alignItems: 'center', gap: 10, background: BRAND, color: '#FEF9E1', border: 'none', padding: '12px 22px', borderRadius: 999, cursor: 'pointer', fontWeight: 700
            }}>
              <ImagePlus size={20} /> Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

