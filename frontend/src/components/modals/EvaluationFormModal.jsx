import { useState } from 'react';
import { Star } from 'lucide-react';

const FONT = 'Poppins, sans-serif';
const HEADER_COLOR = '#6D2323';

export default function EvaluationFormModal({ registration, userId, onClose, onSubmitted }) {
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '', q4: '', q5: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const allAnswered = Object.values(answers).every(Boolean);

  const submit = async () => {
    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });
      const res = await fetch('http://localhost:5000/api/evaluation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          registration_id: registration.registration_id,
          ...answers
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setMessage({ type: 'success', text: 'Evaluation submitted successfully.' });
      onSubmitted && onSubmitted();
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Failed to submit' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(128,128,128,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, fontFamily: FONT }}
    >
      <div style={{ backgroundColor: 'white', borderRadius: 15, padding: 32, width: '90%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: '50%', color: HEADER_COLOR }}>✕</button>
        <h2 style={{ color: HEADER_COLOR, fontSize: 28, fontWeight: 600, marginBottom: 16 }}>Evaluation Form</h2>
        <hr style={{ border: 'none', height: 2, backgroundColor: HEADER_COLOR, marginBottom: 24 }} />

        {message.text && (
          <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da', color: message.type === 'success' ? '#155724' : '#721c24', border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}` }}>
            {message.text}
          </div>
        )}

        <div style={{ marginBottom: 12, color: '#333' }}>
          Please rate your level of satisfaction with the following aspects of the training program:
        </div>

        <div style={{ border: '1px solid #6D2323', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {[1,2,3,4,5].map(n => (
              <div key={n} style={{ padding: 10, textAlign: 'center', background: n % 2 ? '#E5D0AC' : '#FEF9E1', fontWeight: 600, color: HEADER_COLOR }}> {n} </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderTop: '1px solid #6D2323', background: '#fff' }}>
            {['Very Dissatisfied','Dissatisfied','Neutral','Satisfied','Very Satisfied'].map((label) => (
              <div key={label} style={{ padding: 10, textAlign: 'center', fontSize: 12 }}>{label}</div>
            ))}
          </div>
        </div>

        <QuestionRow index={1} label="Overall Organization — How satisfied are you with the overall organization and coordination of the training program? *" value={answers.q1} onChange={(v) => setAnswers(a => ({ ...a, q1: v }))} />
        <QuestionRow index={2} label="Content Clarity and Relevance — How satisfied are you with the clarity, relevance, and depth of the topics presented? *" value={answers.q2} onChange={(v) => setAnswers(a => ({ ...a, q2: v }))} />
        <QuestionRow index={3} label="Speaker’s Expertise and Delivery — How satisfied are you with the speaker’s knowledge of the subject matter and presentation style? *" value={answers.q3} onChange={(v) => setAnswers(a => ({ ...a, q3: v }))} />
        <QuestionRow index={4} label="Venue, Facilities, and Schedule Management — How satisfied are you with the quality of the venue, available facilities, and time management throughout the seminar? *" value={answers.q4} onChange={(v) => setAnswers(a => ({ ...a, q4: v }))} />
        <QuestionRow index={5} label="Personal and Professional Value — How satisfied are you with the seminar’s usefulness and its contribution to your personal or professional growth? *" value={answers.q5} onChange={(v) => setAnswers(a => ({ ...a, q5: v }))} />

        <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #6D2323', borderRadius: 8, padding: 12, marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={18} color={HEADER_COLOR} />
          <div style={{ fontSize: 14, color: '#333' }}>Please double-check your feedback before submitting.</div>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            onClick={submit}
            disabled={!allAnswered || submitting}
            style={{ backgroundColor: (!allAnswered || submitting) ? '#ccc' : HEADER_COLOR, color: 'white', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 16, fontWeight: 600, cursor: (!allAnswered || submitting) ? 'not-allowed' : 'pointer', width: '100%' }}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestionRow({ index, label, value, onChange }) {
  const raw = (label || '').trim();
  const isRequired = /\*$/.test(raw);
  const withoutAsterisk = raw.replace(/\s*\*$/, '').trim();
  const parts = withoutAsterisk.split('—');
  const title = (parts[0] || withoutAsterisk).trim();
  const description = (parts[1] || '').trim();

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        {typeof index === 'number' && (
          <div style={{ color: '#111827', fontWeight: 600, fontSize: 16 }}>{index}.</div>
        )}
        <div style={{ color: '#111827', fontWeight: 600, fontSize: 16 }}>{title}</div>
      </div>
      {description && (
        <div style={{ color: '#374151', fontSize: 13, marginBottom: 12 }}>
          {description} {isRequired && <span style={{ color: '#EF4444' }}>*</span>}
        </div>
      )}

      <div style={{ backgroundColor: '#F3F4F6', borderRadius: 10, padding: '14px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', alignItems: 'center' }}>
          {[1,2,3,4,5].map((n) => (
            <label key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div style={{ fontSize: 12, color: '#000000' }}>{n}</div>
              <input
                type="radio"
                name={label}
                value={n}
                checked={String(value) === String(n)}
                onChange={() => onChange(String(n))}
                style={{ width: 22, height: 22, accentColor: HEADER_COLOR, cursor: 'pointer' }}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}