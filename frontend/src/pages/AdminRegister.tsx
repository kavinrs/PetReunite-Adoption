// src/pages/AdminRegister.tsx
// Admin registration page with Verify Email + admin code auto-fill.
// NOTE: This component mirrors the Dashboard admin registration layout.
// Security: Returning invitation codes via AJAX is convenient but exposes secrets.
// Prefer sending codes via email instead; see comments at bottom of file.

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminRegister, type ApiResult } from "../services/api";

// Local API base (duplicated from services/api.ts for simplicity)
const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "/api";

type FormState = {
  username: string;
  fullName: string;
  email: string;
  adminCode: string;
  password: string;
  phone: string;
  state: string;
  city: string;
  pincode: string;
  address: string;
};

type VerifyStatus =
  | "idle"
  | "verifying"
  | "success"
  | "used"
  | "not_found"
  | "error";

declare global {
  interface Window {
    __adminInviteVerified?: { email: string; code: string } | null;
  }
}

const initialForm: FormState = {
  username: "",
  fullName: "",
  email: "",
  adminCode: "",
  password: "",
  phone: "",
  state: "",
  city: "",
  pincode: "",
  address: "",
};

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  width: "100vw",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#020617",
  padding: 24,
  boxSizing: "border-box",
};

const splitCard: React.CSSProperties = {
  width: "100%",
  maxWidth: 1120,
  display: "grid",
  gridTemplateColumns: "minmax(420px, 560px) minmax(360px, 520px)",
  borderRadius: 18,
  background: "rgba(15,23,42,0.96)",
  boxShadow: "0 24px 60px rgba(15,23,42,0.55)",
  overflow: "hidden",
};

const leftPane: React.CSSProperties = {
  background: "#ffffff",
  padding: 28,
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
};

const rightPane: React.CSSProperties = {
  position: "relative",
  background: "linear-gradient(180deg,#0ea5e9,#1d4ed8)",
  color: "#eaf2ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 40,
  boxSizing: "border-box",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 18,
  fontSize: 28,
  fontWeight: 800,
  textAlign: "center",
  color: "#0f172a",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginTop: 8,
  marginBottom: 4,
  fontSize: 13,
  fontWeight: 600,
  color: "rgba(15,23,42,0.8)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
  color: "#0f172a",
  boxSizing: "border-box",
  fontSize: 14,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 80,
  resize: "vertical" as const,
};

const rowTwoCols: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "0 16px",
};

const registerButtonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 16,
  padding: "11px 16px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(90deg,#0ea5e9,#2563eb)",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 14px 40px rgba(14,165,233,0.35)",
  fontSize: 15,
};

const inlineStatusStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
};

const emailRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 8,
  alignItems: "center",
};

const verifyButtonBase: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const spinnerStyle: React.CSSProperties = {
  width: 14,
  height: 14,
  borderRadius: "50%",
  border: "2px solid rgba(59,130,246,0.4)",
  borderTopColor: "#2563eb",
  animation: "spin 0.8s linear infinite",
};

// Minimal CSS hook classes (status + spinner). Actual styling can live in any CSS file.
// .status-success { color: #16a34a; }
// .status-error { color: #dc2626; }
// .status-warning { color: #d97706; }
// .spinner { border-radius: 9999px; border: 2px solid rgba(59,130,246,0.4); border-top-color: #2563eb; animation: spin 0.8s linear infinite; }

function AdminRegister() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [verifyMsg, setVerifyMsg] = useState<string>("");
  const [verifyLabel, setVerifyLabel] = useState<string>("Verify Email");

  const statusRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (statusRef.current && verifyMsg) {
      statusRef.current.focus();
    }
  }, [verifyMsg]);

  const onChange = (key: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));

    if (key === "email") {
      window.__adminInviteVerified = null;
      setVerifyStatus("idle");
      setVerifyMsg("");
      setVerifyLabel("Verify Email");
      setForm(prev => ({ ...prev, adminCode: "" }));
    }
  };

  async function handleVerifyEmail(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    const email = form.email.trim();
    if (!email) {
      setVerifyStatus("error");
      setVerifyMsg("Please enter an email to verify.");
      setVerifyLabel("Verify Email");
      window.__adminInviteVerified = null;
      return;
    }

    try {
      setVerifyStatus("verifying");
      setVerifyMsg("Verifying email...");
      setVerifyLabel("Verifying...");
      window.__adminInviteVerified = null;

      const encoded = encodeURIComponent(email);
      const resp = await fetch(
        `${API_BASE}/admin/verify-email/?email=${encoded}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      let data: any = null;
      try {
        data = await resp.json();
      } catch (err) {
        data = null;
      }

      if (!resp.ok || !data || typeof data !== "object") {
        setVerifyStatus("error");
        setVerifyMsg("Server error — try again later");
        setVerifyLabel("Verify Email");
        window.__adminInviteVerified = null;
        setForm(prev => ({ ...prev, adminCode: "" }));
        return;
      }

      if (data.exists === true) {
        // Superuser email matched – backend has sent the admin code via email.
        setVerifyStatus("success");
        setVerifyMsg("Admin email verified — admin code has been sent to your email.");
        setVerifyLabel("Verified ✓");
        // Do NOT auto-fill the adminCode field; user will copy it from their inbox.
        // We only store a generic flag so validateBeforeSubmit() can skip the warning.
        window.__adminInviteVerified = { email, code: "sent-via-email" };
        return;
      }

      if (data.exists === false) {
        setVerifyStatus("not_found");
        setVerifyMsg("Email not authorized for admin access");
        setVerifyLabel("Not authorized ❌");
        window.__adminInviteVerified = null;
        setForm(prev => ({ ...prev, adminCode: "" }));
        return;
      }

      setVerifyStatus("error");
      setVerifyMsg("Server error — try again later");
      setVerifyLabel("Error");
      window.__adminInviteVerified = null;
      setForm(prev => ({ ...prev, adminCode: "" }));
    } catch (err) {
      setVerifyStatus("error");
      setVerifyMsg("Server error — try again later");
      setVerifyLabel("Verify Email");
      window.__adminInviteVerified = null;
      setForm(prev => ({ ...prev, adminCode: "" }));
    }
  }

  function validateBeforeSubmit(): boolean {
    const email = form.email.trim();
    const v = window.__adminInviteVerified;
    if (!v) return false;
    return v.email === email && !!v.code;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const isVerified = validateBeforeSubmit();
    if (!isVerified) {
      const proceed = window.confirm(
        "Email is not verified. Server will likely reject this request. Do you still want to continue?"
      );
      if (!proceed) return;
    }

    setLoading(true);
    setFormMsg(null);

    const payload = {
      username: form.username,
      email: form.email,
      password: form.password,
      full_name: form.fullName,
      phone_number: form.phone,
      state: form.state,
      city: form.city,
      address: form.address,
      pincode: form.pincode,
      code: form.adminCode,
    };

    try {
      const res: ApiResult = await adminRegister(payload as any);
      if (res.ok) {
        setFormMsg("Admin registered successfully. Please login.");
        window.__adminInviteVerified = null;
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setFormMsg(res.error ?? "Admin registration failed");
      }
    } catch (err) {
      setFormMsg("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  const statusClassName =
    verifyStatus === "success"
      ? "status-success"
      : verifyStatus === "used" || verifyStatus === "not_found" || verifyStatus === "error"
      ? "status-error"
      : verifyStatus === "idle" || verifyStatus === "verifying"
      ? ""
      : "status-warning";

  return (
    <div style={containerStyle}>
      <div
        style={{
          ...splitCard,
          gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1.9fr)",
        }}
      >
        <div style={leftPane}>
          <h2 style={titleStyle}>Create Admin Account</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div style={rowTwoCols}>
              <div>
                <label style={labelStyle}>Username</label>
                <input
                  style={inputStyle}
                  required
                  placeholder="username"
                  value={form.username}
                  onChange={e => onChange("username", e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  style={inputStyle}
                  required
                  placeholder="full name"
                  value={form.fullName}
                  onChange={e => onChange("fullName", e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <label style={labelStyle}>Email</label>
              <div style={emailRow}>
                <input
                  style={inputStyle}
                  required
                  type="email"
                  placeholder="email"
                  value={form.email}
                  onChange={e => onChange("email", e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  style={{
                    ...verifyButtonBase,
                    opacity: verifyStatus === "verifying" ? 0.7 : 1,
                    cursor: verifyStatus === "verifying" ? "default" : "pointer",
                  }}
                  disabled={verifyStatus === "verifying"}
                >
                  {verifyStatus === "verifying" ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={spinnerStyle} className="spinner" />
                      Verifying...
                    </span>
                  ) : (
                    verifyLabel
                  )}
                </button>
              </div>
              <div
                ref={statusRef}
                tabIndex={-1}
                aria-live="polite"
                style={{ ...inlineStatusStyle }}
                className={statusClassName}
              >
                {verifyMsg}
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <label style={labelStyle}>Admin Code</label>
              <input
                style={inputStyle}
                required
                placeholder="admin code"
                value={form.adminCode}
                onChange={e => onChange("adminCode", e.target.value)}
              />
            </div>

            <div style={{ marginTop: 8 }}>
              <label style={labelStyle}>Password</label>
              <input
                style={inputStyle}
                required
                type="password"
                placeholder="password"
                value={form.password}
                onChange={e => onChange("password", e.target.value)}
              />
            </div>

            <div style={rowTwoCols}>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  style={inputStyle}
                  required
                  placeholder="phone number"
                  value={form.phone}
                  onChange={e => onChange("phone", e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input
                  style={inputStyle}
                  required
                  placeholder="state"
                  value={form.state}
                  onChange={e => onChange("state", e.target.value)}
                />
              </div>
            </div>

            <div style={rowTwoCols}>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  style={inputStyle}
                  required
                  placeholder="city"
                  value={form.city}
                  onChange={e => onChange("city", e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Pincode</label>
                <input
                  style={inputStyle}
                  required
                  placeholder="pincode"
                  value={form.pincode}
                  onChange={e => onChange("pincode", e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <label style={labelStyle}>Address</label>
              <textarea
                style={textareaStyle}
                required
                placeholder="address"
                value={form.address}
                onChange={e => onChange("address", e.target.value)}
              />
            </div>

            <button
              type="submit"
              style={registerButtonStyle}
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>

            {formMsg && (
              <div style={{ marginTop: 12, fontSize: 13 }}>{formMsg}</div>
            )}
          </form>
        </div>

        <div style={rightPane}>
          <div style={{ maxWidth: 380 }}>
            <h2
              style={{
                fontSize: 30,
                fontWeight: 800,
                margin: 0,
                letterSpacing: -0.5,
              }}
            >
              Welcome to PawReunite
            </h2>
            <p style={{ opacity: 0.9, marginTop: 10, lineHeight: 1.6 }}>
              Our trusted admins help keep the platform safe and effective for
              reuniting lost pets with their families. Use your authorized
              invitation email to activate admin access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminRegister;

// ---------------- Django pseudo-code (for reference) ----------------
// from django.http import JsonResponse
// from django.views.decorators.http import require_GET
// from django.views.decorators.csrf import csrf_exempt
// from .models import AdminInvitation  # example model: email, code, is_used, expires_at
// from django.utils import timezone
//
// @require_GET
// def get_invitation_code(request):
//     """Ajax endpoint: validate invitation email and (optionally) return code.
//
//     WARNING: Returning codes directly via JSON exposes secrets.
//     Prefer sending codes via email instead of including "code" in the response.
//     If you must return the code, ensure strict rate limiting and logging.
//     """
//     email = request.GET.get("email", "").strip().lower()
//     if not email:
//         return JsonResponse({"error": "Email is required"}, status=400)
//
//     try:
//         inv = AdminInvitation.objects.get(email=email)
//     except AdminInvitation.DoesNotExist:
//         return JsonResponse({"exists": False})
//
//     if inv.expires_at and inv.expires_at < timezone.now():
//         return JsonResponse({"exists": False})
//
//     data = {"exists": True, "is_used": inv.is_used}
//
//     if not inv.is_used:
//         # Less safe: expose code via JSON
//         data["code"] = inv.code
//         # Safer: instead, trigger an email with the code and DO NOT include it here.
//
//     return JsonResponse(data)
//
// @csrf_exempt
// def admin_register(request):
//     """Handle admin registration.
//
//     Server MUST validate that email + code match an unused AdminInvitation,
//     and mark the invitation as used immediately on success.
//     """
//     if request.method != "POST":
//         return JsonResponse({"error": "Method not allowed"}, status=405)
//
//     # Parse JSON or form data as appropriate
//     email = request.POST.get("email", "").strip().lower()
//     code = request.POST.get("code", "")
//
//     try:
//         inv = AdminInvitation.objects.get(email=email, code=code, is_used=False)
//     except AdminInvitation.DoesNotExist:
//         return JsonResponse({"error": "Invalid or used invitation"}, status=400)
//
//     # Create admin user + profile here, wrapped in a DB transaction.
//     # ...
//
//     inv.is_used = True
//     inv.save(update_fields=["is_used"])
//
//     return JsonResponse({"ok": True})
//
// ---------------- Security notes ----------------
// - Returning invitation codes via AJAX is convenient but exposes secrets.
// - Safer alternative: only return {"exists": true} and send the code to the
//   email address via a secure email channel, or use a one-time token link.
// - Always add server-side rate-limiting for /users/ajax/get-invitation/.
// - Log request origin (IP, user agent) for auditing.
// - Invitation codes should be one-time use AND time-limited.
// - On successful registration, mark AdminInvitation.is_used = True immediately.
//
// ---------------- Testing checklist ----------------
// 1. Verify email that exists & unused → code auto-fills, status "Invitation found — code auto-filled".
// 2. Verify email that exists & is_used → status "Invitation already used", admin code cleared.
// 3. Verify email that does not exist → status "Email not authorized for admin access", admin code cleared.
// 4. Simulate server/network error → status "Server error — try again later", admin code cleared.
// 5. Change email after verification → verify state resets and code clears.
// 6. Submit with unverified email → confirm dialog appears; server still validates and can reject.
// 7. Confirm that incorrect/missing code is rejected by the backend.
// 8. Confirm AdminInvitation.is_used becomes True after successful registration.
