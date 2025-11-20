import { useEffect, useMemo, useState } from 'react';
import { X, Info, CheckCircle2 } from 'lucide-react';

const FONT = 'Poppins, sans-serif';
const PRIMARY = '#6D2323';

const initialForm = {
  id: '',
  email: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  department_id: '',
  program_id: '',
  position: '',
  status: 'active',
};

export default function UpdateUserModal({ open, onClose, user, onUpdated }) {
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isAdmin = useMemo(() => String(form.position || '').toLowerCase() === 'admin', [form.position]);

  useEffect(() => {
    if (!open) return;
    fetch('http://localhost:5000/departments').then(r => r.json()).then(setDepartments).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (user && open) {
      setForm({
        id: user.id,
        email: user.email || '',
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name || '',
        department_id: user.department_id || '',
        program_id: user.program_id || '',
        position: user.position || '',
        status: user.status || 'active',
      });
      setErrors({});
      setFormError('');
    }
  }, [user, open]);

  useEffect(() => {
    if (isAdmin) {
      setPrograms([]);
      setForm(f => ({ ...f, department_id: '', program_id: '' }));
      return;
    }
    if (form.department_id) {
      fetch(`http://localhost:5000/programs?departmentId=${form.department_id}`)
        .then(res => res.json())
        .then(setPrograms)
        .catch(() => setPrograms([]));
    } else {
      setPrograms([]);
      setForm(f => ({ ...f, program_id: '' }));
    }
  }, [form.department_id, isAdmin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'position') {
      const nextPos = String(value || '').toLowerCase();
      if (nextPos === 'admin') {
        setForm(f => ({ ...f, position: value, department_id: '', program_id: '' }));
      } else {
        setForm(f => ({ ...f, position: value }));
      }
      setErrors(errs => ({ ...errs, position: undefined }));
      return;
    }
    setForm(f => ({ ...f, [name]: value }));
    setErrors(errs => ({ ...errs, [name]: undefined }));
    if (formError) setFormError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = true;
    if (!form.first_name) newErrors.first_name = true;
    if (!form.middle_name || form.middle_name.trim() === '' || form.middle_name.trim().toLowerCase() === '') {
      newErrors.middle_name = true;
    } else if (form.middle_name.trim().toLowerCase() !== 'na' && form.middle_name.trim() === '') {
      newErrors.middle_name = true;
    }
    if (!form.last_name) newErrors.last_name = true;
    if (!form.position) newErrors.position = true;
    if (!isAdmin) {
      if (!form.department_id) newErrors.department_id = true;
      if (!form.program_id) newErrors.program_id = true;
    }
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setFormError(isValid ? '' : 'Please fill out all required fields.');
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/update-user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          first_name: form.first_name,
          middle_name: form.middle_name,
          last_name: form.last_name,
          email: form.email,
          position: String(form.position || '').toLowerCase(),
          department_id: isAdmin ? null : form.department_id,
          program_id: isAdmin ? null : form.program_id,
          status: form.status,
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to update user');
      }
      onUpdated && onUpdated();
      setShowSuccessModal(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open && !showSuccessModal) return null;

  const inputStyle = {
    borderRadius: 8,
    border: `2px solid ${PRIMARY}`,
    padding: '12px 16px',
    fontSize: 16,
    fontFamily: FONT,
    background: '#fff',
    color: PRIMARY,
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none'
  };

  if (showSuccessModal) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 25, boxShadow: '0 4px 32px rgba(0,0,0,0.18)', padding: '40px 32px', minWidth: 380, maxWidth: '95vw', fontFamily: FONT, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
            <CheckCircle2 size={48} color="#1DA34A" />
          </div>
          <div style={{ fontSize: 20, color: '#222', marginBottom: 32, textAlign: 'center' }}>
            Account has been successfully updated.
          </div>
          <button
            onClick={() => { setShowSuccessModal(false); onClose(); }}
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 15, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', padding: 32, width: '95vw', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', position: 'relative', fontFamily: FONT }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY }}><X size={22} /></button>
        <h2 style={{ color: PRIMARY, fontWeight: 600, fontSize: 28, margin: 0 }}>Update Account</h2>
        <hr style={{ border: 'none', height: 2, backgroundColor: PRIMARY, margin: '16px 0 24px 0' }} />
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" style={{ ...inputStyle, borderColor: errors.email ? '#dc2626' : PRIMARY, flex: 1 }} />
        <select name="position" value={form.position} onChange={handleChange} style={{ ...inputStyle, borderColor: errors.position ? '#dc2626' : PRIMARY, paddingRight: 40, appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236D2323\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\' %3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px', flex: 1 }}>
              <option value="" disabled>Position</option>
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First Name" style={{ ...inputStyle, borderColor: errors.first_name ? '#dc2626' : PRIMARY, flex: 1 }} />
            <input name="middle_name" value={form.middle_name} onChange={handleChange} placeholder="Middle Name" style={{ ...inputStyle, borderColor: errors.middle_name ? '#dc2626' : PRIMARY, flex: 1 }} />
          </div>
          <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last Name" style={{ ...inputStyle, borderColor: errors.last_name ? '#dc2626' : PRIMARY }} />

          {!isAdmin && (
            <>
              <select name="department_id" value={form.department_id} onChange={handleChange} style={{ ...inputStyle, borderColor: errors.department_id ? '#dc2626' : PRIMARY, paddingRight: 40, appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236D2323\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}>
                <option value="" disabled>Department</option>
                {departments.map(dep => (
                  <option key={dep.id} value={dep.id}>{dep.department}</option>
                ))}
              </select>
              <select name="program_id" value={form.program_id} onChange={handleChange} disabled={!form.department_id} style={{ ...inputStyle, borderColor: errors.program_id ? '#dc2626' : PRIMARY, paddingRight: 40, appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236D2323\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}>
                <option value="" disabled>Program</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.program}</option>
                ))}
              </select>
            </>
          )}

          <div style={{ display: 'flex', gap: 16 }}>
            <select name="status" value={form.status} onChange={handleChange} style={{ ...inputStyle, borderColor: PRIMARY, paddingRight: 40, appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236D2323\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\' %3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px', flex: 1 }}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {formError && (
            <div style={{
              color: '#dc3545',
              fontSize: 14,
              marginTop: 4,
              padding: '8px 12px',
              background: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: 4,
              fontFamily: FONT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>{formError}</span>
              <Info size={16} color="#dc3545" />
            </div>
          )}
          <div>
            <button type="submit" disabled={loading} style={{ backgroundColor: loading ? '#ccc' : PRIMARY, color: '#fff', border: 'none', borderRadius: 8, padding: '16px 48px', fontSize: 18, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', width: '100%' }}>
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

