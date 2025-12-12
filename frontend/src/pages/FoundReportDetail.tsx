import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";

export default function FoundReportDetail() {
  useViewportStandardization();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const report = (location.state as any)?.report;

  const handleBack = () => {
    navigate("/user", { state: { tab: "activity" } });
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
          ← Back to activity
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

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 40,
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
          fontWeight: 800,
          marginBottom: 20,
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        ← Back to activity
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2.2fr) minmax(0, 3fr)",
          gap: 32,
          alignItems: "flex-start",
        }}
      >
        {/* Image column */}
        <div
          style={{
            background: "white",
            borderRadius: 28,
            padding: 18,
            boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
          }}
        >
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={report.pet_name || report.pet_type || "Pet"}
              style={{
                width: "100%",
                borderRadius: 22,
                objectFit: "cover",
                objectPosition: "center top",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: 360,
                borderRadius: 22,
                background: "#e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
              }}
            >
              🐾
            </div>
          )}
        </div>

        {/* Details column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Header block */}
          <div
            style={{
              background: "white",
              borderRadius: 22,
              padding: 18,
              boxShadow: "0 18px 45px rgba(15,23,42,0.12)",
            }}
          >
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
                  padding: "4px 12px",
                  borderRadius: 999,
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                Found Pet
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#6b7280",
                marginBottom: 4,
              }}
            >
              Pet ID: <span style={{ fontWeight: 700, color: "#111827" }}>#{report.id}</span>
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              {report.pet_name || report.pet_type || "Found Pet"}
            </div>
            {(report.found_city || report.city || report.state) && (
              <div
                style={{
                  marginTop: 6,
                  color: "#6b7280",
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                {report.found_city || report.city}
                {report.state ? `, ${report.state}` : ""}
              </div>
            )}
          </div>

          {/* Report info */}
          <div
            style={{
              background: "white",
              borderRadius: 22,
              padding: 18,
              boxShadow: "0 14px 36px rgba(15,23,42,0.10)",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: 10,
                fontSize: 18,
              }}
            >
              Report Information
            </div>
            <div
              style={{
                fontSize: 15,
                color: "#6b7280",
                display: "grid",
                gap: 6,
              }}
            >
              {report.created_at && (
                <div>
                  <strong>Found on:</strong>{" "}
                  {new Date(report.created_at).toLocaleString()}
                </div>
              )}
              {report.found_time && (
                <div>
                  <strong>Found time:</strong>{" "}
                  {new Date(report.found_time).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Pet details */}
          <div
            style={{
              background: "white",
              borderRadius: 22,
              padding: 18,
              boxShadow: "0 16px 40px rgba(15,23,42,0.12)",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 18 }}>Pet Details</div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: 14,
              }}
            >
              {([
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
                      fontSize: 14,
                      color: "#6b7280",
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {key === "location_url" && report[key]
                      ? (
                          <a
                            href={String(report[key]).startsWith("http")
                              ? String(report[key])
                              : `https://www.google.com/maps?q=${encodeURIComponent(String(report[key]))}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#2563eb" }}
                          >
                            Open in Google Maps
                          </a>
                        )
                      : report[key] || (
                          <span style={{ color: "#9ca3af" }}>—</span>
                        )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  marginBottom: 4,
                }}
              >
                Description
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: "#111827",
                  lineHeight: 1.7,
                }}
              >
                {report.description || (
                  <span style={{ color: "#9ca3af" }}>No description</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
