import { useState, useEffect } from "react";
import { X, PenSquare, Send as SendIcon, Save, XCircle, FileText, Eye, Award } from "lucide-react";
import EaristLogo from "../../assets/logo/EARIST_Logo.png";
import LoginModal from "../modals/LoginModal";

const FONT = "Poppins, sans-serif";
const PRIMARY = '#6D2323';
const SECONDARY = '#FEF9E1';
const ACCENT = '#C97C5D'; // Changed from ACCENT_COLOR to match NotificationAdmin

const STATUS_COLORS = {
  "Not Started": "#6B7280",
  "In Progress": "#F59E0B",
  "On Hold": "#6366F1",
  Completed: "#10B981",
  Incomplete: "#EF4444",
};

const STATUS_BG = {
  "Not Started": "#e5e7eb",
  "In Progress": "#fef3cd",
  "On Hold": "#e0e7ff",
  Completed: "#d1fae5",
  Incomplete: "#fee2e2",
};

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000";

const sanitizeMiddleNameValue = (value) => {
  if (!value) return "";
  return value.trim().toUpperCase() === "NA" ? "" : value.trim();
};

const composeParticipantName = (participant) => {
  const parts = [
    participant.first_name,
    sanitizeMiddleNameValue(participant.middle_name),
    participant.last_name,
  ].filter(Boolean);

  return parts.join(" ").replace(/\s+/g, " ").trim();
};

const buildDefaultBodyText = (participant) => {
  const trainingTitle = participant.training_title || "the training program";
  const venue = participant.venue || "the designated venue";
  const trainingDate = participant.training_date
    ? new Date(participant.training_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "a scheduled date";

  return `has successfully completed the training program entitled "${trainingTitle}", conducted by the Eulogio "Amang" Rodriguez Institute of Science and Technology (EARIST). The training was held at ${venue} on ${trainingDate}.`;
};

const formatLongDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const derivePreviewSource = (value) => {
  if (!value) return null;
  if (typeof value !== "string") return null;
  if (value.startsWith("data:")) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return `${API_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

export default function CertificatesAdmin() {

  const [trainings, setTrainings] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTrainings, setLoadingTrainings] = useState(true);
  const [error, setError] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);
  const [participantToSend, setParticipantToSend] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [certificateGenerated, setCertificateGenerated] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchUploadedTrainings();
  }, []);

  const fetchUploadedTrainings = async () => {
    setLoadingTrainings(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/training-management/training-programs`
      );
      if (response.ok) {
        const data = await response.json();
        setTrainings(data || []);
      } else {
        setError("Failed to fetch trainings");
      }
    } catch (error) {
      setError("Error fetching trainings");
    } finally {
      setLoadingTrainings(false);
    }
  };

  const handleTrainingChange = async (trainingIdRaw) => {
    if (trainingIdRaw === "" || trainingIdRaw === null || trainingIdRaw === undefined) {
      setSelectedTraining(null);
      setParticipants([]);
      setLoading(false);
      return;
    }

    const trainingId =
      typeof trainingIdRaw === "string" ? Number(trainingIdRaw) : trainingIdRaw;

    if (!Number.isFinite(trainingId)) {
      setSelectedTraining(null);
      setParticipants([]);
      setLoading(false);
      return;
    }

    setSelectedTraining(trainingId);
    setParticipants([]);
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/certificates/training/${trainingId}/participants`
      );
      if (response.ok) {
        const data = await response.json();
        const participantsWithStatus = Array.isArray(data)
          ? data
              .filter((p) => (p.progress_status || "") === "Completed")
              .map((p) => ({
                ...p,
                id: p.registration_id || p.id,
                certificate_status:
                  p.certificate_status ||
                  (p.progress_status === "Completed"
                    ? "Ready to Generate"
                    : "Not Available"),
              }))
          : [];
        setParticipants(participantsWithStatus);
      } else {
        setError("Failed to fetch participants");
      }
    } catch (error) {
      setError("Error fetching participants");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClick = (participant) => {
    if (participant.progress_status !== "Completed") {
      alert("This participant has not completed the training yet.");
      return;
    }

    const sanitizedMiddle = sanitizeMiddleNameValue(participant.middle_name);

    setSelectedParticipant({
      ...participant,
      middle_name: sanitizedMiddle || "",
      certificate_details: participant.certificate_details || null,
    });

    setCertificateGenerated(
      participant.certificate_status === "Generated" ||
        participant.certificate_status === "Sent"
    );
  };

  const handleGenerateCertificate = async (formValues) => {
    if (!selectedParticipant) return;

    setGeneratingCertificate(true);
    const registrationId =
      selectedParticipant.registration_id || selectedParticipant.id;
    const wasGenerated =
      selectedParticipant.certificate_status === "Generated" ||
      selectedParticipant.certificate_status === "Sent";

    try {
      const response = await fetch(
        `${API_BASE_URL}/certificates/generate/${registrationId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formValues),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setParticipants((prevParticipants) =>
          prevParticipants.map((p) =>
            p.id === selectedParticipant.id
              ? {
                  ...p,
                  certificate_status: "Generated",
                  certificate_details: result.certificate_details || p.certificate_details,
                  generated_at: result.generated_at || p.generated_at,
                }
              : p
          )
        );

        setCertificateGenerated(true);

        setSelectedParticipant((prev) =>
          prev
            ? {
                ...prev,
                certificate_status: "Generated",
                certificate_details: result.certificate_details || prev.certificate_details,
                generated_at: result.generated_at || prev.generated_at,
              }
            : prev
        );
        setSuccessMessage(
          wasGenerated
            ? "Certificate updated successfully."
            : "Certificate generated successfully."
        );
        setShowSuccessModal(true);
      } else {
        alert(result.error || "Failed to generate certificate. Please try again.");
      }
    } catch (error) {
      console.error("Error generating certificate:", error);
      alert(
        `Error generating certificate: ${error.message}. Please check the console for details.`
      );
    } finally {
      setGeneratingCertificate(false);
    }
  };

  const handleSendClick = (participant) => {
    if (participant.certificate_status !== "Generated" && participant.certificate_status !== "Sent") {
      alert("Please generate the certificate first before sending.");
      return;
    }

    if (participant.certificate_status === "Sent") {
      alert("This certificate has already been sent.");
      return;
    }

    setParticipantToSend(participant);
    setShowSendConfirmation(true);
  };

  const closeModal = () => {
    setSelectedParticipant(null);
    setCertificateGenerated(false);
  };

  return (
    <div
      style={{
        fontFamily: FONT,
        minHeight: "100vh",
        padding: "0 2rem 2rem 2rem",
      }}
    >
      {/* Header with NotificationAdmin Style */}
      <div style={{ 
        marginBottom: 16,
        background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
        padding: '16px 20px',
        borderRadius: '8px',
        color: '#fff',
        boxShadow: '0 2px 8px rgba(109, 35, 35, 0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ 
              fontWeight: 700, 
              fontSize: 22,
              margin: '0 0 4px 0',
              fontFamily: FONT,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Award size={22} /> Certificates Management
            </h1>
            <p style={{ 
              margin: 0,
              fontFamily: FONT,
              opacity: 0.9,
              fontSize: '14px'
            }}>
              Generate completion certificates and deliver them to employees
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        {loadingTrainings ? (
          <span>Loading trainings...</span>
        ) : (
          <div style={{ position: "relative",  display: 'flex', alignItems: 'center', gap: 12  }}>
            <select
              id="training"
              value={selectedTraining ?? ""}
              onChange={(e) => handleTrainingChange(e.target.value)}
              style={{
                padding: '8px 24px 8px 12px', 
                borderRadius: 4, 
                border: '1px solid #ddd', 
                fontFamily: FONT, 
                fontSize: 14, 
                background: 'white', 
                minWidth: '140px', 
                appearance: 'none', 
                backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='gray' height='16' viewBox='0 0 24 24' width='16' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`, 
                backgroundRepeat: 'no-repeat', 
                backgroundPosition: 'right 8px center' 
              }}
            >
              <option value="" disabled>
                Select a training program
              </option>
              {trainings.map((training) => (
                <option key={training.id} value={training.id}>
                  {training.program_name ??
                    training.title ??
                    `Training #${training.id}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginBottom: 16, color: "crimson" }}>{error}</div>
      )}

      {!selectedTraining ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            border: "1px solid #e9ecef",
            borderRadius: 8,
            background: "white",
            color: "#4b5563",
            fontWeight: 500,
          }}
        >
          No training program selected.
        </div>
      ) : loading ? (
        <div>Loading participants...</div>
      ) : (
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e9ecef",
            borderRadius: 8,
            background: "white",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#6D2323", color: "white" }}>
                <th style={{ padding: 12, textAlign: "left" }}>Employee</th>
                <th style={{ padding: 12, textAlign: "left" }}>Training</th>
                <th style={{ padding: 12, textAlign: "center" }}>Progress</th>
                <th style={{ padding: 12, textAlign: "center" }}>
                  Certificate
                </th>
                <th style={{ padding: 12, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {participants.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 12, textAlign: "center", color: "#4b5563" }}>
                    No completed participants found for this training.
                  </td>
                </tr>
              ) : (
                participants.map((p) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: "1px solid #e9ecef",
                      backgroundColor: "#fff",
                    }}
                  >
                    <td
                      style={{
                        padding: 12,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {p.first_name} {p.last_name}
                        </div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {p.email || "no-email@example.com"}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      {p.training_title || "—"}
                    </td>
                    <td style={{ padding: 12, textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          fontWeight: 600,
                          fontSize: 12,
                          color:
                            STATUS_COLORS[p.progress_status || "Not Started"] ||
                            "#6B7280",
                          background:
                            STATUS_BG[p.progress_status || "Not Started"] ||
                            "#e5e7eb",
                          padding: "2px 8px",
                          borderRadius: 12,
                        }}
                      >
                        {p.progress_status || "Not Started"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          background: "#f1f1f1",
                          color:
                            p.certificate_status === "Sent"
                              ? "#10B981"
                              : p.certificate_status === "Generated"
                              ? "#3B82F6"
                              : p.certificate_status === "Ready to Generate"
                              ? "#F59E0B"
                              : "#666",
                          fontSize: 12,
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontWeight: 600,
                        }}
                      >
                        {p.certificate_status ||
                          (p.progress_status === "Completed"
                            ? "Ready to Generate"
                            : "Not Available")}
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        <button
                          style={{
                            background:
                              p.certificate_status === "Generated" ||
                              p.certificate_status === "Sent"
                                ? "#6B7280"
                                : "#2563EB",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 12px",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                          onClick={() => handleGenerateClick(p)}
                        >
                          {p.certificate_status === "Generated" ||
                          p.certificate_status === "Sent" ? (
                            <>
                              <Eye size={16} /> View
                            </>
                          ) : (
                            <>
                              <FileText size={16} /> Generate
                            </>
                          )}
                        </button>
                        <button
                          style={{
                            background:
                              p.certificate_status === "Sent"
                                ? "#9CA3AF"
                                : p.certificate_status === "Generated"
                                ? "#10B981"
                                : "#E5E7EB",
                            color:
                              p.certificate_status === "Generated" ||
                              p.certificate_status === "Sent"
                                ? "white"
                                : "#666",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 12px",
                            cursor:
                              p.certificate_status === "Generated"
                                ? "pointer"
                                : "not-allowed",
                            fontSize: 13,
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                          disabled={p.certificate_status !== "Generated"}
                          onClick={() => {
                            if (p.certificate_status === "Generated") {
                              handleSendClick(p);
                            }
                          }}
                        >
                          <SendIcon size={16} />
                          {p.certificate_status === "Sent" ? "Sent" : "Send"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate Certificate Modal */}
      {selectedParticipant && (
        <GenerateCertificateModal
          participant={selectedParticipant}
          onClose={closeModal}
          onGenerate={handleGenerateCertificate}
          generating={generatingCertificate}
          certificateGenerated={certificateGenerated}
          onSend={() => {
            closeModal();
            setTimeout(() => {
              handleSendClick(selectedParticipant);
            }, 100);
          }}
        />
      )}

      {/* Send Confirmation Modal - Higher z-index to appear on top */}
      {showSendConfirmation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "400px",
              borderRadius: 8,
              padding: 20,
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ color: PRIMARY, fontWeight: 700, fontSize: 20, marginBottom: 12 }}>
              Send Certificate
            </div>
            <div style={{ fontSize: 14, color: '#374151', marginBottom: 16 }}>
              Are you sure you want to send the certificate to{" "}
              <strong>
                {participantToSend?.first_name}{" "}
                {participantToSend?.last_name}
              </strong>{" "}
              at <strong>{participantToSend?.email}</strong>?
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSendConfirmation(false);
                  setParticipantToSend(null);
                }}
                style={{ 
                  background: '#e5e7eb', 
                  color: '#111827', 
                  border: 'none', 
                  borderRadius: 8, 
                  padding: '10px 16px', 
                  fontWeight: 600, 
                  cursor: loading ? 'not-allowed' : 'pointer' 
                }}
                disabled={sendingEmail}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setSendingEmail(true);
                  try {
                    const registrationId =
                      participantToSend.registration_id ||
                      participantToSend.id;

                    const response = await fetch(
                      `${API_BASE_URL}/certificates/send/${registrationId}`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                      }
                    );

                    const responseData = await response
                      .json()
                      .catch(() => ({}));

                    if (response.ok) {
                      alert(
                        responseData.message ||
                          "Certificate sent successfully!"
                      );
                      setParticipants((prevParticipants) =>
                        prevParticipants.map((p) =>
                          p.id === participantToSend.id
                            ? { ...p, certificate_status: "Sent" }
                            : p
                        )
                      );
                      if (selectedParticipant && selectedParticipant.id === participantToSend.id) {
                        setSelectedParticipant(prev => ({
                          ...prev,
                          certificate_status: "Sent"
                        }));
                      }
                      if (selectedTraining) {
                        await handleTrainingChange(selectedTraining);
                      }
                    } else {
                      console.error("Certificate send failed:", responseData);
                      alert(
                        responseData.error ||
                          "Failed to send certificate. Please try again."
                      );
                    }
                  } catch (error) {
                    console.error("Error sending certificate:", error);
                    alert(
                      `Error sending certificate: ${error.message}. Please check the console for details.`
                    );
                  } finally {
                    setSendingEmail(false);
                    setShowSendConfirmation(false);
                    setParticipantToSend(null);
                  }
                }}
                style={{
                  background: sendingEmail ? "#9CA3AF" : "#6D2323",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontWeight: 600,
                  cursor: sendingEmail ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
                disabled={sendingEmail}
              >
                {sendingEmail ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <LoginModal
          type="success"
          message={successMessage || "Certificate updated successfully."}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
}

function GenerateCertificateModal({
  participant,
  onClose,
  onGenerate,
  generating,
  certificateGenerated,
  onSend,
}) {
  const [mode, setMode] = useState(certificateGenerated ? "view" : "edit");

  const initializeStateFromParticipant = (data) => {
    const details = data.certificate_details || {};
    return {
      bodyText: details.bodyText || buildDefaultBodyText(data),
      leftSignerName: details.leftSignerName || "",
      leftSignerPosition: details.leftSignerPosition || "",
      rightSignerName: details.rightSignerName || "",
      rightSignerPosition: details.rightSignerPosition || "",
      leftSignature: details.leftSignature || null,
      rightSignature: details.rightSignature || null,
      dateIssued: details.dateIssued || data.generated_at || null,
    };
  };

  const [formState, setFormState] = useState(() => initializeStateFromParticipant(participant));
  const [leftSignaturePreview, setLeftSignaturePreview] = useState(() => derivePreviewSource(formState.leftSignature));
  const [rightSignaturePreview, setRightSignaturePreview] = useState(() => derivePreviewSource(formState.rightSignature));
  const [dateIssued, setDateIssued] = useState(formState.dateIssued);

  useEffect(() => {
    const nextState = initializeStateFromParticipant(participant);
    setFormState(nextState);
    setLeftSignaturePreview(derivePreviewSource(nextState.leftSignature));
    setRightSignaturePreview(derivePreviewSource(nextState.rightSignature));
    setDateIssued(nextState.dateIssued);
    setMode(certificateGenerated ? "view" : "edit");
  }, [participant, certificateGenerated]);

  const updateFormField = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignatureUpload = (side, event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (!dataUrl || typeof dataUrl !== "string") {
        return;
      }

      if (side === "left") {
        setLeftSignaturePreview(dataUrl);
        updateFormField("leftSignature", dataUrl);
      } else {
        setRightSignaturePreview(dataUrl);
        updateFormField("rightSignature", dataUrl);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleGenerate = () => {
    onGenerate({
      bodyText: formState.bodyText?.trim() || "",
      leftSignerName: formState.leftSignerName?.trim() || "",
      leftSignerPosition: formState.leftSignerPosition?.trim() || "",
      rightSignerName: formState.rightSignerName?.trim() || "",
      rightSignerPosition: formState.rightSignerPosition?.trim() || "",
      leftSignature: formState.leftSignature || null,
      rightSignature: formState.rightSignature || null,
    });
  };

  const fullName = composeParticipantName(participant);
  const formattedDateIssued = formatLongDate(dateIssued);
  const isViewMode = mode === "view";
  const headerTitle = isViewMode
    ? "Certificate Preview"
    : certificateGenerated
    ? "Update Certificate"
    : "Generate Certificate";

  const renderCertificatePreview = () => (
    <div
      style={{
        marginTop: 24,
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 1040,
          aspectRatio: "297 / 210",
          background: "#fff",
          padding: "48px 72px 64px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#fff",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 32,
            left: 32,
            right: 32,
            bottom: 40,
            border: "12px solid #6D2323",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 60,
            right: 60,
            bottom: 66,
            border: "2px dashed #c49543",
            opacity: 0.8,
          }}
        />
        <img
          src={EaristLogo}
          alt="EARIST watermark"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 320,
            opacity: 0.25,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 96px 72px",
            textAlign: "center",
          }}
        >
        <div>
          <div style={{ color: "#6D2323", fontWeight: 700, fontSize: 44, letterSpacing: 8 }}>
            CERTIFICATE
          </div>
          <div style={{ color: "#c49543", fontWeight: 600, fontSize: 20, letterSpacing: 6, marginTop: 6 }}>
            OF COMPLETION
          </div>
          <div style={{ marginTop: 36, fontSize: 16, color: "#1f2937" }}>
            This certifies that
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 30,
              fontWeight: 700,
              color: "#b8860b",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {fullName}
          </div>
          <div style={{ marginTop: 28, fontSize: 16, lineHeight: 1.6, color: "#374151" }}>
            {formState.bodyText}
          </div>
          <div style={{ marginTop: 32, fontSize: 15, fontWeight: 600, color: "#4b5563" }}>
            Date Issued: {formattedDateIssued || "—"}
          </div>
        </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 80,
              marginTop: 48,
            }}
          >
            <div style={{ flex: 1, textAlign: "center", minHeight: 200, paddingBottom: 16 }}>
            {leftSignaturePreview && (
              <img
                src={leftSignaturePreview}
                alt="Left signer e-signature"
                  style={{ maxWidth: 220, maxHeight: 82, objectFit: "contain", marginBottom: 10 }}
              />
            )}
              <div style={{ width: 280, borderTop: "2px solid #6D2323", margin: "0 auto 16px" }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
                {formState.leftSignerName}
              </div>
              <div style={{ fontSize: 14, color: "#4b5563", marginTop: 4 }}>
                {formState.leftSignerPosition}
              </div>
            </div>
            <div style={{ flex: 1, textAlign: "center", minHeight: 200, paddingBottom: 16 }}>
            {rightSignaturePreview && (
              <img
                src={rightSignaturePreview}
                alt="Right signer e-signature"
                  style={{ maxWidth: 220, maxHeight: 82, objectFit: "contain", marginBottom: 10 }}
              />
            )}
              <div style={{ width: 280, borderTop: "2px solid #6D2323", margin: "0 auto 16px" }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
                {formState.rightSignerName}
              </div>
              <div style={{ fontSize: 14, color: "#4b5563", marginTop: 4 }}>
                {formState.rightSignerPosition}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSignatureField = (side, label) => {
    const preview = side === "left" ? leftSignaturePreview : rightSignaturePreview;
    const nameValue = side === "left" ? formState.leftSignerName : formState.rightSignerName;
    const positionValue = side === "left" ? formState.leftSignerPosition : formState.rightSignerPosition;
    const signatureField = side === "left" ? "leftSignature" : "rightSignature";
    const nameField = side === "left" ? "leftSignerName" : "rightSignerName";
    const positionField = side === "left" ? "leftSignerPosition" : "rightSignerPosition";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>{label} E-signature</label>
          {preview && (
            <button
              type="button"
              onClick={() => {
                if (side === "left") {
                  setLeftSignaturePreview(null);
                } else {
                  setRightSignaturePreview(null);
                }
                updateFormField(signatureField, null);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#dc2626",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Remove
            </button>
          )}
        </div>
        <div
          style={{
            position: "relative",
            border: "1px dashed #d1d5db",
            borderRadius: 8,
            minHeight: 150,
            background: "#fafafa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt={`${label} e-signature`}
              style={{ maxWidth: "100%", maxHeight: 120, objectFit: "contain" }}
            />
          ) : (
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Upload signature</span>
          )}
          <input
            type="file"
            accept="image/png, image/jpeg, image/svg+xml"
            onChange={(event) => handleSignatureUpload(side, event)}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: "pointer",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>{label} Name</label>
          <input
            value={nameValue}
            onChange={(event) => updateFormField(nameField, event.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 13,
              fontFamily: FONT,
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>{label} Position</label>
          <input
            value={positionValue}
            onChange={(event) => updateFormField(positionField, event.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 13,
              fontFamily: FONT,
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "92%",
          maxWidth: 1240,
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh",
          overflow: "hidden",
          boxShadow: "0 20px 45px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 28px",
            borderBottom: "1px solid #e5e7eb",
            background: "#ffffff",
          }}
        >
          <h3 style={{ margin: 0, color: "#6D2323", fontFamily: FONT, fontWeight: 700, fontSize: 20 }}>
            {headerTitle}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#6D2323",
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: FONT,
              fontWeight: 600,
            }}
            disabled={generating}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
            background: "#fdf8ee",
          }}
        >
          {isViewMode ? (
            renderCertificatePreview()
          ) : (
            <div
              style={{
                padding: "32px 36px",
                display: "flex",
                flexDirection: "column",
                gap: 28,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Certificate Body</label>
                <textarea
                  rows={6}
                  value={formState.bodyText}
                  onChange={(event) => updateFormField("bodyText", event.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 13,
                    lineHeight: 1.6,
                    fontFamily: FONT,
                    resize: "vertical",
                    minHeight: 140,
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 24,
                }}
              >
                {renderSignatureField("left", "Left Signer")}
                {renderSignatureField("right", "Right Signer")}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            padding: "16px 28px",
            borderTop: "1px solid #e5e7eb",
            background: "#fff",
          }}
        >
          {isViewMode ? (
            <>
              <button
                onClick={() => setMode("edit")}
                style={{
                  background: "#F59E0B",
                  color: "white",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <PenSquare size={18} /> Edit
              </button>
              <button
                onClick={onSend}
                disabled={participant.certificate_status === "Sent"}
                style={{
                  background:
                    participant.certificate_status === "Sent" ? "#9CA3AF" : "#10B981",
                  color: "white",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: 6,
                  cursor:
                    participant.certificate_status === "Sent" ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <SendIcon size={18} />
                {participant.certificate_status === "Sent" ? "Already Sent" : "Send"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  if (!certificateGenerated) {
                    onClose();
                    return;
                  }
                  const nextState = initializeStateFromParticipant(participant);
                  setFormState(nextState);
                  setLeftSignaturePreview(derivePreviewSource(nextState.leftSignature));
                  setRightSignaturePreview(derivePreviewSource(nextState.rightSignature));
                  setDateIssued(nextState.dateIssued);
                  setMode("view");
                }}
                style={{
                  background: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  color: "#374151",
                  padding: "10px 18px",
                  borderRadius: 6,
                  cursor: generating ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                disabled={generating}
              >
                <XCircle size={18} /> Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  background: generating ? "#9CA3AF" : "#2563EB",
                  color: "white",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: 6,
                  cursor: generating ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Save size={18} />
                {generating
                  ? certificateGenerated
                    ? "Saving..."
                    : "Generating..."
                  : certificateGenerated
                  ? "Update"
                  : "Generate"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}