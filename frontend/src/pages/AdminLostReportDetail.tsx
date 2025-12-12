import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";
import { fetchAdminLostReports, updateAdminLostReport } from "../services/api";

export default function AdminLostReportDetail() {
  useViewportStandardization();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<null | "accept" | "reject">(
    null,
  );

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
    } else if (from === "admin-lost") {
      navigate("/admin?tab=lost", { replace: true });
    } else if (from === "pending-approvals") {
      navigate("/admin/pending-approvals");
    } else if (from === "pets") {
      navigate("/admin?tab=pets", { replace: true });
    } else {
      navigate("/admin/pending-approvals");
    }
  };

  const handleAcceptUpdate = async () => {
    if (!id || !report || !report.has_user_update) return;
    try {
      setSavingAction("accept");
      setError(null);
      const numericId = Number(id);
      const res = await updateAdminLostReport(numericId, {
        has_user_update: false as any,
        previous_snapshot: null as any,
      });
      if (!res.ok) {
        if (res.error) setError(res.error);
        return;
      }
      setReport(res.data);
    } finally {
      setSavingAction(null);
    }
  };

  const handleRejectUpdate = async () => {
    if (!id || !report || !report.has_user_update || !report.previous_snapshot)
      return;
    try {
      setSavingAction("reject");
      setError(null);
      const numericId = Number(id);
      const snap = report.previous_snapshot || {};

      const payload: any = {
        // restore original user-entered fields from the snapshot
        pet_name: snap.pet_name,
        pet_type: snap.pet_type,
        breed: snap.breed,
        gender: snap.gender,
        color: snap.color,
        weight: snap.weight,
        vaccinated: snap.vaccinated,
        age: snap.age,
        city: snap.city,
        state: snap.state,
        pincode: snap.pincode,
        description: snap.description,
        has_user_update: false,
        previous_snapshot: null,
      };

      const res = await updateAdminLostReport(numericId, payload);
      if (!res.ok) {
        if (res.error) setError(res.error);
        return;
      }
      setReport(res.data);
    } finally {
      setSavingAction(null);
    }
  };

  const from = (location.state as any)?.from;
  const backLabel =
    from === "admin-map"
      ? "Back To Map"
      : from === "admin-lost"
        ? "Back to Lost Pet Reports"
        : from === "pets"
          ? "Back to Pets"
          : from === "pending-approvals"
            ? "Back to Pending Approvals"
            : "Back";

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
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>
                Pet ID: <span style={{ fontWeight: 700, color: "#111827" }}>#{report.id}</span>
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
              {report.lost_time && (
                <div>
                  <strong>Lost time:</strong> {new Date(report.lost_time).toLocaleString()}
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
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ fontWeight: 700 }}>Pet Details</div>
              {report.has_user_update && report.previous_snapshot && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleAcceptUpdate}
                    disabled={savingAction === "accept"}
                    style={{
                      borderRadius: 999,
                      border: "none",
                      padding: "6px 14px",
                      background: "#16a34a",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor:
                        savingAction === "accept" ? "not-allowed" : "pointer",
                    }}
                  >
                    {savingAction === "accept" ? "Accepting..." : "Accept"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectUpdate}
                    disabled={savingAction === "reject"}
                    style={{
                      borderRadius: 999,
                      border: "none",
                      padding: "6px 14px",
                      background: "#dc2626",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor:
                        savingAction === "reject" ? "not-allowed" : "pointer",
                    }}
                  >
                    {savingAction === "reject" ? "Reverting..." : "Reject"}
                  </button>
                </div>
              )}
            </div>

            {report.has_user_update && report.previous_snapshot ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 16,
                }}
              >
                {["Previous details", "Updated details"].map((title, idx) => {
                  const source = idx === 0 ? report.previous_snapshot : report;
                  return (
                    <div
                      key={title}
                      style={{
                        borderRadius: 16,
                        border: idx === 0 ? "1px solid #e5e7eb" : "1px solid #bfdbfe",
                        background: idx === 0 ? "#f9fafb" : "#eff6ff",
                        padding: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: idx === 0 ? "#6b7280" : "#1d4ed8",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {title}
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                          gap: 8,
                        }}
                      >
                        {([
                          ["pet_name", "Pet Name"],
                          ["pet_type", "Pet Type"],
                          ["breed", "Breed"],
                          ["gender", "Gender"],
                          ["color", "Color"],
                          ["weight", "Weight"],
                          ["vaccinated", "Vaccinated"],
                          ["age", "Age (years)"],
                          ["city", "City"],
                          ["state", "State"],
                          ["pincode", "Pincode"],
                          ["location_url", "Location URL"],
                        ] as const).map(([key, label]) => (
                          <div key={key}>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#6b7280",
                                marginBottom: 2,
                              }}
                            >
                              {label}
                            </div>
                            {key === "location_url" && source[key] ? (
                              <a
                                href={String(source[key]).startsWith("http")
                                  ? String(source[key])
                                  : `https://www.google.com/maps?q=${encodeURIComponent(String(source[key]))}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}
                              >
                                Open in Google Maps
                              </a>
                            ) : (
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "#111827",
                                }}
                              >
                                {source[key] || (
                                  <span style={{ color: "#9ca3af" }}>—</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#6b7280",
                            marginBottom: 2,
                          }}
                        >
                          Description
                        </div>
                        <div style={{ fontSize: 13, color: "#111827" }}>
                          {source.description || (
                            <span style={{ color: "#9ca3af" }}>No description</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
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
                    ["gender", "Gender"],
                    ["color", "Color"],
                    ["weight", "Weight"],
                    ["vaccinated", "Vaccinated"],
                    ["age", "Age (years)"],
                    ["city", "City"],
                    ["state", "State"],
                    ["pincode", "Pincode"],
                    ["location_url", "Location URL"],
                  ] as const).map(([key, label]) => (
                    <div key={key}>
                      <div
                        style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}
                      >
                        {label}
                      </div>
                      {key === "location_url" && report[key] ? (
                        <a
                          href={String(report[key]).startsWith("http")
                            ? String(report[key])
                            : `https://www.google.com/maps?q=${encodeURIComponent(String(report[key]))}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}
                        >
                          Open in Google Maps
                        </a>
                      ) : (
                        <div
                          style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}
                        >
                          {report[key] || (
                            <span style={{ color: "#9ca3af" }}>—</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <div
                    style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}
                  >
                    Description
                  </div>
                  <div style={{ fontSize: 13, color: "#111827" }}>
                    {report.description || (
                      <span style={{ color: "#9ca3af" }}>No description</span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Status actions inside detail view - only when opened from Pending Approvals */}
            {location.state.from === "pending-approvals" && (
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={async () => {
                    if (!report || report.status === "approved") return;
                    setError(null);
                    const res = await updateAdminLostReport(report.id, { status: "approved" } as any);
                    if (!res.ok) {
                      if (res.error) setError(res.error);
                    } else {
                      setReport(res.data);
                      window.alert("Lost report has been accepted.");
                      navigate("/admin/pending-approvals", { replace: true });
                    }
                  }}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 999,
                    border: "none",
                    background: "#16a34a",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: report?.status === "approved" ? "not-allowed" : "pointer",
                    opacity: report?.status === "approved" ? 0.7 : 1,
                  }}
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!report || report.status === "rejected") return;
                    setError(null);
                    const res = await updateAdminLostReport(report.id, { status: "rejected" } as any);
                    if (!res.ok) {
                      if (res.error) setError(res.error);
                    } else {
                      setReport(res.data);
                      window.alert("Lost report has been rejected.");
                      navigate("/admin/pending-approvals", { replace: true });
                    }
                  }}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 999,
                    border: "1px solid #dc2626",
                    background: "white",
                    color: "#dc2626",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: report?.status === "rejected" ? "not-allowed" : "pointer",
                    opacity: report?.status === "rejected" ? 0.7 : 1,
                  }}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
          {error && (
            <div style={{ fontSize: 12, color: "#b91c1c" }}>{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
