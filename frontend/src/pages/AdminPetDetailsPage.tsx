import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string;
  gender: string;
  description: string;
  age: string;
  color: string;
  location_city: string;
  location_state: string;
  photos: string;
  posted_by: {
    id: number;
    username: string;
    email: string;
  };
  created_at: string;
  is_active: boolean;
  pet_unique_id?: string;
}

export default function AdminPetDetailsPage() {
  useViewportStandardization();

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchPetDetails();
  }, [id]);

  const fetchPetDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      // Try the regular pets endpoint first
      let response = await fetch(`/api/pets/pets/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // If not found (might be inactive), try admin endpoint
      if (response.status === 404) {
        response = await fetch(`/api/pets/admin/pets/${id}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      if (response.ok) {
        const data = await response.json();
        setPet(data);
      } else if (response.status === 404) {
        setError("Pet not found");
      } else {
        setError("Failed to load pet details");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const fromState = (location.state as any)?.from;
    if (fromState === "dashboard") {
      navigate("/admin?tab=dashboard");
    } else if (fromState === "pets") {
      navigate("/admin?tab=pets");
    } else if (fromState === "admin-adoptions") {
      navigate("/admin?tab=adoptions");
    } else if (fromState === "admin-map") {
      navigate("/admin?tab=stats", { state: { openMap: true } });
    } else {
      navigate("/admin?tab=pets");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f7fb",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          Loading pet details...
        </div>
      </div>
    );
  }

  if (error && !pet) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f7fb",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#ef4444", marginBottom: "16px" }}>{error}</div>
          <button
            onClick={handleBack}
            style={{
              background: "linear-gradient(135deg, #0d9488, #0891b2)",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!pet) {
    return null;
  }

  const petUniqueId = pet.pet_unique_id || `AP${pet.id.toString().padStart(6, "0")}`;

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
          color: "#0d9488",
          fontWeight: 700,
          marginBottom: 16,
          cursor: "pointer",
        }}
      >
        ← {(location.state as any)?.from === "dashboard" 
            ? "Back to Home" 
            : (location.state as any)?.from === "admin-adoptions"
              ? "Back to Adoptions"
              : "Back to Pets"}
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
          {pet.photos ? (
            <img
              src={pet.photos.startsWith("http") ? pet.photos : `http://localhost:8000${pet.photos.startsWith("/") ? "" : "/"}${pet.photos}`}
              alt={pet.name}
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
                    background: pet.is_active ? "#dcfce7" : "#fee2e2",
                    color: pet.is_active ? "#16a34a" : "#dc2626",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {pet.is_active ? "🏠 Available for Adoption" : "❌ Adopted/Inactive"}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>
                Pet ID:{" "}
                <span style={{ fontWeight: 700, color: "#111827" }}>
                  #{petUniqueId}
                </span>
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {pet.name}
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
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: 14,
                background: "rgba(255,255,255,0.9)",
                borderRadius: 18,
                padding: 14,
              }}
            >
              {([
                ["name", "Pet Name"],
                ["species", "Species"],
                ["breed", "Breed"],
                ["gender", "Gender"],
                ["color", "Color"],
                ["age", "Age"],
                ["location_city", "City"],
                ["location_state", "State"],
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
                        }}
                      >
                        {pet[key] || <span style={{ color: "#9ca3af" }}>—</span>}
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

          {/* Posted By Details */}
          <div
            style={{
              background: "#f9fafb",
              borderRadius: 18,
              padding: 14,
              boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
              border: "1px solid rgba(226,232,240,0.9)",
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
                Posted Details
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
                  padding: 8,
                  boxShadow: "0 3px 8px rgba(148,163,184,0.25)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 14 }}>👤</span>
                <div style={{ flex: 1 }}>
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
                    Posted By
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    {pet.posted_by?.username || "Admin"}
                  </div>
                </div>
              </div>

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
                <span style={{ fontSize: 14 }}>📅</span>
                <div style={{ flex: 1 }}>
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
                    Posted On
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    {pet.created_at
                      ? new Date(pet.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "—"}
                  </div>
                </div>
              </div>

              {pet.posted_by?.email && (
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
                  <span style={{ fontSize: 14 }}>📧</span>
                  <div style={{ flex: 1 }}>
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
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {pet.posted_by.email}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
