import { X, Calendar, Clock, MapPin, User, Users, HeartHandshakeIcon, Info } from 'lucide-react';

const FONT = 'Poppins, sans-serif';
const PRIMARY = '#6D2323';
const CARD_BG = '#FEF9E1';

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});

const formatTime = (timeString) => new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', { 
  hour: 'numeric', 
  minute: '2-digit', 
  hour12: true 
});

const sanitizeRichHtml = (html) => {
  if (!html) return '';
  const container = document.createElement('div');
  container.innerHTML = String(html);
  const allowedTags = new Set(['B','STRONG','I','EM','U','P','BR','UL','OL','LI','A','DIV','SPAN']);
  const traverse = (node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === 1) {
        if (!allowedTags.has(child.tagName)) {
          child.replaceWith(...Array.from(child.childNodes));
          continue;
        }
        const isLink = child.tagName === 'A';
        const allowedAttrs = isLink ? ['href','target','rel'] : [];
        for (const attr of Array.from(child.attributes)) {
          if (!allowedAttrs.includes(attr.name.toLowerCase())) {
            child.removeAttribute(attr.name);
          }
        }
        if (isLink) {
          const href = (child.getAttribute('href') || '').trim();
          if (!/^(https?:)?\/\//i.test(href)) {
            child.removeAttribute('href');
          }
          child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noopener noreferrer');
        }
        traverse(child);
      } else if (child.nodeType === 8) {
        child.remove();
      }
    }
  };
  traverse(container);
  return container.innerHTML;
};

export default function UpcomingEventsModal({ open, onClose, events, onEventClick }) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      fontFamily: FONT
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '90vw',
        maxWidth: 800,
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: PRIMARY,
            fontSize: 24,
            fontWeight: 'bold'
          }}
        >
          <X size={24} />
        </button>
        
        <h2 style={{
          color: PRIMARY,
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 20,
          textAlign: 'center'
        }}>
          All Upcoming Events
        </h2>

        <style>{`
          .rich-content ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
          .rich-content ol { list-style: decimal; padding-left: 1.25rem; margin: 0.5rem 0; }
          .rich-content li { margin: 0.25rem 0; }
          .rich-content a { color: #1d4ed8; text-decoration: underline; }
          .rich-content p { margin: 0.5rem 0; }
        `}</style>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {events && events.length > 0 ? (
            events.map((event) => (
              <div
                key={event.id}
                style={{
                  background: CARD_BG,
                  borderRadius: 12,
                  padding: 16,
                  border: `1px solid ${PRIMARY}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
                onClick={() => onEventClick && onEventClick(event)}
              >
                <div style={{
                  color: PRIMARY,
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 8
                }}>
                  {event.program_name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, fontSize: 14, color: '#333' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={16} color={PRIMARY} /><div>{formatDate(event.date)}</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={16} color={PRIMARY} /><div>{formatTime(event.time)}</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={16} color={PRIMARY} /><div>{event.venue || '—'}</div></div>
                  {event.department && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><HeartHandshakeIcon size={16} color={PRIMARY} /><div>{event.department}</div></div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={16} color={PRIMARY} /><div>{event.instructor || '—'}</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={16} color={PRIMARY} /><div>{event.max_participants || '—'} max participants</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Info size={16} color={PRIMARY} /><div>{event.mode}</div></div>
                </div>
                
                {event.description && (
                  <div
                    className="rich-content"
                    style={{
                      background: '#f8f9fa',
                      border: '1px solid #eee',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 14,
                      color: '#333',
                      lineHeight: '1.6',
                      wordBreak: 'break-word'
                    }}
                    dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(event.description) }}
                  />
                )}
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#666',
              fontSize: 16,
              padding: 40
            }}>
              No upcoming events found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
