import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";
import { fetchAdminLostReports } from "../services/api";

export default function AdminLostReportDetail() {
  useViewportStandardization();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      const res = await fetchAdminLostReports("all");
      if (res.ok) {
        const list = (res.data as any[]) ?? [];
        const found = list.find((r) => String(r.id) === String(id));
        if (!found) {
          setError("Report not found");
        } else {
          setReport(found);
        }
      } else {
        setError(res.error || "Failed to load report");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleBack = () => {
    const from = (location.state as any)?.from;
    if (from === "admin-map") {
      navigate("/admin?tab=stats", { state: { openMap: true } });
    } else if (from === "admin-chat-requests") {
      navigate("/admin?tab=chat&view=requests", { replace: true });
    } else if (from === "admin-lost") {
      navigate("/admin?tab=lost", { replace: true });
    } else if (from === "pending-approvals") {
      navigate("/admin/pending-approvals");
    } else if (from === "pets") {
      navigate("/admin?tab=pets", { replace: true });
    } else {
      navigate("/admin?tab=lost", { replace: true });
    }
  };

  const backLabel =
    (location.state as any)?.from === "pending-approvals"
      ? "Back to Pending Approvals"
      : (location.state as any)?.from === "admin-chat-requests"
      ? "Back"
      : "Back to Pets";

  if (loading) return <div style={{ padding: 32 }}>Loading report...</div>;
  if (error)
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
          }}
        >
          {backLabel}
        </button>
        <div>{error}</div>
      </div>
    );
  if (!report) return null;

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
    "Pet Name": "🐶",
    "Pet Type": "📘",
    "Breed": "🧬",
    "Gender": "⚧",
    "Color": "🎨",
    "Weight": "⚖️",
    "Vaccinated": "💉",
    "Age (years)": "🎂",
    "City": "📍",
    "State": "🗺️",
    "Pincode": "🏷️",
    "Location URL": "🗺️",
    "Lost Time": "⏱️",
  };

  const fields = [
    ["Pet Name", report.pet_name],
    ["Pet Type", report.pet_type],
    ["Breed", report.breed],
    ["Gender", report.gender],
    ["Color", report.color],
    ["Weight", report.weight],
    ["Vaccinated", report.vaccinated],
    ["Age (years)", report.age],
    ["City", report.city],
    ["State", report.state],
    ["Pincode", report.pincode],
    ["Location URL", report.location_url],
    ["Lost Time", report.lost_time ? new Date(report.lost_time).toLocaleString() : null],
  ];

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
        {backLabel}
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
          gap: 24,
          alignItems: "stretch",
        }}
      >
        {/* Left: Photo */}
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

        {/* Right: Details */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Header */}
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
                  background: "#fee2e2",
                  color: "#b91c1c",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Lost Pet
              </span>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#dcfce7",
                  color: "#16a34a",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {report.status}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>
              Pet ID:{" "}
              <span style={{ fontWeight: 700, color: "#111827" }}>
                #{report.pet_unique_id || `LP${report.id?.toString().padStart(6, "0")}`}
              </span>
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              {report.pet_name || report.pet_type || "Lost Pet"}
            </div>
            {report.city && (
              <div style={{ marginTop: 4, color: "#6b7280", fontSize: 14 }}>
                {report.city}
                {report.state ? `, ${report.state}` : ""}
              </div>
            )}
          </div>

          {/* Reported on */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 14,
              boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
            }}
          >
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Reported on:{" "}
              <span style={{ fontWeight: 700, color: "#111827" }}>
                {report.created_at
                  ? new Date(report.created_at).toLocaleString()
                  : "—"}
              </span>
            </div>
          </div>

          {/* Pet Details */}
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(219,234,254,0.85), rgba(239,246,255,0.9))",
              borderRadius: 24,
              padding: 18,
              boxShadow: "0 14px 40px rgba(15,23,42,0.16)",
              border: "1px solid rgba(148,163,184,0.35)",
            }}
          >
            {/* Pets Details Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#0f172a",
                marginBottom: 12,
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
                }}
              >
                Pets Details
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
                background: "rgba(255,255,255,0.8)",
                borderRadius: 18,
                padding: 14,
              }}
            >
              {fields.map(([label, value]) => (
                <div key={label}>
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
                      {fieldIcons[label] || "📌"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: 0.6,
                          fontWeight: 700,
                          marginBottom: 2,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {label === "Location URL" && value ? (
                          <a
                            href={
                              String(value).startsWith("http")
                                ? String(value)
                                : `https://www.google.com/maps?q=${encodeURIComponent(String(value))}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#2563eb" }}
                          >
                            Open in Google Maps
                          </a>
                        ) : value ? (
                          String(value)
                        ) : (
                          <span style={{ color: "#9ca3af" }}>—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div
              style={{
                marginTop: 12,
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
                  marginBottom: 6,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                Description
              </div>
              <div style={{ fontSize: 13, color: "#111827", lineHeight: 1.6 }}>
                {report.description || (
                  <span style={{ color: "#9ca3af" }}>No description</span>
                )}
              </div>
            </div>
          </div>

          {/* Reported Details */}
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
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 10,
                }}
              >
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
                        {report.reporter?.username || "Unknown"}
                      </div>
                    </div>
                  </div>
                </div>

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
                        {report.created_at
                          ? new Date(report.created_at).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>

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
                        {report.updated_at
                          ? new Date(report.updated_at).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {report.lost_time && (
                  <div>
                    <div
                      style={{
                        background: "#ffffff",
                        borderRadius: 12,
                        padding: 8,
                        boxShadow:
                          "0 3px 8px rgba(148,163,184,0.25)",
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
                          Lost time
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          {new Date(report.lost_time).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
