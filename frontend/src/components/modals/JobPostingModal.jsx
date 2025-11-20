import { useEffect, useState, useRef } from 'react';
import { X, Info, Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon } from 'lucide-react';

const FONT = 'Poppins, sans-serif';
const PRIMARY = '#6D2323';

export default function JobPostingModal({ isOpen, onClose, initialData = null, onSuccess = null, defaultCategory = null }) {
  const computeEmptyForm = () => ({
    category: defaultCategory || '',
    job_title: '',
    location: '',
    employment_type: '',
    salary: '',
    description: '',
    status: 'Active'
  });

  const [formData, setFormData] = useState(computeEmptyForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', message: '' });
  const [topToast] = useState({ type: '', message: '' });
  const descriptionEditorRef = useRef(null);
  const [toolbarState, setToolbarState] = useState({ bold: false, italic: false, underline: false, ul: false, ol: false });

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
    if (isOpen && initialData) {
      setFormData({
        category: initialData.category || defaultCategory || '',
        job_title: initialData.job_title || '',
        location: initialData.location || '',
        employment_type: initialData.employment_type || '',
        salary: initialData.salary ?? '',
        description: initialData.description || '',
        status: initialData.status || 'Active'
      });
    } else if (isOpen && !initialData) {
      setFormData(computeEmptyForm());
      if (descriptionEditorRef.current) descriptionEditorRef.current.innerHTML = '';
    }
  }, [isOpen, initialData, defaultCategory]);

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

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const focusDescriptionEditor = () => {
    if (descriptionEditorRef.current) descriptionEditorRef.current.focus();
  };

  const syncDescriptionFromDom = () => {
    if (!descriptionEditorRef.current) return;
    const html = descriptionEditorRef.current.innerHTML;
    setFormData(prev => ({ ...prev, description: html }));
    updateToolbarState();
  };

  const applyEditorCommand = (cmd) => {
    focusDescriptionEditor();
    try { document.execCommand(cmd, false, null); } catch (_) {}
    setTimeout(syncDescriptionFromDom, 0);
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
    setTimeout(syncDescriptionFromDom, 0);
  };

  const handleClose = () => {
    setSubmitMessage({ type: '', message: '' });
    setIsSubmitting(false);
    if (descriptionEditorRef.current) descriptionEditorRef.current.innerHTML = '';
    setFormData(computeEmptyForm());
    onClose && onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage({ type: '', message: '' });
    try {
      const isEditing = !!(initialData && initialData.id);

      const payload = {
        category: formData.category,
        job_title: formData.job_title,
        location: formData.location,
        employment_type: formData.employment_type,
        salary: formData.salary,
        description: formData.description,
        status: formData.status
      };

      const url = isEditing ? `http://localhost:5000/job-postings/${initialData.id}` : 'http://localhost:5000/job-postings';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save job posting');

      handleClose();
      if (onSuccess) onSuccess({ type: 'success', message: isEditing ? 'Job updated successfully.' : 'Job posted successfully.' });
      try { window.dispatchEvent(new CustomEvent('jobs:updated')); } catch (e) {}
    } catch (err) {
      setSubmitMessage({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(128, 128, 128, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, fontFamily: FONT
      }}
    >
      <div style={{ backgroundColor: 'white', borderRadius: 15, padding: 32, width: '90%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' }}>
        {topToast.message && (
          <div style={{ position: 'fixed', top: 12, left: 16, right: 16, margin: '0 auto', maxWidth: 900, backgroundColor: topToast.type === 'success' ? '#1DA34A' : PRIMARY, color: '#fff', padding: '10px 16px', borderRadius: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.15)', zIndex: 1200, fontFamily: FONT, fontSize: 14, fontWeight: 500, textAlign: 'center' }}>
            <span>{topToast.message}</span>
            <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.9 }}>
              <Info size={18} />
            </span>
          </div>
        )}

        <button onClick={handleClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PRIMARY }}>
          <X size={24} />
        </button>

        <h2 style={{ color: PRIMARY, fontSize: 28, fontWeight: 600, marginBottom: 16, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
          {initialData?.id ? 'Update Job Posting' : 'Post a Job'}
        </h2>
        <hr style={{ border: 'none', height: 2, backgroundColor: PRIMARY, marginBottom: 32 }} />

        {submitMessage.message && (
          <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 24, backgroundColor: submitMessage.type === 'success' ? '#d4edda' : '#f8d7da', color: submitMessage.type === 'success' ? '#155724' : '#721c24', border: `1px solid ${submitMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`, fontFamily: FONT, fontSize: 14 }}>
            {submitMessage.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: PRIMARY, fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Category</label>
                <select name="category" value={formData.category} onChange={handleInputChange} required style={{ width: '100%', padding: '12px 16px', paddingRight: '40px', border: `2px solid ${PRIMARY}`, borderRadius: 8, fontSize: 16, fontFamily: FONT, backgroundColor: 'white', cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23A31D1D\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}>
                  <option value="">Select Category</option>
                  <option value="administrative-staff">Administrative Staff</option>
                  <option value="academic-faculty">Academic Faculty</option>
                  <option value="it-technical-support">IT & Technical Support</option>
                  <option value="facilities-maintenance">Facilities & Maintenance</option>
                  <option value="finance-accounting">Finance & Accounting</option>
                  <option value="student-support-services">Student Support Services</option>
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: PRIMARY, fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Job Title</label>
                <input type="text" name="job_title" value={formData.job_title} onChange={handleInputChange} required style={{ width: '100%', padding: '12px 16px', border: `2px solid ${PRIMARY}`, borderRadius: 8, fontSize: 16 }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: PRIMARY, fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleInputChange} required style={{ width: '100%', padding: '12px 16px', border: `2px solid ${PRIMARY}`, borderRadius: 8, fontSize: 16 }} />
              </div>
            </div>
            <div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: PRIMARY, fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Employment Type</label>
                <select name="employment_type" value={formData.employment_type} onChange={handleInputChange} required style={{ width: '100%', padding: '12px 16px', paddingRight: '40px', border: `2px solid ${PRIMARY}`, borderRadius: 8, fontSize: 16, fontFamily: FONT, backgroundColor: 'white', cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23A31D1D\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}>
                  <option value="">Select Type</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Contractual">Contractual</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Probationary">Probationary</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: PRIMARY, fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Salary (optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', border: `2px solid ${PRIMARY}`, borderRadius: 8, overflow: 'hidden' }}>
                  <span style={{ padding: '12px 14px', background: '#fff', color: PRIMARY, fontWeight: 700, borderRight: `1px solid ${PRIMARY}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 48 }}>
                    ₱
                  </span>
                  <input type="number" step="0.01" name="salary" value={formData.salary} onChange={handleInputChange} style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontSize: 16, background: 'transparent' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: PRIMARY, fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Description</label>
            {/* Editor container with toolbar inside and divider */}
            <style>{`
              .rich-editor ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
              .rich-editor ol { list-style: decimal; padding-left: 1.25rem; margin: 0.5rem 0; }
              .rich-editor li { margin: 0.25rem 0; }
              .rich-editor a { color: #1d4ed8; text-decoration: underline; }
            `}</style>
            <div style={{ border: `2px solid ${PRIMARY}`, borderRadius: 8, background: '#fff', overflow: 'hidden' }}>
              <div
                ref={descriptionEditorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={syncDescriptionFromDom}
                dir="ltr"
                className="rich-editor"
                style={{ width: '100%', padding: '12px 16px', border: 'none', fontSize: 16, minHeight: 120, outline: 'none', cursor: 'text', textAlign: 'left', direction: 'ltr', unicodeBidi: 'isolate', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              />
              <div style={{ display: 'flex', gap: 8, padding: 8, borderTop: '1px solid #e5e7eb', background: '#fafafa' }}>
                <button type="button" aria-label="Bold" aria-pressed={toolbarState.bold} onClick={() => applyEditorCommand('bold')} style={{ padding: '6px 10px', border: 'none', borderRadius: 6, background: toolbarState.bold ? 'rgba(109,35,35,0.12)' : 'transparent', color: PRIMARY, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bold size={16} />
                </button>
                <button type="button" aria-label="Italic" aria-pressed={toolbarState.italic} onClick={() => applyEditorCommand('italic')} style={{ padding: '6px 10px', border: 'none', borderRadius: 6, background: toolbarState.italic ? 'rgba(109,35,35,0.12)' : 'transparent', color: PRIMARY, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Italic size={16} />
                </button>
                <button type="button" aria-label="Underline" aria-pressed={toolbarState.underline} onClick={() => applyEditorCommand('underline')} style={{ padding: '6px 10px', border: 'none', borderRadius: 6, background: toolbarState.underline ? 'rgba(109,35,35,0.12)' : 'transparent', color: PRIMARY, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Underline size={16} />
                </button>
                <button type="button" aria-label="Bulleted list" aria-pressed={toolbarState.ul} onClick={() => applyEditorCommand('insertUnorderedList')} style={{ padding: '6px 10px', border: 'none', borderRadius: 6, background: toolbarState.ul ? 'rgba(109,35,35,0.12)' : 'transparent', color: PRIMARY, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <List size={16} />
                </button>
                <button type="button" aria-label="Numbered list" aria-pressed={toolbarState.ol} onClick={() => applyEditorCommand('insertOrderedList')} style={{ padding: '6px 10px', border: 'none', borderRadius: 6, background: toolbarState.ol ? 'rgba(109,35,35,0.12)' : 'transparent', color: PRIMARY, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ListOrdered size={16} />
                </button>
                <button type="button" aria-label="Insert link" onClick={insertEditorLink} style={{ padding: '6px 10px', border: 'none', borderRadius: 6, background: 'transparent', color: PRIMARY, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LinkIcon size={16} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: PRIMARY, fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange} style={{ width: '100%', padding: '12px 16px', paddingRight: '40px', border: `2px solid ${PRIMARY}`, borderRadius: 8, fontSize: 16, fontFamily: FONT, backgroundColor: 'white', cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23A31D1D\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button type="submit" disabled={isSubmitting} style={{ backgroundColor: isSubmitting ? '#ccc' : PRIMARY, color: '#fff', border: 'none', borderRadius: 8, padding: '16px 48px', fontSize: 18, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', width: '100%' }}>
              {isSubmitting ? (initialData?.id ? 'Updating...' : 'Posting...') : (initialData?.id ? 'Update' : 'Post')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

