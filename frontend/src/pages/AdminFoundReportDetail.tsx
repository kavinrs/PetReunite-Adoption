import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";
import { fetchAdminFoundReports, approveFoundPet, rejectFoundPet } from "../services/api";
import Toast from "../components/Toast";

export default function AdminFoundReportDetail() {
  useViewportStandardization();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; title: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      const res = await fetchAdminFoundReports("all");
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
    navigate("/admin?tab=dashboard", { replace: true });
  };

  const handleApprove = async () => {
    if (!report || actionLoading) return;
    setActionLoading(true);
    const res = await approveFoundPet(report.id);
    setActionLoading(false);
    if (res.ok) {
      setToast({ message: "Pet report has been approved and is now visible to users.", type: "success", title: "Approved!" });
      setReport({ ...report, status: "approved" });
      setTimeout(() => handleBack(), 1500);
    } else {
      setToast({ message: res.error || "Failed to approve report", type: "error", title: "Error" });
    }
  };

  const handleReject = async () => {
    if (!report || actionLoading) return;
    setActionLoading(true);
    const res = await rejectFoundPet(report.id);
    setActionLoading(false);
    if (res.ok) {
      setToast({ message: "Pet report has been rejected.", type: "success", title: "Rejected" });
      setReport({ ...report, status: "rejected" });
      setTimeout(() => handleBack(), 1500);
    } else {
      setToast({ message: res.error || "Failed to reject report", type: "error", title: "Error" });
    }
  };

  const backLabel = "Back to Home";

  if (loading) return <div style={{ padding: 32 }}>Loading report...</div>;
  if (error)
    return (
      <div style={{ padding: 32 }}>
        <button type="button" onClick={handleBack} style={{ border: "none", background: "transparent", color: "#2563eb", fontWeight: 700, marginBottom: 16, cursor: "pointer" }}>
          {backLabel}
        </button>
        <div>{error}</div>
      </div>
    );
  if (!report) return null;

  const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "/api";
  const origin = /^https?:/.test(apiBase) ? new URL(apiBase).origin : "http://localhost:8000";
  const raw = report.photo_url || report.photo;
  const photoSrc = raw
    ? String(raw).startsWith("http") ? String(raw) : String(raw).startsWith("/") ? origin + String(raw) : origin + "/media/" + String(raw)
    : null;

  const hasUpdate = report.has_user_update && report.previous_snapshot;

  // Field definitions for comparison
  const comparisonFields = [
    { key: "pet_name", label: "Pet Name", icon: "🐾" },
    { key: "pet_type", label: "Pet Type", icon: "📘" },
    { key: "breed", label: "Breed", icon: "🧬" },
    { key: "gender", label: "Gender", icon: "⚧" },
    { key: "color", label: "Color", icon: "🎨" },
    { key: "weight", label: "Weight", icon: "⚖️" },
    { key: "estimated_age", label: "Est. Age", icon: "🎂" },
    { key: "found_city", label: "Found City", icon: "📍" },
    { key: "state", label: "State", icon: "🗺️" },
    { key: "pincode", label: "Pincode", icon: "🏷️" },
  ];

  const renderFieldCard = (label: string, value: any, icon: string, isChanged?: boolean, bgColor?: string) => (
    <div
      style={{
        background: bgColor || "rgba(248,250,252,0.95)",
        borderRadius: 12,
        padding: 10,
        boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
        border: isChanged ? "2px solid #f87171" : "1px solid rgba(148,163,184,0.2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: isChanged ? "#b91c1c" : "#0f172a" }}>
        {value || <span style={{ color: "#9ca3af" }}>—</span>}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", padding: 32, background: "#f5f7fb", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}>
      {toast && <Toast message={toast.message} type={toast.type} title={toast.title} isVisible={!!toast} onClose={() => setToast(null)} />}
      
      <button type="button" onClick={handleBack} style={{ border: "none", background: "transparent", color: "#2563eb", fontWeight: 700, marginBottom: 16, cursor: "pointer" }}>
        ← {backLabel}
      </button>

      {/* Main Layout - Changes based on whether there's an update */}
      {hasUpdate ? (
        // Three column layout: Image | Previous (with Reported Details below) | Updated
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 1fr", gap: 20, alignItems: "start" }}>
          {/* Left: Photo */}
          <div style={{ background: "white", borderRadius: 20, padding: 12, boxShadow: "0 10px 30px rgba(15,23,42,0.1)" }}>
            {photoSrc ? (
              <img src={photoSrc} alt={report.pet_type || "Pet"} style={{ width: "100%", height: 300, borderRadius: 14, objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: 300, borderRadius: 14, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🐾</div>
            )}
            {/* Header info below image for hasUpdate view */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ padding: "3px 8px", borderRadius: 999, background: "#dbeafe", color: "#1e40af", fontSize: 11, fontWeight: 800 }}>Found Pet</span>
                <span style={{ padding: "3px 8px", borderRadius: 999, background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{report.status}</span>
                {hasUpdate && <span style={{ padding: "3px 8px", borderRadius: 999, background: "#fef3c7", color: "#d97706", fontSize: 10, fontWeight: 700 }}>⚠️ Updated</span>}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Pet ID: <span style={{ fontWeight: 700, color: "#111827" }}>#{report.pet_unique_id || `FP${report.id?.toString().padStart(6, "0")}`}</span></div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>{report.pet_type || "Found Pet"}</div>
              {report.found_city && <div style={{ color: "#6b7280", fontSize: 12 }}>{report.found_city}{report.state ? `, ${report.state}` : ""}</div>}
            </div>
          </div>

          {/* Middle: Previous Details + Reported Details below */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Previous Details */}
            <div style={{ background: "linear-gradient(135deg, rgba(254,243,199,0.9), rgba(254,249,195,0.95))", borderRadius: 20, padding: 16, border: "1px solid rgba(217,119,6,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(217,119,6,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📋</span>
                <span style={{ fontWeight: 800, fontSize: 15, color: "#92400e" }}>Previous Details</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {comparisonFields.map(({ key, label, icon }) => {
                  const prevValue = report.previous_snapshot[key];
                  const currValue = report[key];
                  const isChanged = prevValue !== currValue;
                  return (
                    <div key={key}>
                      {renderFieldCard(label, prevValue, icon, isChanged, isChanged ? "rgba(254,202,202,0.4)" : "rgba(255,255,255,0.8)")}
                    </div>
                  );
                })}
              </div>
              {/* Previous Description */}
              <div style={{ marginTop: 12, background: report.previous_snapshot.description !== report.description ? "rgba(254,202,202,0.4)" : "rgba(255,255,255,0.8)", borderRadius: 12, padding: 12, border: report.previous_snapshot.description !== report.description ? "2px solid #f87171" : "1px solid rgba(148,163,184,0.2)" }}>
                <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 6 }}>Description</div>
                <div style={{ fontSize: 12, color: report.previous_snapshot.description !== report.description ? "#b91c1c" : "#111827", lineHeight: 1.5 }}>
                  {report.previous_snapshot.description || <span style={{ color: "#9ca3af" }}>No description</span>}
                </div>
              </div>
            </div>

            {/* Reported Details - Below Previous Details */}
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ background: "#f9fafb", borderRadius: 16, padding: 14, boxShadow: "0 6px 20px rgba(15,23,42,0.08)", border: "1px solid rgba(226,232,240,0.9)", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(148,163,184,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>👤</span>
                  <span style={{ fontWeight: 800, fontSize: 13, color: "#111827" }}>Reported Details</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: "#fff", borderRadius: 10, padding: 8, boxShadow: "0 2px 6px rgba(148,163,184,0.2)" }}>
                    <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Reported by</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{report.reporter?.username || "Unknown"}{report.reporter?.user_unique_id && ` (${report.reporter.user_unique_id})`}</div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: 10, padding: 8, boxShadow: "0 2px 6px rgba(148,163,184,0.2)" }}>
                    <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Reported on</div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#111827" }}>{report.created_at ? new Date(report.created_at).toLocaleString() : "—"}</div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: 10, padding: 8, boxShadow: "0 2px 6px rgba(148,163,184,0.2)" }}>
                    <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Last updated</div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#111827" }}>{report.updated_at ? new Date(report.updated_at).toLocaleString() : "—"}</div>
                  </div>
                  {report.found_time && (
                    <div style={{ background: "#fff", borderRadius: 10, padding: 8, boxShadow: "0 2px 6px rgba(148,163,184,0.2)" }}>
                      <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Found time</div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: "#111827" }}>{new Date(report.found_time).toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Accept/Reject Buttons - Next to Reported Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={actionLoading}
                  style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: actionLoading ? "#9ca3af" : "#16a34a", color: "white", fontWeight: 700, fontSize: 13, cursor: actionLoading ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(22,163,74,0.3)", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "..." : "✓ Accept Update"}
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={actionLoading}
                  style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: actionLoading ? "#9ca3af" : "#dc2626", color: "white", fontWeight: 700, fontSize: 13, cursor: actionLoading ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(220,38,38,0.3)", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "..." : "✗ Reject Update"}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Updated Details */}
          <div style={{ background: "linear-gradient(135deg, rgba(220,252,231,0.9), rgba(240,253,244,0.95))", borderRadius: 20, padding: 16, border: "1px solid rgba(22,163,74,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(22,163,74,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✨</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: "#166534" }}>Updated Details</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {comparisonFields.map(({ key, label, icon }) => {
                const prevValue = report.previous_snapshot[key];
                const currValue = report[key];
                const isChanged = prevValue !== currValue;
                return (
                  <div key={key}>
                    {renderFieldCard(label, currValue, icon, isChanged, isChanged ? "rgba(187,247,208,0.5)" : "rgba(255,255,255,0.8)")}
                  </div>
                );
              })}
            </div>
            {/* Updated Description */}
            <div style={{ marginTop: 12, background: report.previous_snapshot.description !== report.description ? "rgba(187,247,208,0.5)" : "rgba(255,255,255,0.8)", borderRadius: 12, padding: 12, border: report.previous_snapshot.description !== report.description ? "2px solid #22c55e" : "1px solid rgba(148,163,184,0.2)" }}>
              <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 6 }}>Description</div>
              <div style={{ fontSize: 12, color: report.previous_snapshot.description !== report.description ? "#166534" : "#111827", lineHeight: 1.5 }}>
                {report.description || <span style={{ color: "#9ca3af" }}>No description</span>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Normal two column layout: Image | Details
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)", gap: 24, alignItems: "start" }}>
          {/* Left: Photo */}
          <div style={{ background: "white", borderRadius: 24, padding: 16, boxShadow: "0 20px 50px rgba(15,23,42,0.12)" }}>
            {photoSrc ? (
              <img src={photoSrc} alt={report.pet_type || "Pet"} style={{ width: "100%", borderRadius: 18, objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: 320, borderRadius: 18, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🐾</div>
            )}
          </div>

          {/* Right: Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header info above Pet Details */}
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <span style={{ padding: "4px 10px", borderRadius: 999, background: "#dbeafe", color: "#1e40af", fontSize: 12, fontWeight: 800 }}>Found Pet</span>
                <span style={{ padding: "4px 10px", borderRadius: 999, background: "#dcfce7", color: "#16a34a", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>{report.status}</span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Pet ID: <span style={{ fontWeight: 700, color: "#111827" }}>#{report.pet_unique_id || `FP${report.id?.toString().padStart(6, "0")}`}</span></div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a" }}>{report.pet_type || "Found Pet"}</div>
              {report.found_city && <div style={{ color: "#6b7280", fontSize: 14 }}>{report.found_city}{report.state ? `, ${report.state}` : ""}</div>}
            </div>

            <div style={{ background: "linear-gradient(135deg, rgba(219,234,254,0.85), rgba(239,246,255,0.9))", borderRadius: 24, padding: 18, boxShadow: "0 14px 40px rgba(15,23,42,0.16)", border: "1px solid rgba(148,163,184,0.35)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🐾</span>
                <span style={{ fontWeight: 800, fontSize: 16 }}>Pet Details</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, background: "rgba(255,255,255,0.8)", borderRadius: 18, padding: 14 }}>
                {comparisonFields.map(({ key, label, icon }) => (
                  <div key={key}>{renderFieldCard(label, report[key], icon)}</div>
                ))}
                {renderFieldCard("Has Tag", report.has_tag === "present" ? "Present" : "Not Present", "🏷️")}
                {renderFieldCard("Location URL", report.location_url ? <a href={report.location_url} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>Open Maps</a> : null, "🗺️")}
                {renderFieldCard("Found Time", report.found_time ? new Date(report.found_time).toLocaleString() : null, "⏱️")}
              </div>
              <div style={{ marginTop: 12, background: "rgba(255,255,255,0.9)", borderRadius: 18, padding: 14, border: "1px dashed rgba(148,163,184,0.6)" }}>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>Description</div>
                <div style={{ fontSize: 13, color: "#111827", lineHeight: 1.6 }}>{report.description || <span style={{ color: "#9ca3af" }}>No description</span>}</div>
              </div>
            </div>

            {/* Reported Details - Below Description */}
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ background: "#f9fafb", borderRadius: 18, padding: 14, boxShadow: "0 8px 24px rgba(15,23,42,0.08)", border: "1px solid rgba(226,232,240,0.9)", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(148,163,184,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>👤</span>
                  <span style={{ fontWeight: 800, fontSize: 13, color: "#111827" }}>Reported Details</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  <div style={{ background: "#fff", borderRadius: 12, padding: 10, boxShadow: "0 2px 6px rgba(148,163,184,0.2)" }}>
                    <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Reported by</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{report.reporter?.username || "Unknown"}{report.reporter?.user_unique_id && ` (${report.reporter.user_unique_id})`}</div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: 12, padding: 10, boxShadow: "0 2px 6px rgba(148,163,184,0.2)" }}>
                    <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Reported on</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#111827" }}>{report.created_at ? new Date(report.created_at).toLocaleString() : "—"}</div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: 12, padding: 10, boxShadow: "0 2px 6px rgba(148,163,184,0.2)" }}>
                    <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Last updated</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#111827" }}>{report.updated_at ? new Date(report.updated_at).toLocaleString() : "—"}</div>
                  </div>
                  {report.found_time && (
                    <div style={{ background: "#fff", borderRadius: 12, padding: 10, boxShadow: "0 2px 6px rgba(148,163,184,0.2)" }}>
                      <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>Found time</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#111827" }}>{new Date(report.found_time).toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Accept/Reject Buttons */}
              {report.status === "pending" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: actionLoading ? "#9ca3af" : "#16a34a", color: "white", fontWeight: 700, fontSize: 13, cursor: actionLoading ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(22,163,74,0.3)", whiteSpace: "nowrap" }}
                  >
                    {actionLoading ? "..." : "✓ Accept"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={actionLoading}
                    style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: actionLoading ? "#9ca3af" : "#dc2626", color: "white", fontWeight: 700, fontSize: 13, cursor: actionLoading ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(220,38,38,0.3)", whiteSpace: "nowrap" }}
                  >
                    {actionLoading ? "..." : "✗ Reject"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
