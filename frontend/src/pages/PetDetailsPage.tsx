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

interface AdoptionFormData {
  phone: string;
  address: string;
  household_info: string;
  experience_with_pets: string;
  reason_for_adopting: string;
  has_other_pets: boolean;
  other_pets_details: string;
  home_ownership: "own" | "rent";
  preferred_meeting: string;
}

export default function PetDetailsPage() {
  useViewportStandardization();

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState<AdoptionFormData>({
    phone: "",
    address: "",
    household_info: "",
    experience_with_pets: "",
    reason_for_adopting: "",
    has_other_pets: false,
    other_pets_details: "",
    home_ownership: "own",
    preferred_meeting: "",
  });

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

      const response = await fetch(`/api/pets/pets/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

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

  const handleFormChange = (
    field: keyof AdoptionFormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBack = () => {
    const fromMap = (location.state as any)?.from === "admin-map";
    const fromAdminRequests = (location.state as any)?.from === "admin-chat-requests";
    const fromAdminChat = (location.state as any)?.from === "admin-chat";
    
    if (fromMap) {
      navigate("/admin?tab=stats", { state: { openMap: true } });
    } else if (fromAdminRequests) {
      navigate("/admin?tab=chat&view=requests");
    } else if (fromAdminChat) {
      navigate("/admin?tab=chat");
    } else {
      navigate("/user");
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pet) return;

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(`/api/pets/pets/${pet.id}/adoption-requests/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setShowForm(false);
      } else {
        const errorData = await response.json();
        if (errorData.error) {
          setError(errorData.error);
        } else {
          setError("Failed to submit adoption request");
        }
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setSubmitting(false);
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
              background: "linear-gradient(135deg, #ff8a00, #ff2fab)",
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

  if (submitSuccess) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f7fb",
          fontFamily: "'Inter', sans-serif",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textAlign: "center",
            maxWidth: "500px",
            width: "100%",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "linear-gradient(135deg, #10b981, #34d399)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: "32px",
            }}
          >
            ✓
          </div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: "16px",
            }}
          >
            Request Submitted Successfully!
          </h2>
          <p
            style={{
              color: "#6b7280",
              marginBottom: "24px",
              lineHeight: "1.6",
            }}
          >
            Thanks! Your adoption request for <strong>{pet.name}</strong> has
            been submitted. An admin will review your application and contact
            you soon.
          </p>
          <div
            style={{ display: "flex", gap: "12px", justifyContent: "center" }}
          >
            <button
              onClick={() => navigate("/user/adoption-requests")}
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              View My Requests
            </button>
            <button
              onClick={handleBack}
              style={{
                background: "transparent",
                color: "#6b7280",
                border: "2px solid #e5e7eb",
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
      </div>
    );
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
          {pet.photos ? (
            <img
              src={pet.photos}
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
                    background: "#dcfce7",
                    color: "#16a34a",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  🏠 Available for Adoption
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

            {/* Apply for Adoption Button */}
            <button
              onClick={() => setShowForm(true)}
              style={{
                background: "linear-gradient(135deg, #ff8a00, #ff2fab)",
                color: "white",
                border: "none",
                padding: "16px 32px",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(255,138,0,0.3)",
                transition: "transform 0.2s ease",
                width: "100%",
                marginTop: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              🏠 Apply for Adoption
            </button>
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
            </div>
          </div>
        </div>
      </div>


      {/* Adoption Application Form Modal */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: 32,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "0 0 8px 0",
                }}
              >
                Adoption Application
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  margin: 0,
                }}
              >
                Tell us about yourself to adopt {pet.name}
              </p>
            </div>

            <form onSubmit={handleSubmitApplication}>
              <div
                style={{
                  display: "grid",
                  gap: 20,
                }}
              >
                {/* Phone */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "2px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 14,
                      boxSizing: "border-box",
                      background: "#ffffff",
                      color: "#374151",
                    }}
                    placeholder="+91-XXXXXXXXXX"
                  />
                </div>

                {/* Address */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Address *
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => handleFormChange("address", e.target.value)}
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "2px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 14,
                      boxSizing: "border-box",
                      resize: "vertical",
                      background: "#ffffff",
                      color: "#374151",
                    }}
                    placeholder="Your full address"
                  />
                </div>

                {/* Home Ownership */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Home Ownership *
                  </label>
                  <div style={{ display: "flex", gap: 16 }}>
                    {["own", "rent"].map((option) => (
                      <label
                        key={option}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name="home_ownership"
                          value={option}
                          checked={formData.home_ownership === option}
                          onChange={(e) =>
                            handleFormChange(
                              "home_ownership",
                              e.target.value as "own" | "rent",
                            )
                          }
                          style={{ cursor: "pointer" }}
                        />
                        <span style={{ fontSize: 14, color: "#374151" }}>
                          {option === "own" ? "Own" : "Rent"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Household Info */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Household Information
                  </label>
                  <input
                    type="text"
                    value={formData.household_info}
                    onChange={(e) => handleFormChange("household_info", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "2px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 14,
                      boxSizing: "border-box",
                      background: "#ffffff",
                      color: "#374151",
                    }}
                    placeholder="e.g., 2 adults, 1 child"
                  />
                </div>

                {/* Other Pets */}
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.has_other_pets}
                      onChange={(e) => handleFormChange("has_other_pets", e.target.checked)}
                      style={{ cursor: "pointer" }}
                    />
                    I have other pets
                  </label>

                  {formData.has_other_pets && (
                    <textarea
                      value={formData.other_pets_details}
                      onChange={(e) => handleFormChange("other_pets_details", e.target.value)}
                      rows={2}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        border: "2px solid #e5e7eb",
                        borderRadius: 8,
                        fontSize: 14,
                        boxSizing: "border-box",
                        marginTop: 8,
                        resize: "vertical",
                        background: "#ffffff",
                        color: "#374151",
                      }}
                      placeholder="Please describe your other pets"
                    />
                  )}
                </div>

                {/* Experience with Pets */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Experience with Pets *
                  </label>
                  <textarea
                    required
                    value={formData.experience_with_pets}
                    onChange={(e) => handleFormChange("experience_with_pets", e.target.value)}
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "2px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 14,
                      boxSizing: "border-box",
                      resize: "vertical",
                      background: "#ffffff",
                      color: "#374151",
                    }}
                    placeholder="Tell us about your experience with pets"
                  />
                </div>

                {/* Reason for Adopting */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Why do you want to adopt {pet.name}? *
                  </label>
                  <textarea
                    required
                    value={formData.reason_for_adopting}
                    onChange={(e) => handleFormChange("reason_for_adopting", e.target.value)}
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "2px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 14,
                      boxSizing: "border-box",
                      resize: "vertical",
                      background: "#ffffff",
                      color: "#374151",
                    }}
                    placeholder="Tell us why you'd like to adopt this pet"
                  />
                </div>

                {/* Preferred Meeting */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    Preferred Meeting/Pickup Details
                  </label>
                  <textarea
                    value={formData.preferred_meeting}
                    onChange={(e) => handleFormChange("preferred_meeting", e.target.value)}
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "2px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 14,
                      boxSizing: "border-box",
                      resize: "vertical",
                      background: "#ffffff",
                      color: "#374151",
                    }}
                    placeholder="When would you prefer to meet/pick up the pet?"
                  />
                </div>
              </div>

              {error && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "10px 14px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 8,
                    color: "#dc2626",
                    fontSize: 13,
                  }}
                >
                  {error}
                </div>
              )}

              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  gap: 12,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    background: "transparent",
                    color: "#6b7280",
                    border: "2px solid #e5e7eb",
                    padding: "10px 20px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: submitting
                      ? "#9ca3af"
                      : "linear-gradient(135deg, #10b981, #34d399)",
                    color: "white",
                    border: "none",
                    padding: "10px 24px",
                    borderRadius: 8,
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    fontSize: 14,
                    boxShadow: submitting
                      ? "none"
                      : "0 4px 12px rgba(16,185,129,0.3)",
                  }}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
