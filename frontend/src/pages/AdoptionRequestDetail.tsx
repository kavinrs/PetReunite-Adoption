import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";
import { updateAdoptionRequestStatus, fetchAllAdoptionRequests } from "../services/api";
import Toast from "../components/Toast";

export default function AdoptionRequestDetail() {
  useViewportStandardization();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const passedRequest = (location.state as any)?.request;
  const isAdmin = (location.state as any)?.isAdmin || location.pathname.startsWith("/admin");
  const fromPage = (location.state as any)?.from;

  const [request, setRequest] = useState<any>(passedRequest || null);
  const [loading, setLoading] = useState(!passedRequest);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
    isVisible: boolean;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(passedRequest?.status || "pending");

  // Fetch request data if not passed via state
  useEffect(() => {
    if (passedRequest) {
      setRequest(passedRequest);
      setCurrentStatus(passedRequest.status || "pending");
      return;
    }

    async function loadRequest() {
      setLoading(true);
      setError(null);
      const res = await fetchAllAdoptionRequests();
      if (res.ok) {
        const requests = res.data as any[];
        const found = requests.find((r: any) => String(r.id) === String(id));
        if (found) {
          setRequest(found);
          setCurrentStatus(found.status || "pending");
        } else {
          setError("Adoption request not found");
        }
      } else {
        setError(res.error || "Failed to load adoption request");
      }
      setLoading(false);
    }

    loadRequest();
  }, [id, passedRequest]);

  const handleBack = () => {
    if (fromPage === "pending-approvals") {
      navigate("/admin/pending-approvals");
    } else if (isAdmin) {
      navigate("/admin?tab=adoptions");
    } else {
      navigate("/user", { state: { tab: "activity", subtab: "adoption" } });
    }
  };

  if (loading) {
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
          ← Back
        </button>
        <div>Loading adoption request details...</div>
      </div>
    );
  }

  if (error || !request) {
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
          ← Back
        </button>
        <div>
          {error || `Unable to load adoption request details for ID ${id}. Please return and try again.`}
        </div>
      </div>
    );
  }

  const pet = request.pet || {};
  const requester = request.requester || {};

  const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "/api";
  const origin = /^https?:/.test(apiBase)
    ? new URL(apiBase).origin
    : "http://localhost:8000";
  const raw = pet.photos || pet.photo || pet.photo_url;
  const photoSrc = raw
    ? String(raw).startsWith("http")
      ? String(raw)
      : String(raw).startsWith("/")
        ? origin + String(raw)
        : origin + "/media/" + String(raw)
    : null;

  const fieldIcons: Record<string, string> = {
    name: "🐶",
    species: "📘",
    breed: "🧬",
    gender: "⚧",
    color: "🎨",
    age: "🎂",
    location_city: "📍",
    location_state: "🗺️",
  };

  const handleAccept = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const res = await updateAdoptionRequestStatus(request.id, { status: "approved" });
      if (res.ok) {
        setCurrentStatus("approved");
        setToast({
          type: "success",
          title: "Request Approved",
          message: "The adoption request has been approved successfully.",
          isVisible: true,
        });
        // Navigate back after a short delay
        setTimeout(() => {
          if (fromPage === "pending-approvals") {
            navigate("/admin/pending-approvals");
          } else {
            navigate("/admin?tab=adoptions");
          }
        }, 1500);
      } else {
        setToast({
          type: "error",
          title: "Error",
          message: res.error || "Failed to approve request",
          isVisible: true,
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const res = await updateAdoptionRequestStatus(request.id, { status: "rejected" });
      if (res.ok) {
        setCurrentStatus("rejected");
        setToast({
          type: "success",
          title: "Request Rejected",
          message: "The adoption request has been rejected.",
          isVisible: true,
        });
        // Navigate back after a short delay
        setTimeout(() => {
          if (fromPage === "pending-approvals") {
            navigate("/admin/pending-approvals");
          } else {
            navigate("/admin?tab=adoptions");
          }
        }, 1500);
      } else {
        setToast({
          type: "error",
          title: "Error",
          message: res.error || "Failed to reject request",
          isVisible: true,
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const st = (status || "").toLowerCase();
    switch (st) {
      case "pending":
        return { color: "#f59e0b", bg: "#fef3c7", text: "Pending" };
      case "approved":
        return { color: "#10b981", bg: "#d1fae5", text: "Approved" };
      case "rejected":
        return { color: "#ef4444", bg: "#fee2e2", text: "Rejected" };
      default:
        return { color: "#6b7280", bg: "#f3f4f6", text: status || "Unknown" };
    }
  };

  const statusBadge = getStatusBadge(currentStatus);

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
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={() => setToast(null)}
        />
      )}

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
        Back
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
              alt={pet.name || "Pet"}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 18,
                objectFit: "cover",
                minHeight: 400,
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: 400,
                borderRadius: 18,
                background: "#e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 64,
              }}
            >
              🐾
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
          {/* Header block */}
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
                    background: "#dcfce7",
                    color: "#16a34a",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  🏠 Adoption Request
                </span>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: statusBadge.bg,
                    color: statusBadge.color,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {statusBadge.text}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>
                Pet ID:{" "}
                <span style={{ fontWeight: 700, color: "#111827" }}>
                  #{pet.pet_unique_id || `AP${pet.id?.toString().padStart(6, "0")}`}
                </span>
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {pet.name || "Pet"}
              </div>
              {(pet.location_city || pet.location_state) && (
                <div style={{ marginTop: 4, color: "#6b7280", fontSize: 14 }}>
                  {pet.location_city}
                  {pet.location_state ? `, ${pet.location_state}` : ""}
                </div>
              )}
            </div>
          </div>

          {/* Pet Details card */}
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(220,252,231,0.85), rgba(240,253,244,0.9))",
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
                  background: "rgba(34,197,94,0.12)",
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
                Pet Details
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 14,
                background: "rgba(255,255,255,0.9)",
                borderRadius: 18,
                padding: 14,
              }}
            >
              {([
                ["name", "Pet Name", pet.name],
                ["species", "Species", pet.species],
                ["breed", "Breed", pet.breed],
                ["gender", "Gender", pet.gender],
                ["color", "Color", pet.color],
                ["age", "Age", pet.age],
                ["location_city", "City", pet.location_city],
                ["location_state", "State", pet.location_state],
              ] as const).map(([key, label, value]) => (
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
                    <span style={{ fontSize: 18, lineHeight: 1 }}>
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
                        }}
                      >
                        {value || <span style={{ color: "#9ca3af" }}>—</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
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
                {pet.description || (
                  <span style={{ color: "#9ca3af" }}>No description</span>
                )}
              </div>
            </div>
          </div>


          {/* Requester Details */}
          <div
            style={{
              background: "#f9fafb",
              borderRadius: 18,
              padding: 14,
              boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
              border: "1px solid rgba(226,232,240,0.9)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
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
                Requester Details
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 10,
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 10,
                  boxShadow: "0 3px 8px rgba(148,163,184,0.25)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                  }}
                >
                  Requested By
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                  {requester.username || "—"}
                </div>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 10,
                  boxShadow: "0 3px 8px rgba(148,163,184,0.25)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                  }}
                >
                  Email
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                  {requester.email || "—"}
                </div>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 10,
                  boxShadow: "0 3px 8px rgba(148,163,184,0.25)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                  }}
                >
                  Phone
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                  {request.phone || "—"}
                </div>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 10,
                  boxShadow: "0 3px 8px rgba(148,163,184,0.25)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                  }}
                >
                  Requested On
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                  {request.created_at
                    ? new Date(request.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—"}
                </div>
              </div>
            </div>

            {/* Additional request details */}
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 10,
                  boxShadow: "0 3px 8px rgba(148,163,184,0.25)",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                  }}
                >
                  Address
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                  {request.address || "—"}
                </div>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 10,
                  boxShadow: "0 3px 8px rgba(148,163,184,0.25)",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                  }}
                >
                  Reason for Adopting
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.5 }}>
                  {request.reason_for_adopting || "—"}
                </div>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 10,
                  boxShadow: "0 3px 8px rgba(148,163,184,0.25)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontWeight: 700,
                  }}
                >
                  Experience with Pets
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.5 }}>
                  {request.experience_with_pets || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Admin Actions - Accept/Reject buttons */}
          {isAdmin && currentStatus === "pending" && (
            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 8,
              }}
            >
              <button
                onClick={handleAccept}
                disabled={processing}
                style={{
                  flex: 1,
                  padding: "14px 24px",
                  borderRadius: 12,
                  border: "none",
                  background: processing
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #10b981, #34d399)",
                  color: "white",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: processing ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                  transition: "all 0.2s ease",
                }}
              >
                {processing ? "Processing..." : "✓ Accept Request"}
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                style={{
                  flex: 1,
                  padding: "14px 24px",
                  borderRadius: 12,
                  border: "none",
                  background: processing
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #ef4444, #f87171)",
                  color: "white",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: processing ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
                  transition: "all 0.2s ease",
                }}
              >
                {processing ? "Processing..." : "✗ Reject Request"}
              </button>
            </div>
          )}

          {/* Show status message if already processed */}
          {currentStatus !== "pending" && (
            <div
              style={{
                padding: "16px 20px",
                borderRadius: 12,
                background: currentStatus === "approved" ? "#d1fae5" : "#fee2e2",
                color: currentStatus === "approved" ? "#065f46" : "#991b1b",
                fontSize: 14,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              This adoption request has been {currentStatus === "approved" ? "approved" : "rejected"}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
