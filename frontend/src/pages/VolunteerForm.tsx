import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createVolunteerRequest } from "../services/api";

type ExperienceLevel = "beginner" | "moderate" | "experienced" | "professional";

export default function VolunteerForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<string>("");
  const [idProofType, setIdProofType] = useState("");
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [locationText, setLocationText] = useState("");
  const [preferences, setPreferences] = useState("");
  const [skills, setSkills] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
  const [experienceWithPets, setExperienceWithPets] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  async function handleUseCurrentLocation() {
    try {
      if (!navigator.geolocation) {
        setLocationText("Geolocation not supported");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocationText(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        },
        () => setLocationText("Unable to get current location"),
      );
    } catch {
      setLocationText("Unable to get current location");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const payload = {
      full_name: fullName.trim(),
      phone_number: phone.trim(),
      email: email.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      experience_level: experienceLevel,
      id_proof_type: idProofType.trim(),
      id_proof_document: idProofFile,
      volunteering_preferences: preferences.trim(),
      availability: "",
      skills: skills.trim(),
      motivation: [
        address ? `Address: ${address}` : "",
        locationText ? `Location: ${locationText}` : "",
        experienceWithPets ? `Experience: ${experienceWithPets}` : "",
        age ? `Age: ${age}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    };

    const res = await createVolunteerRequest(payload as any);
    if (res.ok) {
      navigate("/user", { replace: true });
    } else {
      setError(res.error || "Failed to submit volunteer request");
    }
    setSubmitting(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f7fb", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 24 }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 720,
          background: "white",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 24px 60px rgba(15,23,42,0.08)",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Volunteer Registration</div>
            <div style={{ color: "rgba(15,23,42,0.6)", marginTop: 4 }}>Fill your details to help rescue and care</div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/user", { replace: true })}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              color: "#0f172a",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: 12, borderRadius: 8, background: "#fff1f2", color: "#b91c1c", padding: 10, fontSize: 13 }}>{error}</div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>Name</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>Age</span>
            <input value={age} onChange={(e) => setAge(e.target.value)} style={inputStyle} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>ID Proof Type</span>
            <input value={idProofType} onChange={(e) => setIdProofType(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>ID Proof Document</span>
            <input type="file" onChange={(e) => setIdProofFile(e.target.files?.[0] ?? null)} style={inputStyle} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>Email</span>
            <input value={email} type="email" onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>City</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} required style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>State</span>
            <input value={state} onChange={(e) => setState(e.target.value)} style={inputStyle} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>Pincode</span>
            <input value={pincode} onChange={(e) => setPincode(e.target.value)} required style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>Address</span>
            <input value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <button type="button" onClick={handleUseCurrentLocation} style={smallBtn}>Use my current location</button>
          <span style={{ fontSize: 12, color: "#6b7280" }}>{locationText}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>Volunteering Preference</span>
            <input value={preferences} onChange={(e) => setPreferences(e.target.value)} placeholder="Comma-separated" style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>Skills</span>
            <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Comma-separated" style={inputStyle} />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>Experience Level</span>
            <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)} style={inputStyle}>
              <option value="beginner">Beginner</option>
              <option value="moderate">Moderate</option>
              <option value="experienced">Experienced</option>
              <option value="professional">Professional vet / trainer</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>Experience with Pets</span>
            <input value={experienceWithPets} onChange={(e) => setExperienceWithPets(e.target.value)} style={inputStyle} />
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              border: "2px solid rgba(99,102,241,0.3)",
              background: submitting ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)",
              color: "#312e81",
              fontWeight: 800,
              cursor: submitting ? "default" : "pointer",
            }}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "white",
  color: "#374151",
  fontSize: 14,
};

const smallBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  background: "#f9fafb",
  color: "#0f172a",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

