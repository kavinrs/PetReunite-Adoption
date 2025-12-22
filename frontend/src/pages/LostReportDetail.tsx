import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";
import { fetchMyLostPets, updateMyLostReport } from "../services/api";

export default function LostReportDetail() {
  useViewportStandardization();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromHome = (location.state as any)?.from === "home";
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
    gender: "",
    color: "",
    weight: "",
    vaccinated: "",
    age: "",
    city: "",
    state: "",
    pincode: "",
    location_url: "",
    lost_time: "",
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
            gender: found.gender || "",
            color: found.color || "",
            weight: found.weight || "",
            vaccinated: found.vaccinated || "",
            age: found.age || "",
            city: found.city || "",
            state: found.state || "",
            pincode: found.pincode || "",
            location_url: found.location_url || "",
            lost_time: found.lost_time ? new Date(found.lost_time).toISOString().slice(0,16) : "",
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
    if (fromHome) {
      navigate("/user");
    } else {
      navigate("/user", { state: { tab: "activity" } });
    }
  };

  if (loading) return <div style={{ padding: 32 }}>Loading report...</div>;
  if (error)
    return (
      <div style={{ padding: 32 }}>
        <button onClick={handleBack} style={{ marginBottom: 16 }}>
          {fromHome ? "Back" : "Back to activity"}
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
    pet_name: "🐶",
    pet_type: "📘",
    breed: "🧬",
    gender: "⚧",
    color: "🎨",
    weight: "⚖️",
    vaccinated: "💉",
    age: "🎂",
    city: "📍",
    state: "🗺️",
    pincode: "🏷️",
    location_url: "🗺️",
    lost_time: "⏱️",
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
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>
              Pet ID:{" "}
              <span style={{ fontWeight: 700, color: "#111827" }}>
                #{report.pet_unique_id || `LP${report.id.toString().padStart(6, "0")}`}
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

          <form
            onSubmit={handleSave}
            style={{
              background:
                "linear-gradient(135deg, rgba(219,234,254,0.85), rgba(239,246,255,0.9))",
              borderRadius: 24,
              padding: 18,
              boxShadow: "0 14px 40px rgba(15,23,42,0.16)",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              border: "1px solid rgba(148,163,184,0.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#0f172a",
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
              {mode === "edit" && (
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    borderRadius: 999,
                    border: "none",
                    padding: "6px 16px",
                    background:
                      "linear-gradient(135deg, #2563eb, #4f46e5)",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: saving ? "not-allowed" : "pointer",
                    boxShadow: "0 8px 18px rgba(37,99,235,0.35)",
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
                background: "rgba(255,255,255,0.8)",
                borderRadius: 18,
                padding: 14,
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
                ["lost_time", "Lost Time"],
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
                          textTransform: "uppercase",
                          letterSpacing: 0.6,
                          fontWeight: 700,
                          marginBottom: 2,
                        }}
                      >
                        {label}
                      </div>
                      {mode === "view" ? (
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          {key === "location_url" && form[key]
                            ? (
                                <a
                                  href={String(form[key]).startsWith("http")
                                    ? String(form[key])
                                    : `https://www.google.com/maps?q=${encodeURIComponent(String(form[key]))}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: "#2563eb" }}
                                >
                                  Open in Google Maps
                                </a>
                              )
                            : key === "lost_time" && form[key]
                              ? new Date(form[key]).toLocaleString()
                              : key === "weight" && form[key]
                                ? `${form[key]}kg`
                                : key === "age" && form[key]
                                  ? `${form[key]} years`
                                  : form[key] || (
                                      <span style={{ color: "#9ca3af" }}>—</span>
                                    )}
                        </div>
                      ) : key === "lost_time" ? (
                        <input
                          type="datetime-local"
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
              {mode === "view" ? (
                <div style={{ fontSize: 13, color: "#111827", lineHeight: 1.6 }}>
                  {form.description || (
                    <span style={{ color: "#9ca3af" }}>No description</span>
                  )}
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
                    background: "rgba(248,250,252,0.9)",
                  }}
                />
              )}
            </div>

            {error && (
              <div style={{ fontSize: 12, color: "#b91c1c" }}>{error}</div>
            )}
          </form>

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
