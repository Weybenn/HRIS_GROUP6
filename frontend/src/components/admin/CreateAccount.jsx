import { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import AccountRegistered from '../modals/AccountRegistered';

const MODAL_BG = 'rgba(0,0,0,0.25)';
const CARD_BG = '#fff';
const PRIMARY = '#6D2323';
const BORDER_RADIUS = 15;
const FONT = 'Poppins, sans-serif';

const initialForm = {
  employee_id: '',
  email: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  department_id: '',
  program_id: '',
  position: '',
};

export default function CreateAccount({ open, onClose, onSuccess }) {
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [formError, setFormError] = useState('');
  const isAdmin = form.position === 'admin';

  useEffect(() => {
    if (!open) return;
    fetch('http://localhost:5000/departments')
      .then(res => res.json())
      .then(setDepartments);
    fetch('http://localhost:5000/next-employee-id')
      .then(res => res.json())
      .then(data => setForm(() => ({ ...initialForm, employee_id: data.employee_id })));
  }, [open]);

  useEffect(() => {
    if (form.department_id) {
      fetch(`http://localhost:5000/programs?departmentId=${form.department_id}`)
        .then(res => res.json())
        .then(setPrograms);
    } else {
      setPrograms([]);
      setForm(f => ({ ...f, program_id: '' }));
    }
  }, [form.department_id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(e => ({ ...e, [name]: undefined }));
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
    if (!isValid) {
      setFormError('Please fill out all required fields.');
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) element.focus();
    } else {
      setFormError('');
    }
    return isValid;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name,
          middle_name: form.middle_name,
          last_name: form.last_name,
          email: form.email,
          department_id: isAdmin ? null : form.department_id,
          program_id: isAdmin ? null : form.program_id,
          position: form.position,
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowSuccess(true);
        fetch('http://localhost:5000/next-employee-id')
          .then(res => res.json())
          .then(data => setForm({ ...initialForm, employee_id: data.employee_id }));
        setErrors({});
        setFormError('');
      } else {
        setFormError(data.error || 'Failed to register account.');
      }
    } catch (err) {
      setFormError('Server error.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setErrors({});
    setFormError('');
    onClose && onClose();
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setForm(initialForm);
    setErrors({});
    setFormError('');
    onSuccess && onSuccess();
  };

  if (!open) return null;

  const renderInput = (props, errorKey, placeholder) => (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        {...props}
        style={{
          ...inputStyle,
          borderColor: errors[errorKey] ? '#dc2626' : (focusedField === props.name ? '#8A1A1A' : '#6D2323'),
          boxShadow: 'none',
          paddingRight: 24,
          backgroundColor: errors[errorKey] ? '#fff5f5' : '#fff'
        }}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setFocusedField(props.name)}
        onBlur={() => setFocusedField(null)}
      />
      {errors[errorKey] && (
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
  );

  const renderSelect = (props, options, errorKey) => (
    <div style={{ position: 'relative', width: '100%' }}>
      <select
        {...props}
        style={{
          ...inputStyle,
          borderColor: errors[errorKey] ? '#dc2626' : (focusedField === props.name ? '#8A1A1A' : '#6D2323'),
          boxShadow: 'none',
          paddingRight: 40,
          appearance: 'none',
          MozAppearance: 'none',
          WebkitAppearance: 'none',
          color: '#6D2323',
          cursor: 'pointer',
          backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236D2323\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          backgroundSize: '16px',
          backgroundColor: errors[errorKey] ? '#fff5f5' : '#fff'
        }}
        onFocus={() => setFocusedField(props.name)}
        onBlur={() => setFocusedField(null)}
      >
        {options}
      </select>
      {errors[errorKey] && (
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
  );

  return (
    <>
      <div style={{
        position: 'fixed',
        zIndex: 1000,
        top: 0, left: 0, right: 0, bottom: 0,
        background: MODAL_BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          background: CARD_BG,
          borderRadius: BORDER_RADIUS,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          padding: '32px',
          minWidth: 480,
          maxWidth: 720,
          width: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          fontFamily: FONT,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}>
          <button
            onClick={handleCancel}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: PRIMARY
            }}
          >
            <X size={22} />
          </button>

          <h2 style={{ color: PRIMARY, fontWeight: 600, fontSize: 28, margin: 0, textAlign: 'left' }}>Create Account</h2>
          <hr style={{ border: 'none', height: 2, backgroundColor: PRIMARY, margin: '16px 0 24px 0', flex: 'none' }} />
          <form style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }} onSubmit={handleSubmit} autoComplete="off">
            <div style={{ display: 'flex', gap: 16 }}>
              {renderInput({
                name: 'employee_id',
                value: form.employee_id,
                disabled: true,
              }, null, 'Employee ID')}
              {renderInput({
                name: 'email',
                value: form.email,
                onChange: handleChange,
              }, 'email', 'Email')}
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {renderInput({
                name: 'first_name',
                value: form.first_name,
                onChange: handleChange,
              }, 'first_name', 'First Name')}
              {renderInput({
                name: 'middle_name',
                value: form.middle_name,
                onChange: handleChange,
              }, 'middle_name', 'Middle Name')}
            </div>
            {renderInput({
              name: 'last_name',
              value: form.last_name,
              onChange: handleChange,
            }, 'last_name', 'Last Name')}
            {renderSelect({
              name: 'position',
              value: form.position,
              onChange: handleChange,
            }, [<option value="" key="" disabled>Position</option>, <option value="admin" key="admin">Admin</option>, <option value="employee" key="employee">Employee</option>], 'position')}
            {!isAdmin && renderSelect({
              name: 'department_id',
              value: form.department_id,
              onChange: handleChange,
            }, [<option value="" key="" disabled>Department</option>, ...departments.map(dep => (
              <option key={dep.id} value={dep.id}>{dep.department}</option>
            ))], 'department_id')}
            {!isAdmin && renderSelect({
              name: 'program_id',
              value: form.program_id,
              onChange: handleChange,
              disabled: !form.department_id,
            }, [<option value="" key="" disabled>Program</option>, ...programs.map(prog => (
              <option key={prog.id} value={prog.id}>{prog.program}</option>
            ))], 'program_id')}
            <div style={{ fontSize: 14, color: '#222', margin: '8px 0 0 0', fontFamily: FONT }}>
              Please enter "NA" in the middle name field if you don't have one.
            </div>
          {formError && (
            <div style={{
              color: '#dc3545',
              fontSize: 14,
              marginTop: 12,
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
            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#ccc' : PRIMARY,
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '16px 48px',
                  fontSize: 18,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: FONT,
                  transition: 'background-color 0.2s',
                  width: '100%',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = '#8A1A1A';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = PRIMARY;
                  }
                }}
              >
                {loading ? 'Submitting...' : 'Done'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <AccountRegistered open={showSuccess} onClose={handleSuccessClose} />
    </>
  );
}

const inputStyle = {
  borderRadius: 8,
  border: '2px solid #6D2323',
  padding: '12px 16px',
  fontSize: 16,
  fontFamily: FONT,
  marginBottom: 0,
  outline: 'none',
  background: '#fff',
  color: '#6D2323',
  width: '100%',
  boxSizing: 'border-box',
};



