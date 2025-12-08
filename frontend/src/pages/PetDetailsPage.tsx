import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string;
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

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [adoptionRequestId, setAdoptionRequestId] = useState<number | null>(
    null,
  );

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
        const data = await response.json();
        setAdoptionRequestId(data.id);
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

  if (error) {
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
            onClick={() => navigate("/user")}
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
              onClick={() => navigate("/user")}
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f7fb",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "white",
          padding: "16px 24px",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => navigate("/user")}
            style={{
              background: "transparent",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            ← Back to Dashboard
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "18px",
              fontWeight: "700",
              color: "#0f172a",
            }}
          >
            🐾 PetReunite
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        {/* Pet Details Section */}
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              minHeight: "500px",
            }}
          >
            {/* Pet Image */}
            <div
              style={{
                background: `url(${pet.photos}) center/cover`,
                minHeight: "500px",
              }}
            />

            {/* Pet Information */}
            <div
              style={{
                padding: "40px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(34,197,94,0.1)",
                  color: "#059669",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                  marginBottom: "16px",
                  width: "fit-content",
                }}
              >
                🏠 AVAILABLE FOR ADOPTION
              </div>

              <h1
                style={{
                  fontSize: "48px",
                  fontWeight: "900",
                  color: "#0f172a",
                  margin: "0 0 8px 0",
                  lineHeight: "1.1",
                }}
              >
                {pet.name}
              </h1>

              <p
                style={{
                  fontSize: "18px",
                  color: "#6b7280",
                  margin: "0 0 24px 0",
                }}
              >
                {pet.species} • {pet.breed} • {pet.age}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "16px",
                  marginBottom: "32px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      fontWeight: "600",
                    }}
                  >
                    COLOR
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    {pet.color}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      fontWeight: "600",
                    }}
                  >
                    LOCATION
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    {pet.location_city}, {pet.location_state}
                  </div>
                </div>
              </div>

              <p
                style={{
                  fontSize: "16px",
                  lineHeight: "1.6",
                  color: "#4b5563",
                  marginBottom: "32px",
                }}
              >
                {pet.description}
              </p>

              <button
                onClick={() => setShowForm(true)}
                style={{
                  background: "linear-gradient(135deg, #ff8a00, #ff2fab)",
                  color: "white",
                  border: "none",
                  padding: "16px 32px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(255,138,0,0.3)",
                  transition: "transform 0.2s ease",
                  width: "100%",
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
          </div>
        </div>

        {/* Adoption Application Form */}
        {showForm && (
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "40px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: "32px",
              }}
            >
              <h2
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: "#0f172a",
                  margin: "0 0 8px 0",
                }}
              >
                Adoption Application
              </h2>
              <p
                style={{
                  fontSize: "16px",
                  color: "#6b7280",
                  margin: 0,
                }}
              >
                Tell us about yourself to adopt {pet.name}
              </p>
            </div>

            <form
              onSubmit={handleSubmitApplication}
              style={{
                maxWidth: "600px",
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: "24px",
                }}
              >
                {/* Phone */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
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
                      padding: "12px 16px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                    }}
                    placeholder="+91-XXXXXXXXXX"
                  />
                </div>

                {/* Address */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Address *
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) =>
                      handleFormChange("address", e.target.value)
                    }
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                    placeholder="Your full address"
                  />
                </div>

                {/* Home Ownership */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Home Ownership *
                  </label>
                  <div style={{ display: "flex", gap: "16px" }}>
                    {["own", "rent"].map((option) => (
                      <label
                        key={option}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
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
                        <span style={{ fontSize: "16px", color: "#374151" }}>
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
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Household Information
                  </label>
                  <input
                    type="text"
                    value={formData.household_info}
                    onChange={(e) =>
                      handleFormChange("household_info", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                    }}
                    placeholder="e.g., 2 adults, 1 child"
                  />
                </div>

                {/* Other Pets */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Do you have other pets?
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.has_other_pets}
                      onChange={(e) =>
                        handleFormChange("has_other_pets", e.target.checked)
                      }
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "16px", color: "#374151" }}>
                      Yes, I have other pets
                    </span>
                  </label>

                  {formData.has_other_pets && (
                    <textarea
                      value={formData.other_pets_details}
                      onChange={(e) =>
                        handleFormChange("other_pets_details", e.target.value)
                      }
                      rows={2}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "2px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "16px",
                        boxSizing: "border-box",
                        marginTop: "8px",
                        resize: "vertical",
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
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Experience with Pets *
                  </label>
                  <textarea
                    required
                    value={formData.experience_with_pets}
                    onChange={(e) =>
                      handleFormChange("experience_with_pets", e.target.value)
                    }
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                    placeholder="Tell us about your experience with pets"
                  />
                </div>

                {/* Reason for Adopting */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Why do you want to adopt {pet.name}? *
                  </label>
                  <textarea
                    required
                    value={formData.reason_for_adopting}
                    onChange={(e) =>
                      handleFormChange("reason_for_adopting", e.target.value)
                    }
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                    placeholder="Tell us why you'd like to adopt this pet"
                  />
                </div>

                {/* Preferred Meeting */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                    }}
                  >
                    Preferred Meeting/Pickup Details
                  </label>
                  <textarea
                    value={formData.preferred_meeting}
                    onChange={(e) =>
                      handleFormChange("preferred_meeting", e.target.value)
                    }
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "16px",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                    placeholder="When would you prefer to meet/pick up the pet?"
                  />
                </div>
              </div>

              {error && (
                <div
                  style={{
                    marginTop: "24px",
                    padding: "12px 16px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "8px",
                    color: "#dc2626",
                    fontSize: "14px",
                  }}
                >
                  {error}
                </div>
              )}

              <div
                style={{
                  marginTop: "32px",
                  display: "flex",
                  gap: "16px",
                  justifyContent: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    background: "transparent",
                    color: "#6b7280",
                    border: "2px solid #e5e7eb",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "16px",
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
                    padding: "12px 32px",
                    borderRadius: "8px",
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontWeight: "700",
                    fontSize: "16px",
                    boxShadow: submitting
                      ? "none"
                      : "0 4px 12px rgba(16,185,129,0.3)",
                  }}
                >
                  {submitting ? "Submitting..." : "Submit Adoption Request"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
