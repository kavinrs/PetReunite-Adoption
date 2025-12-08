import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { reportLostPet } from "../services/api";
import { useViewportStandardization } from "../hooks/useViewportStandardization";

type Feedback = { type: "success" | "error"; message: string } | null;

const initialForm = {
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
  description: "",
  location_url: "",
};

export default function ReportLostPet() {
  // Apply viewport standardization to ensure consistent 100% scaling
  useViewportStandardization();

  const [form, setForm] = useState(initialForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const navigate = useNavigate();

  function handleChange(field: keyof typeof initialForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleUseCurrentLocation() {
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setForm((prev) => ({ ...prev, location_url: url }));
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocError(err.message || "Unable to fetch current location.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    const res = await reportLostPet({
      ...form,
      location_url: form.location_url,
      photo,
    });
    if (res.ok) {
      setFeedback({ type: "success", message: "Lost pet report submitted." });
      setForm(initialForm);
      setPhoto(null);
    } else {
      setFeedback({
        type: "error",
        message: res.error ?? "Unable to submit report.",
      });
    }
    setSubmitting(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 32,
        background: "#f7f9fc",
        boxSizing: "border-box",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 940,
          margin: "0 auto",
          background: "white",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 18px 50px rgba(15,23,42,0.12)",
          border: "1px solid rgba(15,23,42,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
              Report Lost Pet
            </div>
            <p
              style={{
                margin: "6px 0 0",
                color: "rgba(15,23,42,0.65)",
                maxWidth: 600,
              }}
            >
              Provide as many details as you can so community members can help
              find your pet quickly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/user")}
            style={{
              border: "none",
              background: "transparent",
              color: "#2563eb",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ← Back to dashboard
          </button>
        </div>

        {feedback && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 16px",
              borderRadius: 12,
              border: `1px solid ${
                feedback.type === "success"
                  ? "rgba(249,115,22,0.3)"
                  : "rgba(248,113,113,0.4)"
              }`,
              background:
                feedback.type === "success"
                  ? "rgba(249,115,22,0.12)"
                  : "rgba(248,113,113,0.12)",
              color: feedback.type === "success" ? "#c2410c" : "#b91c1c",
              fontWeight: 600,
            }}
          >
            {feedback.message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            <div>
              <label style={labelStyle}>Pet Name</label>
              <input
                type="text"
                value={form.pet_name}
                onChange={(e) => handleChange("pet_name", e.target.value)}
                style={inputStyle}
                placeholder="Pet Name"
              />
            </div>
            <div>
              <label style={labelStyle}>
                Pet Type (Dog, Cat, etc.)
                <span style={{ color: "#f97316" }}> *</span>
              </label>
              <input
                type="text"
                required
                value={form.pet_type}
                onChange={(e) => handleChange("pet_type", e.target.value)}
                style={inputStyle}
                placeholder="Dog, Cat, etc."
              />
            </div>
            <div>
              <label style={labelStyle}>Breed</label>
              <input
                type="text"
                value={form.breed}
                onChange={(e) => handleChange("breed", e.target.value)}
                style={inputStyle}
                placeholder="Breed"
              />
            </div>
            <div>
              <label style={labelStyle}>Color</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => handleChange("color", e.target.value)}
                style={inputStyle}
                placeholder="Color"
              />
            </div>
            <div>
              <label style={labelStyle}>Weight</label>
              <input
                type="text"
                value={form.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
                style={inputStyle}
                placeholder="Weight (e.g., 5kg, Small, Medium)"
              />
            </div>
            <div>
              <label style={labelStyle}>Vaccinated</label>
              <select
                value={form.vaccinated}
                onChange={(e) => handleChange("vaccinated", e.target.value)}
                style={inputStyle}
              >
                <option value="">Select vaccination status</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Age (years)</label>
              <input
                type="text"
                value={form.age}
                onChange={(e) => handleChange("age", e.target.value)}
                style={inputStyle}
                placeholder="Age"
              />
            </div>
            <div>
              <label style={labelStyle}>
                City<span style={{ color: "#f97316" }}> *</span>
              </label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                style={inputStyle}
                placeholder="Last seen city"
              />
            </div>
            <div>
              <label style={labelStyle}>
                State<span style={{ color: "#f97316" }}> *</span>
              </label>
              <input
                type="text"
                required
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
                style={inputStyle}
                placeholder="State"
              />
            </div>
            <div>
              <label style={labelStyle}>Pincode</label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
                style={inputStyle}
                placeholder="Postal/ZIP code"
              />
            </div>
            <div>
              <label style={labelStyle}>Location URL</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  type="text"
                  value={form.location_url ?? ""}
                  onChange={(e) => handleChange("location_url" as any, e.target.value)}
                  style={inputStyle}
                  placeholder="Paste a map link or use 'Get current location'"
                />
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                  style={{
                    alignSelf: "flex-start",
                    borderRadius: 999,
                    border: "none",
                    padding: "8px 14px",
                    background:
                      "linear-gradient(90deg, rgba(59,130,246,1), rgba(56,189,248,1))",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: locating ? "not-allowed" : "pointer",
                    boxShadow: "0 6px 18px rgba(59,130,246,0.35)",
                  }}
                >
                  {locating ? "Getting location..." : "Get current location"}
                </button>
                {locError && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#b91c1c",
                    }}
                  >
                    {locError}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Upload Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(15,23,42,0.15)",
                  background: "#fff",
                }}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              Description (last seen location, behavior, etc.)
              <span style={{ color: "#f97316" }}> *</span>
            </label>
            <textarea
              required
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              style={{
                ...inputStyle,
                minHeight: 140,
                resize: "vertical",
              }}
              placeholder="Share any details that can help"
            />
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              justifyContent: "space-between",
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/user")}
              style={{
                flex: "1 1 200px",
                border: "none",
                borderRadius: 999,
                padding: "14px 18px",
                background: "rgba(15,23,42,0.05)",
                color: "#0f172a",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: "1 1 260px",
                border: "none",
                borderRadius: 999,
                padding: "14px 18px",
                background: submitting
                  ? "rgba(249,115,22,0.6)"
                  : "linear-gradient(90deg,#f97316,#ec4899)",
                color: "white",
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 12px 34px rgba(249,115,22,0.35)",
              }}
            >
              {submitting ? "Submitting..." : "Report Pet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  color: "rgba(15,23,42,0.85)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 12,
  border: "1px solid rgba(15,23,42,0.15)",
  background: "#fff",
  fontSize: 14,
  color: "#0f172a",
  boxSizing: "border-box",
};
