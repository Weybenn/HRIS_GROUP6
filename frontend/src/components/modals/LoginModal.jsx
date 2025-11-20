import { AlertCircle, CheckCircle2, User, KeyRound } from "lucide-react";

const ICONS = {
  error: <AlertCircle size={40} color="#A31D1D" style={{ marginRight: 16 }} />,
  success: <CheckCircle2 size={40} color="#1DA34A" style={{ marginRight: 16 }} />,
  user: <User size={24} color="#A31D1D" style={{ marginRight: 8 }} />,
  key: <KeyRound size={24} color="#A31D1D" style={{ marginRight: 8 }} />,
};

export default function LoginModal({ type, message, onClose }) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      fontFamily: 'Poppins, sans-serif',
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 32px #0002",
        padding: "32px 36px 24px 36px",
        minWidth: 340,
        maxWidth: 400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: 'Poppins, sans-serif',
      }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          {ICONS[type]}
        </div>
        <div style={{ fontSize: 18, color: "#222", textAlign: "center", marginBottom: 24, fontWeight: 400 }}>
          {message}
        </div>
        <button
          onClick={onClose}
          style={{
            background: type === "success" ? "#1DA34A" : "#A31D1D",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 28px",
            fontSize: 16,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: 'Poppins, sans-serif',
            marginTop: 8,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
