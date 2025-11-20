import { CheckCircle2 } from 'lucide-react';

const MODAL_BG = 'rgba(0,0,0,0.25)';
const CARD_BG = '#fff';
const PRIMARY_TEXT = '#FEF9E1';
const BORDER_RADIUS = 25;
const FONT = 'Poppins, sans-serif';
const SUCCESS_GREEN = '#1DA34A';

export default function AccountRegistered({ open, onClose }) {
  if (!open) return null;
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
        padding: '40px 32px',
        minWidth: 380,
        maxWidth: '95vw',
        fontFamily: FONT,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <CheckCircle2 size={48} color={SUCCESS_GREEN} />
        </div>
        <div style={{ fontSize: 20, color: '#222', marginBottom: 32, textAlign: 'center' }}>
          The account was successfully registered.
        </div>
        <button
          style={{
            borderRadius: 12,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 20,
            padding: '10px 32px',
            border: 'none',
            cursor: 'pointer',
            background: SUCCESS_GREEN,
            color: PRIMARY_TEXT,
            transition: 'background 0.2s, color 0.2s',
          }}
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  );
}
