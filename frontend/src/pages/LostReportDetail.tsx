import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";
import { fetchMyLostPets, updateMyLostReport } from "../services/api";

export default function LostReportDetail() {
  useViewportStandardization();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = (new URLSearchParams(location.search).get("mode") || "view") as
    | "view"
    | "edit";

  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    pet_name: "",
    pet_type: "",
    breed: "",
    color: "",
    weight: "",
    vaccinated: "",
    age: "",
    city: "",
    state: "",
    pincode: "",
    location_url: "",
    description: "",
  });

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      const res = await fetchMyLostPets();
      if (res.ok) {
        const found = (res.data as any[]).find((r) => String(r.id) === String(id));
        if (!found) {
          setError("Report not found");
        } else {
          setReport(found);
          setForm({
            pet_name: found.pet_name || "",
            pet_type: found.pet_type || "",
            breed: found.breed || "",
            color: found.color || "",
            weight: found.weight || "",
            vaccinated: found.vaccinated || "",
            age: found.age || "",
            city: found.city || "",
            state: found.state || "",
            pincode: found.pincode || "",
            location_url: found.location_url || "",
            description: found.description || "",
          });
        }
      } else {
        setError(res.error || "Failed to load report");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    const res = await updateMyLostReport(Number(id), form);
    if (!res.ok) {
      setError(res.error || "Failed to update report");
    } else {
      navigate("/user", { state: { tab: "activity" } });
    }
    setSaving(false);
  };

  const handleBack = () => {
    navigate("/user", { state: { tab: "activity" } });
  };

  if (loading) return <div style={{ padding: 32 }}>Loading report...</div>;
  if (error)
    return (
      <div style={{ padding: 32 }}>
        <button onClick={handleBack} style={{ marginBottom: 16 }}>
          ← Back to activity
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
        ← Back to activity
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
              style={{ width: "100%", borderRadius: 18, objectFit: "cover" }}
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
              {report.city && (
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
              <div>
                <strong>Reported on:</strong>{" "}
                {new Date(report.created_at).toLocaleString()}
              </div>
              <div>
                <strong>Last updated:</strong>{" "}
                {new Date(report.updated_at).toLocaleString()}
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSave}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700 }}>Pet Details</div>
              {mode === "view" ? (
                <button
                  type="button"
                  onClick={() => navigate(`/user/lost/${report.id}?mode=edit`)}
                  style={{
                    borderRadius: 999,
                    border: "1px solid #9ca3af",
                    padding: "6px 14px",
                    background: "#111827",
                    color: "#f9fafb",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    borderRadius: 999,
                    border: "none",
                    padding: "6px 16px",
                    background: "#2563eb",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              )}
            </div>

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
                ["location_url", "Location URL"],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</div>
                  {mode === "view" ? (
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                      {key === "location_url" && form[key]
                        ? (
                            <a href={form[key]} target="_blank" rel="noreferrer">
                              {form[key]}
                            </a>
                          )
                        : form[key] || <span style={{ color: "#9ca3af" }}>—</span>}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={form[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        fontSize: 12,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                Description
              </div>
              {mode === "view" ? (
                <div style={{ fontSize: 13, color: "#111827" }}>
                  {form.description || <span style={{ color: "#9ca3af" }}>No description</span>}
                </div>
              ) : (
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                    resize: "vertical",
                  }}
                />
              )}
            </div>

            {error && (
              <div style={{ fontSize: 12, color: "#b91c1c" }}>{error}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
