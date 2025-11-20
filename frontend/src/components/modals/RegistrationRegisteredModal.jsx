import { CheckCircle2, XCircle } from 'lucide-react';

const MODAL_BG = 'rgba(0,0,0,0.25)';
const CARD_BG = '#fff';
const PRIMARY_TEXT = '#FEF9E1';
const BORDER_RADIUS = 25;
const FONT = 'Poppins, sans-serif';
const SUCCESS_GREEN = '#1DA34A';
const ERROR_RED = '#C0392B';

export default function RegistrationRegisteredModal({ open, onClose, success, message }) {
  if (!open) return null;
  const color = success ? SUCCESS_GREEN : ERROR_RED;
  const Icon = success ? CheckCircle2 : XCircle;

  return (
    <div style={{
      position: 'fixed',
      zIndex: 1100,
      top: 0, left: 0, right: 0, bottom: 0,
      background: MODAL_BG,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: CARD_BG,
        borderRadius: BORDER_RADIUS,
        boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
        padding: '34px 28px',
        minWidth: 360,
        maxWidth: '95vw',
        fontFamily: FONT,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <Icon size={48} color={color} />
        </div>
        <div style={{ fontSize: 18, color: '#222', marginBottom: 24, textAlign: 'center' }}>
          {message}
        </div>
        <button
          style={{
            borderRadius: 12,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 18,
            padding: '10px 28px',
            border: 'none',
            cursor: 'pointer',
            background: color,
            color: PRIMARY_TEXT,
            transition: 'background 0.2s, color 0.2s',
          }}
          onClick={onClose}
        >
          Okay
        </button>
      </div>
    </div>
  );
}

