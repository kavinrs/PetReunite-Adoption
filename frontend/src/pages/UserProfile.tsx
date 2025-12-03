import React, { useEffect, useState } from "react";
import { clearTokens, getProfile, updateProfile } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";

export default function UserProfile() {
  // Apply viewport standardization to ensure consistent 100% scaling
  useViewportStandardization();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    full_name: "",
    phone_number: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
    landmark: "",
    location_url: "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const res = await getProfile();
      if (!mounted) return;
      if (res.ok) setProfile(res.data);
      else {
        clearTokens();
        navigate("/", { replace: true });
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!profile) return;
    setEditValues({
      full_name: profile?.full_name ?? "",
      phone_number: profile?.phone_number ?? "",
      address: profile?.address ?? "",
      state: profile?.state ?? "",
      city: profile?.city ?? "",
      pincode: profile?.pincode ?? "",
      landmark: profile?.landmark ?? "",
      location_url: profile?.location_url ?? "",
      password: "",
    });
  }, [profile]);

  if (loading) return <div style={{ padding: 40 }}>Loading profile...</div>;

  const displayName =
    profile?.full_name ??
    profile?.username ??
    profile?.user?.username ??
    "User";
  const avatarUrl = profile?.profile_photo || "/profile-avatar.svg";
  const email = profile?.user?.email ?? "—";

  const infoRows = [
    { label: "Full name", value: profile?.full_name ?? "—" },
    {
      label: "Username",
      value: profile?.user?.username ?? profile?.username ?? "—",
    },
    { label: "Email", value: profile?.user?.email ?? "—" },
    { label: "Phone number", value: profile?.phone_number ?? "—" },
    { label: "Address", value: profile?.address ?? "—" },
    { label: "State", value: profile?.state ?? "—" },
    { label: "City", value: profile?.city ?? "—" },
    { label: "Pincode", value: profile?.pincode ?? "—" },
    { label: "Landmark", value: profile?.landmark ?? "—" },
    {
      label: "Location",
      value: profile?.location_url ? (
        <a
          href={profile.location_url}
          target="_blank"
          rel="noreferrer"
          style={{ color: "#60a5fa", textDecoration: "underline" }}
        >
          Open in Maps
        </a>
      ) : (
        "—"
      ),
    },
    { label: "Role", value: profile?.role ?? "—" },
    { label: "Verified", value: profile?.verified ? "Yes" : "No" },
    {
      label: "Joined",
      value: profile?.user?.date_joined
        ? new Date(profile.user.date_joined).toLocaleDateString()
        : "—",
    },
  ];

  const editableFields: Array<{
    key: keyof typeof editValues;
    label: string;
    type?: "text" | "tel" | "textarea" | "password";
  }> = [
    { key: "full_name", label: "Full name" },
    { key: "phone_number", label: "Phone number", type: "tel" },
    { key: "address", label: "Address", type: "textarea" },
    { key: "state", label: "State" },
    { key: "city", label: "City" },
    { key: "pincode", label: "Pincode" },
    { key: "landmark", label: "Landmark" },
    { key: "location_url", label: "Location URL (Google Maps)" },
    { key: "password", label: "Password", type: "password" },
  ];

  function handleFieldChange(key: keyof typeof editValues, value: string) {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  }

  function resetEditing() {
    setEditing(false);
    setFeedback(null);
    setEditValues({
      full_name: profile?.full_name ?? "",
      phone_number: profile?.phone_number ?? "",
      address: profile?.address ?? "",
      state: profile?.state ?? "",
      city: profile?.city ?? "",
      pincode: profile?.pincode ?? "",
      landmark: profile?.landmark ?? "",
      location_url: profile?.location_url ?? "",
      password: "",
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const { password, ...rest } = editValues;
    const payload: Parameters<typeof updateProfile>[0] = { ...rest };
    if (password.trim()) {
      payload.password = password;
    }
    const res = await updateProfile(payload);
    if (res.ok) {
      setProfile(res.data);
      setFeedback({
        type: "success",
        message: "Profile updated successfully.",
      });
      setEditing(false);
    } else {
      setFeedback({ type: "error", message: res.error ?? "Update failed." });
    }
    setSaving(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          background: "rgba(15,23,42,0.9)",
          borderRadius: 20,
          padding: 28,
          boxShadow: "0 20px 45px rgba(2,6,23,0.65)",
          border: "1px solid rgba(148,163,184,0.25)",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 800,
                fontSize: 24,
                margin: 0,
              }}
            >
              <img
                src="/pawreunite-logo.svg"
                alt="PawReunite logo"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
              <span>PawReunite</span>
            </div>
            <div style={{ opacity: 0.8, fontSize: 14 }}>Profile</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate("/user")}
              style={{
                border: "1px solid rgba(148,163,184,0.3)",
                borderRadius: 999,
                background: "rgba(15,23,42,0.4)",
                color: "white",
                padding: "6px 16px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Home
            </button>
            <button
              onClick={() => {
                if (editing) {
                  resetEditing();
                } else {
                  setEditing(true);
                  setFeedback(null);
                }
              }}
              style={{
                border: "1px solid rgba(94,234,212,0.45)",
                borderRadius: 999,
                background: "rgba(16,185,129,0.15)",
                color: "white",
                padding: "6px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              title={editing ? "Cancel editing" : "Edit profile"}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              {editing ? "Cancel" : "Edit"}
            </button>
            <div
              style={{
                border: "2px solid rgba(148,163,184,0.35)",
                borderRadius: "50%",
                width: 48,
                height: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(15,23,42,0.65)",
                overflow: "hidden",
              }}
              title={displayName}
            >
              <img
                src={avatarUrl}
                alt={displayName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
            </div>
          </div>
        </header>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: 18,
            borderRadius: 16,
            background: "rgba(15,23,42,0.65)",
            border: "1px solid rgba(99,102,241,0.35)",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6d5dfc, #58c4ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{displayName}</div>
            <div style={{ color: "rgba(226,232,240,0.9)" }}>{email}</div>
          </div>
        </div>

        <section
          style={{
            borderRadius: 14,
            padding: 18,
            background:
              "linear-gradient(135deg, rgba(56,189,248,0.18), rgba(129,140,248,0.16))",
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 14, opacity: 0.85 }}>Signed in as</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{displayName}</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>{email}</div>
        </section>

        {feedback && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 16px",
              borderRadius: 12,
              background:
                feedback.type === "success"
                  ? "rgba(34,197,94,0.15)"
                  : "rgba(248,113,113,0.15)",
              border:
                feedback.type === "success"
                  ? "1px solid rgba(34,197,94,0.4)"
                  : "1px solid rgba(248,113,113,0.4)",
              color: feedback.type === "success" ? "#4ade80" : "#f87171",
              fontWeight: 600,
            }}
          >
            {feedback.message}
          </div>
        )}

        <section
          style={{
            background: "rgba(8,13,31,0.85)",
            borderRadius: 14,
            padding: 18,
            marginBottom: 24,
            fontSize: 14,
          }}
        >
          {editing ? (
            <form
              onSubmit={handleSave}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {editableFields.map((field) => (
                <label
                  key={field.key}
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <span
                    style={{ color: "rgba(148,163,184,0.9)", fontWeight: 600 }}
                  >
                    {field.label}
                  </span>
                  {field.type === "textarea" ? (
                    <textarea
                      value={editValues[field.key]}
                      onChange={(e) =>
                        handleFieldChange(field.key, e.target.value)
                      }
                      style={{
                        background: "rgba(15,23,42,0.6)",
                        border: "1px solid rgba(148,163,184,0.3)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        color: "white",
                        fontSize: 14,
                        minHeight: 70,
                        resize: "vertical",
                      }}
                    />
                  ) : (
                    <input
                      type={field.type ?? "text"}
                      value={editValues[field.key]}
                      onChange={(e) =>
                        handleFieldChange(field.key, e.target.value)
                      }
                      style={{
                        background: "rgba(15,23,42,0.6)",
                        border: "1px solid rgba(148,163,184,0.3)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        color: "white",
                        fontSize: 14,
                      }}
                    />
                  )}
                </label>
              ))}
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
              >
                <button
                  type="button"
                  onClick={resetEditing}
                  style={{
                    border: "1px solid rgba(148,163,184,0.4)",
                    background: "transparent",
                    color: "white",
                    borderRadius: 999,
                    padding: "10px 20px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    border: "none",
                    background:
                      "linear-gradient(90deg, rgba(59,130,246,0.95), rgba(99,102,241,0.95))",
                    color: "white",
                    borderRadius: 999,
                    padding: "10px 24px",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {infoRows.map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    borderBottom: "1px solid rgba(148,163,184,0.2)",
                    paddingBottom: 8,
                  }}
                >
                  <div style={{ color: "rgba(148,163,184,0.9)" }}>
                    {row.label}
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      textAlign: "right",
                      flex: "0 0 55%",
                    }}
                  >
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={() => {
              clearTokens();
              navigate("/", { replace: true });
            }}
            style={{
              padding: "12px 32px",
              borderRadius: 999,
              border: "none",
              background:
                "linear-gradient(90deg, rgba(248,113,113,0.95), rgba(239,68,68,0.95))",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
