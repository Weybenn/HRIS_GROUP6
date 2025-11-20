import { useState, useEffect, useRef } from 'react';
import { X, Image, Info, Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon } from 'lucide-react';

const AddTrainingModal = ({ isOpen, onClose, initialData = null, onSuccess = null }) => {
  const [formData, setFormData] = useState({
    programName: '',
    time: '',
    mode: '',
    description: '',
    date: '',
    venue: '',
    instructor: '',
    maxParticipants: 0,
    addRegisterLink: false,
    departmentId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', message: '' });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [topToast, setTopToast] = useState({ type: '', message: '' });
  const [departments, setDepartments] = useState([]);
  const descriptionEditorRef = useRef(null);
  const [toolbarState, setToolbarState] = useState({ bold: false, italic: false, underline: false, ul: false, ol: false });

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:5000/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const updateToolbarState = () => {
    if (!descriptionEditorRef.current) return;
    const selection = document.getSelection();
    const anchorNode = selection && selection.anchorNode;
    const within = !!(anchorNode && descriptionEditorRef.current.contains(anchorNode));
    if (!within) {
      setToolbarState({ bold: false, italic: false, underline: false, ul: false, ol: false });
      return;
    }
    const next = { bold: false, italic: false, underline: false, ul: false, ol: false };
    try {
      next.bold = document.queryCommandState('bold');
      next.italic = document.queryCommandState('italic');
      next.underline = document.queryCommandState('underline');
      next.ul = document.queryCommandState('insertUnorderedList');
      next.ol = document.queryCommandState('insertOrderedList');
    } catch (_) {}
    setToolbarState(next);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        programName: initialData.program_name || '',
        time: initialData.time || '',
        mode: initialData.mode || '',
        description: initialData.description || '',
          date: (function(d) {
            if (!d) return '';
            if (typeof d === 'string') {
              const datePart = d.split('T')[0];
              if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
            }
            const parsed = new Date(d);
            if (Number.isNaN(parsed.getTime())) return '';
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const day = String(parsed.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          })(initialData.date),
        venue: initialData.venue || '',
        instructor: initialData.instructor || '',
        maxParticipants: initialData.max_participants || 0,
        addRegisterLink: Number(initialData.register_link) === 1,
        departmentId: (initialData.department_id === null || initialData.department_id === undefined) ? 'ALL' : String(initialData.department_id)
      });
      setUploadedFile(null);
      setRemoveExistingPhoto(false);
      if (initialData.upload_photo) {
        const path = initialData.upload_photo.startsWith('http') ? initialData.upload_photo : `http://localhost:5000/uploads/${initialData.upload_photo}`;
        setExistingPhotoUrl(path);
      } else {
        setExistingPhotoUrl(null);
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen || !descriptionEditorRef.current) return;
    const initialHtml = (initialData && initialData.description) || '';
    descriptionEditorRef.current.innerHTML = initialHtml;
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = () => updateToolbarState();
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setSubmitMessage({ type: 'error', message: 'Please upload a valid image file (JPEG, PNG, or GIF)' });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setSubmitMessage({ type: 'error', message: 'File size must be less than 5MB' });
        return;
      }
      
      setUploadedFile(file);
      setSubmitMessage({ type: '', message: '' });
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    const fileInput = document.getElementById('photo-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage({ type: '', message: '' });

    try {
      const textOnly = (formData.description || '').replace(/<[^>]*>/g, '').trim();
      if (!textOnly) {
        setSubmitMessage({ type: 'error', message: 'Description is required' });
        setIsSubmitting(false);
        return;
      }
    } catch (_) {
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('User not logged in');
      }
      const isEditing = initialData && initialData.id;

      const form = new FormData();
      form.append('employee_id', user.employee_id);
      form.append('program_name', formData.programName);
      form.append('date', formData.date);
      form.append('time', formData.time);
      form.append('venue', formData.venue || '');
      form.append('mode', formData.mode);
      form.append('instructor', formData.instructor || '');
      form.append('description', formData.description || '');
      form.append('max_participants', String(formData.maxParticipants || ''));
      form.append('register_link', formData.addRegisterLink ? '1' : '0');
      form.append('department_id', (formData.departmentId === 'ALL') ? '' : (formData.departmentId || ''));
      if (uploadedFile) {
        form.append('photo', uploadedFile);
      }
      if (isEditing && removeExistingPhoto) {
        form.append('remove_photo', '1');
      }

      const url = isEditing ? `http://localhost:5000/training-programs/${initialData.id}` : 'http://localhost:5000/add-training-program';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: form,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add training program');
      }

      handleClose();
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess({ type: 'success', message: isEditing ? 'Training program updated successfully.' : 'Training program posted successfully.' });
      }
      try {
        const trainingId = result && result.training_id ? result.training_id : (initialData && initialData.id ? initialData.id : null);
        window.dispatchEvent(new CustomEvent('training:updated', { detail: { id: trainingId, register_link: formData.addRegisterLink ? 1 : 0, type: 'success', message: isEditing ? 'Training program updated successfully.' : 'Training program posted successfully.' } }));
      } catch (e) {
      }

    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitMessage({ type: 'error', message: error.message || 'Failed to add training program' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const focusDescriptionEditor = () => {
    if (descriptionEditorRef.current) {
      descriptionEditorRef.current.focus();
    }
  };

  const updateDescriptionFromDom = () => {
    if (!descriptionEditorRef.current) return;
    const html = descriptionEditorRef.current.innerHTML;
    setFormData(prev => ({ ...prev, description: html }));
    updateToolbarState();
  };

  const applyEditorCommand = (command) => {
    focusDescriptionEditor();
    try {
      document.execCommand(command, false, null);
    } catch (_) {}
    setTimeout(updateDescriptionFromDom, 0);
  };

  const insertEditorLink = () => {
    focusDescriptionEditor();
    const selection = document.getSelection();
    const currentSelectionText = selection ? selection.toString() : '';
    const displayTextPrompt = window.prompt('Text to display', currentSelectionText || '');
    if (displayTextPrompt === null) return;
    const linkToPrompt = window.prompt('Link to (URL)', 'https://');
    if (!linkToPrompt) return;
    const normalizedUrl = /^(https?:)?\/\//i.test(linkToPrompt.trim()) ? linkToPrompt.trim() : `https://${linkToPrompt.trim()}`;
    const safeText = (displayTextPrompt || currentSelectionText || normalizedUrl)
      .replace(/[<&>]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
    try {
      document.execCommand(
        'insertHTML',
        false,
        `<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer">${safeText}</a>`
      );
    } catch (_) {}
    setTimeout(updateDescriptionFromDom, 0);
  };

  const handleClose = () => {
    setFormData({
      programName: '',
      time: '',
      mode: '',
      description: '',
      date: '',
      venue: '',
      instructor: '',
      maxParticipants: 0,
      addRegisterLink: false,
      departmentId: ''
    });
    setSubmitMessage({ type: '', message: '' });
    setIsSubmitting(false);
    setUploadedFile(null);
    const fileInput = document.getElementById('photo-upload');
    if (fileInput) {
      fileInput.value = '';
    }
    if (descriptionEditorRef.current) {
      descriptionEditorRef.current.innerHTML = '';
    }
    onClose();
  };

  if (!isOpen) return null;

    return (
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
        fontFamily: 'Poppins, sans-serif',
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
        {/* Top Toast */}
        {topToast.message && (
          <div style={{
            position: 'fixed',
            top: 12,
            left: 16,
            right: 16,
            margin: '0 auto',
            maxWidth: 900,
            backgroundColor: topToast.type === 'success' ? '#1DA34A' : '#6D2323',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 10,
            boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
            zIndex: 1200,
            fontFamily: 'Poppins, sans-serif',
            fontSize: 14,
            fontWeight: 500,
            textAlign: 'center',
            positionAnchor: 'initial'
          }}>
            <span>{topToast.message}</span>
            <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.9 }}>
              <Info size={18} />
            </span>
          </div>
        )}
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6D2323'
          }}
        >
          <X size={24} />
        </button>

        {/* Title */}
        <h2 style={{
          color: '#6D2323',
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '16px',
          textAlign: 'left',
          fontFamily: 'Poppins, sans-serif'
        }}>
          {initialData && initialData.id ? 'Update Training Program' : 'Add Training Program'}
        </h2>
        
        {/* Horizontal Line */}
        <hr style={{
          border: 'none',
          height: '2px',
          backgroundColor: '#6D2323',
          marginBottom: '32px'
        }} />

        {/* Success/Error Message */}
        {submitMessage.message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            backgroundColor: submitMessage.type === 'success' ? '#d4edda' : '#f8d7da',
            color: submitMessage.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${submitMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
            fontFamily: 'Poppins, sans-serif',
            fontSize: '14px'
          }}>
            {submitMessage.message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Department Dropdown - Full Width */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#6D2323',
              fontSize: '16px',
              fontWeight: '500',
              marginBottom: '8px',
              fontFamily: 'Poppins, sans-serif'
            }}>
              Department:
            </label>
            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                paddingRight: '40px',
                border: '2px solid #6D2323',
                borderRadius: '8px',
                fontSize: '16px',
                fontFamily: 'Poppins, sans-serif',
                backgroundColor: 'white',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236D2323\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '16px'
              }}
              required
            >
              <option value="">Select Department</option>
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.department}
                </option>
              ))}
            </select>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Left Column */}
            <div>
              {/* Program Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#6D2323',
                  fontSize: '16px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  Program Name:
                </label>
                <input
                  type="text"
                  name="programName"
                  value={formData.programName}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #6D2323',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontFamily: 'Poppins, sans-serif',
                    backgroundColor: 'white'
                  }}
                  required
                />
              </div>

              {/* Time */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#6D2323',
                  fontSize: '16px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  Time:
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #6D2323',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontFamily: 'Poppins, sans-serif',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    color: '#333'
                  }}
                  required
                />
              </div>

              {/* Mode */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#6D2323',
                  fontSize: '16px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  Mode:
                </label>
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    paddingRight: '40px',
                    border: '2px solid #6D2323',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontFamily: 'Poppins, sans-serif',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236D2323\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                  required
                >
                    <option value="">Select Mode</option>
                    <option value="Face-to-Face">Face-to-Face</option>
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div>
              {/* Date */}
               <div style={{ marginBottom: '20px' }}>
                 <label style={{
                   display: 'block',
                   color: '#6D2323',
                   fontSize: '16px',
                   fontWeight: '500',
                   marginBottom: '8px',
                   fontFamily: 'Poppins, sans-serif'
                 }}>
                   Date:
                 </label>
                 <input
                   type="date"
                   name="date"
                   value={formData.date}
                   onChange={handleInputChange}
                   style={{
                     width: '100%',
                     padding: '12px 16px',
                     border: '2px solid #6D2323',
                     borderRadius: '8px',
                     fontSize: '16px',
                     fontFamily: 'Poppins, sans-serif',
                     backgroundColor: 'white'
                   }}
                   required
                 />
               </div>

              {/* Venue */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#6D2323',
                  fontSize: '16px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  Venue:
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #6D2323',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontFamily: 'Poppins, sans-serif',
                    backgroundColor: 'white'
                  }}
                  required
                />
              </div>

              {/* Instructor */}
               <div style={{ marginBottom: '20px' }}>
                 <label style={{
                   display: 'block',
                   color: '#6D2323',
                   fontSize: '16px',
                   fontWeight: '500',
                   marginBottom: '8px',
                   fontFamily: 'Poppins, sans-serif'
                 }}>
                   Instructor:
                 </label>
                 <input
                   type="text"
                   name="instructor"
                   value={formData.instructor}
                   onChange={handleInputChange}
                   style={{
                     width: '100%',
                     padding: '12px 16px',
                     border: '2px solid #6D2323',
                     borderRadius: '8px',
                     fontSize: '16px',
                     fontFamily: 'Poppins, sans-serif',
                     backgroundColor: 'white'
                   }}
                   required
                 />
               </div>
             </div>
           </div>

          {/* Description - Full Width with Rich Text */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#6D2323',
              fontSize: '16px',
              fontWeight: '500',
              marginBottom: '8px',
              fontFamily: 'Poppins, sans-serif'
            }}>
              Description:
            </label>

            {/* Editor container with toolbar inside and divider */}
            <style>{`
              .rich-editor ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
              .rich-editor ol { list-style: decimal; padding-left: 1.25rem; margin: 0.5rem 0; }
              .rich-editor li { margin: 0.25rem 0; }
              .rich-editor a { color: #1d4ed8; text-decoration: underline; }
            `}</style>
            <div style={{
              border: '2px solid #6D2323',
              borderRadius: '8px',
              background: '#fff',
              overflow: 'hidden'
            }}>
              <div
                ref={descriptionEditorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={updateDescriptionFromDom}
                dir="ltr"
                className="rich-editor"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  fontSize: '16px',
                  fontFamily: 'Poppins, sans-serif',
                  backgroundColor: 'white',
                  minHeight: 120,
                  outline: 'none',
                  cursor: 'text',
                  textAlign: 'left',
                  direction: 'ltr',
                  unicodeBidi: 'isolate',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              />
              <div style={{
                display: 'flex',
                gap: 8,
                padding: 8,
                borderTop: '1px solid #e5e7eb',
                background: '#fafafa'
              }}>
                <button type="button" aria-label="Bold" aria-pressed={toolbarState.bold} onClick={() => applyEditorCommand('bold')} style={{ padding: '6px 10px', border: 'none', borderRadius: 6, background: toolbarState.bold ? 'rgba(109,35,35,0.12)' : 'transparent', color: '#6D2323', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bold size={16} />
                </button>
                <button type="button" aria-label="Italic" aria-pressed={toolbarState.italic} onClick={() => applyEditorCommand('italic')} style={{ padding: '6px 10px', border: 'none', borderRadius: 6, background: toolbarState.italic ? 'rgba(109,35,35,0.12)' : 'transparent', color: '#6D2323', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Italic size={16} />
                </button>
                <button type="button" aria-label="Underline" aria-pressed={toolbarState.underline} onClick={() => applyEditorCommand('underline')} style={{ padding: '6px 10px', border: 'none', borderRadius: 6, background: toolbarState.underline ? 'rgba(109,35,35,0.12)' : 'transparent', color: '#6D2323', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Underline size={16} />
                </button>
                <button type="button" aria-label="Bulleted list" aria-pressed={toolbarState.ul} onClick={() => applyEditorCommand('insertUnorderedList')} style={{ padding: '6px 10px', border: 'none', borderRadius: 6, background: toolbarState.ul ? 'rgba(109,35,35,0.12)' : 'transparent', color: '#6D2323', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <List size={16} />
                </button>
                <button type="button" aria-label="Numbered list" aria-pressed={toolbarState.ol} onClick={() => applyEditorCommand('insertOrderedList')} style={{ padding: '6px 10px', border: 'none', borderRadius: 6, background: toolbarState.ol ? 'rgba(109,35,35,0.12)' : 'transparent', color: '#6D2323', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ListOrdered size={16} />
                </button>
                <button type="button" aria-label="Insert link" onClick={insertEditorLink} style={{ padding: '6px 10px', border: 'none', borderRadius: 6, background: 'transparent', color: '#6D2323', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LinkIcon size={16} />
                </button>
              </div>
            </div>
          </div>

            {/* Upload Photo Section */}
           <div style={{ marginBottom: '24px' }}>
             <label style={{
               display: 'block',
               color: '#6D2323',
               fontSize: '16px',
               fontWeight: '500',
               marginBottom: '8px',
               fontFamily: 'Poppins, sans-serif'
             }}>
               Upload Photo:
             </label>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <input
                 type="file"
                 id="photo-upload"
                 accept="image/*"
                 onChange={handleFileUpload}
                 style={{ display: 'none' }}
               />
               <button
                 type="button"
                 onClick={() => document.getElementById('photo-upload').click()}
                 style={{
                   backgroundColor: '#6D2323',
                   color: 'white',
                   border: 'none',
                   borderRadius: '8px',
                   padding: '12px 20px',
                   fontSize: '16px',
                   fontWeight: '500',
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   gap: '8px',
                   fontFamily: 'Poppins, sans-serif',
                   transition: 'background-color 0.2s'
                 }}
                 onMouseEnter={(e) => e.target.style.backgroundColor = '#8A1A1A'}
                 onMouseLeave={(e) => e.target.style.backgroundColor = '#6D2323'}
               >
                 <Image size={20} />
                 Upload Photo
               </button>
               
               {(uploadedFile || existingPhotoUrl) && (
                 <div style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '8px',
                   backgroundColor: '#f8f9fa',
                   border: '2px solid #6D2323',
                   borderRadius: '8px',
                   padding: '8px 12px',
                   flex: 1
                 }}>
                   <Image size={16} style={{ color: '#6D2323' }} />
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                     {uploadedFile ? (
                       <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedFile.name}</span>
                     ) : (
                       <img src={existingPhotoUrl} alt="existing" style={{ height: 48, borderRadius: 6, objectFit: 'cover' }} />
                     )}
                   </div>
                   <div style={{ display: 'flex', gap: 8 }}>
                     {uploadedFile ? (
                       <button type="button" onClick={handleRemoveFile} style={{ backgroundColor: 'transparent', border: 'none', color: '#dc3545', cursor: 'pointer' }}><X size={16} /></button>
                     ) : (
                       existingPhotoUrl && (
                         <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                           <input type="checkbox" checked={removeExistingPhoto} onChange={(e) => setRemoveExistingPhoto(e.target.checked)} style={{width: '18px', height: '18px', accentColor: '#6D2323'}} /> Remove existing photo
                         </label>
                       )
                     )}
                   </div>
                 </div>
               )}
             </div>
           </div>

           {/* Max Participants and Add Register Link */}
           <div style={{
             display: 'grid',
             gridTemplateColumns: '1fr 1fr',
             gap: '24px',
             alignItems: 'end',
             marginBottom: '32px'
           }}>
             {/* Max Participants */}
             <div>
               <label style={{
                 display: 'block',
                 color: '#6D2323',
                 fontSize: '16px',
                 fontWeight: '500',
                 marginBottom: '8px',
                 fontFamily: 'Poppins, sans-serif'
               }}>
                 Max Participants:
               </label>
                               <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #6D2323',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontFamily: 'Poppins, sans-serif',
                    backgroundColor: 'white'
                  }}
                  min="0"
                />
             </div>

              {/* Add Register Link Checkbox */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                justifyContent: 'flex-end',
                paddingRight: '20px'
              }}>
                <input
                  type="checkbox"
                  name="addRegisterLink"
                  checked={formData.addRegisterLink}
                  onChange={handleInputChange}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#6D2323'
                  }}
                />
                <span style={{
                  color: '#6D2323',
                  fontSize: '16px',
                  fontWeight: '500',
                  fontFamily: 'Poppins, sans-serif',
                  cursor: 'default'
                }}>
                  Add Register Link
                </span>
              </div>
           </div>

          {/* Post Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting ? '#ccc' : '#6D2323',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '16px 48px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontFamily: 'Poppins, sans-serif',
                transition: 'background-color 0.2s',
                width: '100%',
                opacity: isSubmitting ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.target.style.backgroundColor = '#8A1A1A';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.target.style.backgroundColor = '#6D2323';
                }
              }}
            >
              {isSubmitting ? (initialData && initialData.id ? 'Updating...' : 'Posting...') : (initialData && initialData.id ? 'Update' : 'Post')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTrainingModal;
