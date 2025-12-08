import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";
import { fetchAdminLostReports } from "../services/api";

export default function AdminLostReportDetail() {
  useViewportStandardization();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
    navigate("/admin?tab=lost");
  };

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
          〉 Back to lost reports
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
        〉 Back to lost reports
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 24,
            padding: 16,
            boxShadow: "0 20px 50px rgba(15,23,42,0.12)",
          }}
        >
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={report.pet_name || report.pet_type || "Pet"}
              style={{
                width: "100%",
                borderRadius: 18,
                objectFit: "cover",
                objectPosition: "center top",
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
              <span role="img" aria-label="No photo">
                �
              </span>{" "}
              No photo
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
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
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {report.pet_name || report.pet_type || "Lost Pet"}
              </div>
              {(report.city || report.state) && (
                <div style={{ marginTop: 4, color: "#6b7280", fontSize: 14 }}>
                  {report.city}
                  {report.state ? `, ${report.state}` : ""}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: 16,
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Upload Information</div>
            <div style={{ fontSize: 12, color: "#6b7280", display: "grid", gap: 4 }}>
              {report.created_at && (
                <div>
                  <strong>Reported on:</strong> {new Date(report.created_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: 16,
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ fontWeight: 700 }}>Pet Details</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              {([
                ["pet_name", "Pet Name"],
                ["pet_type", "Pet Type"],
                ["breed", "Breed"],
                ["color", "Color"],
                ["weight", "Weight"],
                ["vaccinated", "Vaccinated"],
                ["age", "Age (years)"],
                ["city", "City"],
                ["state", "State"],
                ["pincode", "Pincode"],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                    {report[key] || <span style={{ color: "#9ca3af" }}>—</span>}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                Description
              </div>
              <div style={{ fontSize: 13, color: "#111827" }}>
                {report.description || <span style={{ color: "#9ca3af" }}>No description</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
