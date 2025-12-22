import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";
import { createChatConversationWithPet } from "../services/api";
import Toast from "../components/Toast";
import { markRequestAsSent, isRequestSent, cleanupOldRequests } from "../utils/requestTracker";

export default function FoundReportDetail() {
  useViewportStandardization();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const report = (location.state as any)?.report;
  const fromHome = (location.state as any)?.from === "home";

  const handleBack = () => {
    if (fromHome) {
      navigate("/user");
    } else {
      navigate("/user", { state: { tab: "activity" } });
    }
  };

  if (!report) {
    return (
      <div style={{ padding: 32 }}>
        <button
          type="button"
          onClick={handleBack}
          style={{
            border: "none",
            background: "transparent",
            color: "#2563eb",
            fontWeight: 700,
            marginBottom: 16,
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          ← {fromHome ? "Back" : "Back to activity"}
        </button>
        <div>
          Unable to load found pet details for ID {id}. Please return to the
          dashboard and open the card again.
        </div>
      </div>
    );
  }

  const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "/api";
  const origin = /^https?:/.test(apiBase)
    ? new URL(apiBase).origin
    : "http://localhost:8000";
  const raw = report.photo_url || report.photo;
  const photoSrc = raw
    ? String(raw).startsWith("http")
      ? String(raw)
      : String(raw).startsWith("/")
        ? origin + String(raw)
        : origin + "/media/" + String(raw)
    : null;

  const fieldIcons: Record<string, string> = {
    has_tag: "🏷️",
    pet_name: "🐶",
    pet_type: "📘",
    breed: "🧬",
    gender: "⚧",
    color: "🎨",
    weight: "⚖️",
    estimated_age: "🎂",
    found_city: "📍",
    state: "🗺️",
    pincode: "🏷️",
    location_url: "🗺️",
  };

  const [claimMessage, setClaimMessage] = useState("");
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  
  // State for request tracking and toast
  const [requestSent, setRequestSent] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
    isVisible: boolean;
  } | null>(null);

  // Get unique pet identifier for tracking requests
  const petUniqueId = (report as any)?.pet_unique_id || `FP${report?.id?.toString().padStart(6, "0")}`;

  // Check if request was already sent (persist across page refreshes)
  useEffect(() => {
    if (petUniqueId) {
      // Clean up old requests on component mount
      cleanupOldRequests();
      
      // Check if request was already sent
      if (isRequestSent(petUniqueId)) {
        // setRequestSent(true); // Commented out to keep "Request to Reunite" button visible
      }
    }
  }, [petUniqueId]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && claimModalOpen) {
        setClaimModalOpen(false);
      }
    };

    if (claimModalOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [claimModalOpen]);

  async function handleRequestToReunite(e: React.FormEvent) {
    e.preventDefault();
    setClaimStatus(null);
    const trimmed = claimMessage.trim();
    if (!trimmed) {
      setClaimStatus("Please describe how you are connected to this pet.");
      return;
    }
    
    // Prevent double submission
    if (claimSubmitting) return;
    
    try {
      setClaimSubmitting(true);
      const res = await createChatConversationWithPet({
        pet_unique_id: petUniqueId,
        pet_name: report.pet_name || report.pet_type || "Found pet",
        pet_kind: "found",
        reason_for_chat: trimmed,
      });
      
      if (res.ok) {
        // Mark request as sent and persist in localStorage (but don't change UI state)
        // setRequestSent(true); // Commented out to keep "Request to Reunite" button visible
        markRequestAsSent(petUniqueId, report.pet_name || report.pet_type || "Found pet");
        
        // Close modal immediately
        setClaimModalOpen(false);
        setClaimMessage("");
        setClaimStatus(null);
        
        // Show success toast
        setToast({
          type: "success",
          title: "Request Sent",
          message: "Your request has been successfully sent to the admin",
          isVisible: true,
        });
      } else {
        // Show error toast
        setToast({
          type: "error",
          title: "Request Failed",
          message: res.error || "Failed to send request. Please try again.",
          isVisible: true,
        });
      }
    } finally {
      setClaimSubmitting(false);
    }
  }

  const showToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ type, title, message, isVisible: true });
  };

  const hideToast = () => {
    setToast(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 32,
        background: "#f5f7fb",
        fontFamily: "Inter, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <button
        type="button"
        onClick={handleBack}
        style={{
          border: "none",
          background: "transparent",
          color: "#2563eb",
          fontWeight: 700,
          marginBottom: 16,
          cursor: "pointer",
        }}
      >
        {fromHome ? "Back" : "Back to activity"}
      </button>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
          gap: 24,
          alignItems: "stretch",
        }}
      >
        {/* Left: photo */}
        <div
          style={{
            background: "white",
            borderRadius: 24,
            padding: 16,
            boxShadow: "0 20px 50px rgba(15,23,42,0.12)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={report.pet_name || report.pet_type || "Pet"}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 18,
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: 320,
                borderRadius: 18,
                background: "#e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              🐾 No photo
            </div>
          )}
        </div>

        {/* Right: details */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Header block, matching LostReportDetail */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 8,
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "#dbeafe",
                    color: "#1d4ed8",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  Found Pet
                </span>
                {report.status && (
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "#dcfce7",
                      color: "#16a34a",
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "capitalize",
                    }}
                  >
                    {report.status}
                  </span>
                )}
              </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>
              Pet ID:{" "}
              <span style={{ fontWeight: 700, color: "#111827" }}>
                #{(report as any).pet_unique_id || `FP${report.id.toString().padStart(6, "0")}`}
              </span>
            </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {report.pet_name || report.pet_type || "Found Pet"}
              </div>
              {(report.found_city || report.city || report.state) && (
                <div style={{ marginTop: 4, color: "#6b7280", fontSize: 14 }}>
                  {report.found_city || report.city}
                  {report.state ? `, ${report.state}` : ""}
                </div>
              )}
            </div>
          </div>

          {/* Pets Details + Description card (same structure as lost) */}
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(219,234,254,0.85), rgba(239,246,255,0.9))",
              borderRadius: 24,
              padding: 18,
              boxShadow: "0 16px 44px rgba(15,23,42,0.16)",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              border: "1px solid rgba(148,163,184,0.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "999px",
                  background: "rgba(59,130,246,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                🐾
              </span>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 16,
                  letterSpacing: 0.2,
                  color: "#000000",
                }}
              >
                Pets Details
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: 14,
                background: "rgba(255,255,255,0.9)",
                borderRadius: 18,
                padding: 14,
              }}
            >
              {([
                ["has_tag", "Tag"],
                ["pet_name", "Pet Name"],
                ["pet_type", "Pet Type"],
                ["breed", "Breed"],
                ["gender", "Gender"],
                ["color", "Color"],
                ["weight", "Weight"],
                ["estimated_age", "Estimated Age"],
                ["found_city", "Found City"],
                ["state", "State"],
                ["pincode", "Pincode"],
                ["location_url", "Location URL"],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <div
                    style={{
                      background: "rgba(248,250,252,0.95)",
                      borderRadius: 14,
                      padding: 10,
                      boxShadow: "0 4px 10px rgba(15,23,42,0.08)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 18,
                        lineHeight: 1,
                      }}
                    >
                      {fieldIcons[key] || "📌"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          marginBottom: 2,
                          textTransform: "uppercase",
                          letterSpacing: 0.6,
                          fontWeight: 700,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "#000000",
                          WebkitTextFillColor: "#000000",
                          opacity: 1,
                        }}
                      >
                        {key === "has_tag"
                          ? (
                              <span style={{ color: "#000000", fontWeight: 800 }}>
                                {report[key] === "present" ? "Present" : "Not Present"}
                              </span>
                            )
                          : key === "pet_name"
                            ? (
                                <span style={{ color: "#000000", fontWeight: 800 }}>
                                  {report.has_tag === "present" && report[key] 
                                    ? report[key] 
                                    : <span style={{ color: "#9ca3af" }}>—</span>}
                                </span>
                              )
                            : key === "location_url" && report[key]
                              ? (
                                  <a
                                    href={String(report[key]).startsWith("http")
                                      ? String(report[key])
                                      : `https://www.google.com/maps?q=${encodeURIComponent(
                                          String(report[key]),
                                        )}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: "#2563eb", fontWeight: 600 }}
                                  >
                                    Open in Google Maps
                                  </a>
                                )
                              : key === "weight" && report[key]
                                ? (
                                    <span style={{ color: "#000000", fontWeight: 800 }}>
                                      {report[key]}kg
                                    </span>
                                  )
                                : key === "estimated_age" && report[key]
                                  ? (
                                      <span style={{ color: "#000000", fontWeight: 800 }}>
                                        {report[key]} years
                                      </span>
                                    )
                                  : (
                                      <span style={{ color: "#000000", fontWeight: 800 }}>
                                        {report[key] || <span style={{ color: "#9ca3af" }}>—</span>}
                                      </span>
                                    )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 8,
                background: "rgba(255,255,255,0.9)",
                borderRadius: 18,
                padding: 14,
                border: "1px dashed rgba(148,163,184,0.6)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 4,
                  fontWeight: 700,
                }}
              >
                Description
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#111827",
                  lineHeight: 1.6,
                }}
              >
                {report.description || (
                  <span style={{ color: "#9ca3af" }}>No description</span>
                )}
              </div>
            </div>
          </div>

          {/* Reported Details card, aligned with LostReportDetail */}
          <div
            style={{
              marginTop: 8,
              display: "flex",
              justifyContent: "flex-start",
            }}
          >
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 18,
                padding: 14,
                boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                border: "1px solid rgba(226,232,240,0.9)",
                width: "100%",
                maxWidth: 520,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "999px",
                    background: "rgba(148,163,184,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    color: "#4b5563",
                  }}
                >
                  👤
                </span>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 13,
                    color: "#111827",
                    letterSpacing: 0.3,
                  }}
                >
                  Reported Details
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 10,
                }}
              >
                {/* Reported by */}
                <div>
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: 12,
                      padding: 8,
                      boxShadow: "0 3px 8px rgba(148,163,184,0.25)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>👤</span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          fontWeight: 700,
                          marginBottom: 2,
                        }}
                      >
                        Reported by
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {(() => {
                          const r = report as any;
                          const fromRoot =
                            r.reporter_full_name ||
                            r.reporter_name ||
                            r.reporter_username;
                          const userId = r.reporter?.user_unique_id || r.user?.user_unique_id || null;
                          
                          let displayName = "";
                          if (fromRoot) {
                            displayName = fromRoot;
                          } else {
                            const nested = r.reporter || r.user || null;
                            if (nested && typeof nested === "object") {
                              displayName = nested.full_name || nested.username || nested.email || "You";
                            } else if (nested && typeof nested !== "object") {
                              displayName = String(nested);
                            } else {
                              displayName = "You";
                            }
                          }
                          
                          return userId ? `${displayName} (${userId})` : displayName;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reported on */}
                {report.created_at && (
                  <div>
                    <div
                      style={{
                        background: "#ffffff",
                        borderRadius: 12,
                        padding: 8,
                        boxShadow: "0 3px 8px rgba(148,163,184,0.25)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 16, lineHeight: 1 }}>📅</span>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            fontWeight: 700,
                            marginBottom: 2,
                          }}
                        >
                          Reported on
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          {new Date(report.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Last updated */}
                {report.updated_at && (
                  <div>
                    <div
                      style={{
                        background: "#ffffff",
                        borderRadius: 12,
                        padding: 8,
                        boxShadow: "0 3px 8px rgba(148,163,184,0.25)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 16, lineHeight: 1 }}>🔁</span>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            fontWeight: 700,
                            marginBottom: 2,
                          }}
                        >
                          Last updated
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          {new Date(report.updated_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Found time */}
                {report.found_time && (
                  <div>
                    <div
                      style={{
                        background: "#ffffff",
                        borderRadius: 12,
                        padding: 8,
                        boxShadow: "0 3px 8px rgba(148,163,184,0.25)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 16, lineHeight: 1 }}>⏱</span>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            fontWeight: 700,
                            marginBottom: 2,
                          }}
                        >
                          Found time
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          {new Date(report.found_time).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

             {/* Request to Reunite – button only; opens centered modal */}
             <div
               style={{
                 marginTop: 24, // clear separation from Reported Details
               }}
             >
               {requestSent ? (
                 <div
                   style={{
                     borderRadius: 999,
                     border: "1px solid #d1fae5",
                     padding: "10px 18px",
                     background: "#f0fdf4",
                     color: "#166534",
                     fontSize: 13,
                     fontWeight: 700,
                     display: "inline-flex",
                     alignItems: "center",
                     gap: 8,
                   }}
                 >
                   <span>✓ Request Sent - Waiting for Admin Response</span>
                 </div>
               ) : (
                 <button
                   type="button"
                   onClick={() => {
                     if (!requestSent) {
                       setClaimStatus(null);
                       setClaimModalOpen(true);
                     }
                   }}
                   style={{
                     borderRadius: 999,
                     border: "none",
                     padding: "10px 18px",
                     background: "#e9dcc8",
                     color: "#5b3b1a",
                     fontSize: 13,
                     fontWeight: 700,
                     cursor: "pointer",
                     boxShadow: "0 2px 6px rgba(15,23,42,0.15)",
                     display: "inline-flex",
                     alignItems: "center",
                     gap: 8,
                   }}
                 >
                   <span>🤝 Request to Reunite</span>
                 </button>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      )}

      {/* Centered modal for Request to Reunite */}
      {claimModalOpen && !requestSent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget) {
              setClaimModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reunite-modal-title"
            style={{
              background: "white",
              borderRadius: 18,
              padding: 24,
              width: "100%",
              maxWidth: 520,
              boxShadow: "0 24px 60px rgba(15,23,42,0.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <h2
                id="reunite-modal-title"
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Request Chat – Claim This Pet
              </h2>
              <button
                type="button"
                onClick={() => setClaimModalOpen(false)}
                aria-label="Close"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "#6b7280",
                }}
              >
                ×
              </button>
            </div>

            <p
              style={{
                fontSize: 13,
                color: "#4b5563",
                marginBottom: 12,
              }}
            >
              If you believe this is your pet, describe your connection and any
              identifying details below. Our admin team will review your request
              and may start a secure chat to verify ownership before sharing any
              contact information.
            </p>

            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#374151",
                display: "block",
                marginBottom: 4,
              }}
            >
              Your Message
            </label>
            <textarea
              value={claimMessage}
              onChange={(e) => setClaimMessage(e.target.value)}
              rows={5}
              required
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                fontSize: 13,
                resize: "vertical",
                background: "#f9fafb",
                color: "#111827",
                marginBottom: 8,
              }}
              placeholder="Explain how you know this pet, including unique marks, past photos, vet or microchip records, etc."
            />



            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setClaimModalOpen(false)}
                style={{
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  padding: "8px 14px",
                  background: "white",
                  color: "#374151",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestToReunite}
                disabled={claimSubmitting || !claimMessage.trim()}
                style={{
                  borderRadius: 999,
                  border: "none",
                  padding: "8px 16px",
                  background: claimSubmitting || !claimMessage.trim()
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #f97316, #ea580c, #c2410c)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: claimSubmitting || !claimMessage.trim() ? "not-allowed" : "pointer",
                  boxShadow: claimSubmitting || !claimMessage.trim() 
                    ? "none" 
                    : "0 10px 22px rgba(248,113,113,0.45)",
                  opacity: claimSubmitting || !claimMessage.trim() ? 0.6 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                {claimSubmitting ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
