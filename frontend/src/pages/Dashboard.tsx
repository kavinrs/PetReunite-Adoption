// src/pages/Dashboard.tsx
import React, { useState } from "react";
import { emailLogin, registerUser, adminRegister, getProfile } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";
const SearchIcon = () => (
  <div
    style={{
      width: 40,
      height: 40,
      margin: "0 auto 12px",
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg,#39a2ff,#2eb3f8)",
    }}
  >
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      stroke="#fff"
      fill="none"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  </div>
);

const HeartIcon = () => (
  <div
    style={{
      width: 40,
      height: 40,
      margin: "0 auto 12px",
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg,#ff6aa1,#ff3f90)",
    }}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
      <path d="M20.8 6.6c-1.6-1.8-4.3-1.9-6-.2l-.9.9-.9-.9c-1.7-1.7-4.4-1.6-6 .2-1.9 2.1-1.8 5.6.2 7.6L12 20.3l6.5-6.5c2-2 2.1-5.5.3-7.2z" />
    </svg>
  </div>
);

const ShieldIcon = () => (
  <div
    style={{
      width: 40,
      height: 40,
      margin: "0 auto 12px",
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg,#2ed573,#12c26a)",
    }}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
      <path d="M12 3l7 3v5c0 5-3.6 9.8-7 11-3.4-1.2-7-6-7-11V6l7-3z" />
    </svg>
  </div>
);

const PeopleIcon = () => (
  <div
    style={{
      width: 40,
      height: 40,
      margin: "0 auto 12px",
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg,#8b5cf6,#6a5af9)",
    }}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
      <path d="M12 12a3 3 0 100-6 3 3 0 000 6zm6 1a4 4 0 00-8 0v1h8v-1zM6 13a4 4 0 00-4 4v1h8v-1a4 4 0 00-4-4z" />
    </svg>
  </div>
);

export default function Dashboard() {
  // Apply viewport standardization to ensure consistent 100% scaling
  useViewportStandardization();

  const [activeTab, setActiveTab] = useState<"home" | "login">("login");

  // simplified: default background placed in public/dashboard.png
  const bgFile = "/bg2.jpeg";

  const [loading, setLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // user login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showUserPass, setShowUserPass] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerType, setRegisterType] = useState<"user" | "admin">("user");

  // admin login removed; using email-based login only

  const [adminVerifyStatus, setAdminVerifyStatus] = useState<
    "idle" | "verifying" | "success" | "not_found" | "error"
  >("idle");
  const [adminVerifyMsg, setAdminVerifyMsg] = useState("");
  const [adminVerifyLabel, setAdminVerifyLabel] = useState("Verify Email");

  // inline register state
  const [reg, setReg] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    state: "",
    city: "",
    landmark: "",
    address: "",
    pincode: "",
    location_url: "",
  });
  const [showRegPass, setShowRegPass] = useState(false);

  const [adminReg, setAdminReg] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    state: "",
    city: "",
    address: "",
    pincode: "",
    code: "",
  });

  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const navigate = useNavigate();

  async function handleUserLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setServerMsg(null);
    setLoading(true);

    try {
      const res = await emailLogin(email, password);

      if (res.ok) {
        console.log("Login successful, navigating to /user");
        console.log("Full login response data:", res.data);
        console.log(
          "Token saved:",
          localStorage.getItem("access_token") ? "Yes" : "No",
        );
        console.log(
          "Stored access token:",
          localStorage.getItem("access_token")?.substring(0, 20) + "...",
        );
        setServerMsg("✅ Login successful! Redirecting...");

        setTimeout(async () => {
          console.log("Testing profile fetch before navigation...");
          try {
            const profileTest = await getProfile();
            console.log("Profile test result:", profileTest);
            if (profileTest.ok) {
              const d = profileTest.data as any;
              const toAdmin = !!(
                d?.is_admin === true ||
                d?.user?.is_staff === true ||
                d?.user?.is_superuser === true ||
                d?.role === "admin"
              );
              navigate(toAdmin ? "/admin" : "/user");
              return;
            }
          } catch (error) {
            console.error("Profile test error:", error);
          }
          const toAdmin = !!res.data?.is_admin;
          navigate(toAdmin ? "/admin" : "/user");
        }, 1500);
      } else {
        const errorMessage =
          res.status === 401
            ? "Incorrect email or password"
            : res.status === 0
              ? "❌ Cannot connect to server. Please check if the backend is running on http://localhost:8000"
              : res.error || "Login failed";
        console.error("Login failed:", errorMessage);
        console.log("Full response:", res);
        setErrorMsg(errorMessage);
      }
    } catch (err: any) {
      const errorMessage =
        err?.message ||
        "Network error - Please check your connection and try again";
      console.error("Login error:", errorMessage, err);
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  

  async function handleAdminRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setServerMsg(null);
    setLoading(true);
    try {
      const res = await adminRegister(adminReg);
      if (res.ok) {
        setServerMsg("Admin registered successfully. Please login.");
        setShowRegister(false);
        setActiveTab("login");
      } else setErrorMsg(res.error ?? "Admin registration failed");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminEmailVerify(
    e: React.MouseEvent<HTMLButtonElement>,
  ) {
    e.preventDefault();

    const email = adminReg.email.trim();
    if (!email) {
      setAdminVerifyStatus("error");
      setAdminVerifyMsg("Please enter an email to verify.");
      setAdminVerifyLabel("Verify Email");
      (window as any).__adminInviteVerified = null;
      return;
    }

    try {
      setAdminVerifyStatus("verifying");
      setAdminVerifyMsg("Verifying email...");
      setAdminVerifyLabel("Verifying...");
      (window as any).__adminInviteVerified = null;

      const base = (import.meta as any).env?.VITE_API_BASE ?? "/api";
      const resp = await fetch(
        `${base}/admin/verify-email/?email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        },
      );

      let data: any = null;
      try {
        data = await resp.json();
      } catch {
        data = null;
      }

      if (!resp.ok || !data || typeof data !== "object") {
        setAdminVerifyStatus("error");
        setAdminVerifyMsg("Server error — try again later");
        setAdminVerifyLabel("Verify Email");
        (window as any).__adminInviteVerified = null;
        return;
      }

      if (data.exists === true) {
        setAdminVerifyStatus("success");
        setAdminVerifyMsg(
          "Admin email verified — admin code has been sent to your email.",
        );
        setAdminVerifyLabel("Verified ✓");
        (window as any).__adminInviteVerified = {
          email,
          code: "sent-via-email",
        };
        return;
      }

      if (data.exists === false) {
        setAdminVerifyStatus("not_found");
        setAdminVerifyMsg("Email not authorized for admin access");
        setAdminVerifyLabel("Not authorized ❌");
        (window as any).__adminInviteVerified = null;
        return;
      }

      setAdminVerifyStatus("error");
      setAdminVerifyMsg("Server error — try again later");
      setAdminVerifyLabel("Error");
      (window as any).__adminInviteVerified = null;
    } catch {
      setAdminVerifyStatus("error");
      setAdminVerifyMsg("Server error — try again later");
      setAdminVerifyLabel("Verify Email");
      (window as any).__adminInviteVerified = null;
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setServerMsg(null);
    setLoading(true);
    try {
      const res = await registerUser(reg);
      if (res.ok) {
        setServerMsg("Registered successfully. Please login.");
        setShowRegister(false);
        setActiveTab("login");
      } else setErrorMsg(res.error ?? "Registration failed");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }

  // ---------------- styles ----------------
  const containerStyle: React.CSSProperties = {
    height: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundImage: `url('${bgFile}')`,
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    fontFamily: "Inter, Arial, sans-serif",
    position: "relative",
  };

  const overlayStyle: React.CSSProperties = {
    width: "100%",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    padding: 32,
    overflow: "hidden",
  };

  const splitCard: React.CSSProperties = {
    width: "100%",
    maxWidth: "1180px",
    display: "grid",
    gridTemplateColumns: "minmax(380px,520px) minmax(380px,520px)",
    borderRadius: 18,
    boxShadow: "0 18px 45px rgba(15,23,42,0.12)",
    overflow: "hidden",
    margin: "0 auto",
  };

  const leftPane: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    background: "#ffffff",
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  };

  const rightPane: React.CSSProperties = {
    position: "relative",
    background: `url('/Jungle.jpeg')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    overflow: "hidden",
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  };

  const rightHero: React.CSSProperties = {
    position: "absolute",
    inset: 0,
  };

  const rightContent: React.CSSProperties = {
    position: "relative",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#2c3e50",
    padding: 40,
  };

  const card: React.CSSProperties = {
    width: "100%",
    maxWidth: 480,
    background: "white",
    padding: 36,
    borderRadius: 18,
    boxShadow: "0 18px 45px rgba(15,23,42,0.12)",
    color: "#0f172a",
    zIndex: 2,
    border: "1px solid #e5e7eb",
  };

  const titleStyle: React.CSSProperties = {
    textAlign: "center",
    margin: 0,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: 700,
  };
  const input: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    marginTop: 4,
    borderRadius: 6,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    color: "#0f172a",
    boxSizing: "border-box",
    fontSize: 12,
  };
  const btn: React.CSSProperties = {
    marginTop: 12,
    padding: "8px 14px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(90deg,#0ea5e9,#2563eb)",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(14,165,233,0.25)",
    fontSize: 12,
  };
  const smallText: React.CSSProperties = {
    marginTop: 10,
    textAlign: "center",
    color: "rgba(15,23,42,0.6)",
    fontSize: 11,
  };
  const blueLink: React.CSSProperties = {
    color: "#2563eb",
    textDecoration: "underline",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 11,
  };
  const label: React.CSSProperties = {
    display: "block",
    marginTop: 6,
    marginBottom: 2,
    fontSize: 11,
    fontWeight: 500,
    color: "rgba(15,23,42,0.8)",
  };
  const field: React.CSSProperties = { position: "relative" };
  const revealBtn: React.CSSProperties = {
    position: "absolute",
    right: 8,
    top: 10,
    padding: 5,
    borderRadius: 8,
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
    color: "#1f2937",
    cursor: "pointer",
  };
  const verifyBtn: React.CSSProperties = {
    padding: "5px 8px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: 10,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
  const verifySpinner: React.CSSProperties = {
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: "2px solid rgba(59,130,246,0.4)",
    borderTopColor: "#2563eb",
    animation: "spin 0.8s linear infinite",
  };
  const locationBtn: React.CSSProperties = {
    padding: "5px 8px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f1f5f9",
    color: "#0f172a",
    fontSize: 10,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
  // top-right horizontal menu styles
  const topRightBar: React.CSSProperties = {
    position: "absolute",
    right: 16,
    top: 16,
    display: "flex",
    gap: 12,
    background: "rgba(0,0,0,0.45)",
    padding: "8px 12px",
    borderRadius: 12,
    alignItems: "center",
    zIndex: 3,
    boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
  };

  const menuBtnBase: React.CSSProperties = {
    background: "transparent",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  };

  const menuBtnActive: React.CSSProperties = {
    background:
      "linear-gradient(90deg, rgba(10,120,180,0.18), rgba(10,120,180,0.08))",
    color: "#fff",
  };

  const topRightText: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
  };

  const topRightLink: React.CSSProperties = {
    background: "transparent",
    border: "none",
    padding: "3px 6px",
    marginLeft: 3,
    color: "#38bdf8",
    fontWeight: 600,
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: 13,
  };

  const brandBadge: React.CSSProperties = {
    position: "absolute",
    left: 12,
    top: 12,
    padding: "6px 12px",
    borderRadius: 8,
    background: "rgba(0,0,0,0.55)",
    color: "white",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: 0.3,
    boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
    zIndex: 3,
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    gap: 10,
  };
  const adminVerifyColor =
    adminVerifyStatus === "success"
      ? "#16a34a"
      : adminVerifyStatus === "not_found" || adminVerifyStatus === "error"
        ? "#b91c1c"
        : "#6b7280";

  function handleUseCurrentLocation() {
    setLocError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocError("Location is not supported in this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setReg((prev) => ({ ...prev, location_url: url }));
        setLocating(false);
      },
      (error) => {
        console.error("Geolocation error", error);
        setLocError(error?.message || "Unable to detect location.");
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }

  // ---------------- render ----------------
  return (
    <div style={containerStyle}>
      <div style={overlayStyle}>
        <div style={brandBadge}>
          <img
            src="/pawreunite-logo.svg"
            alt="PawReunite logo"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              objectFit: "cover",
              backgroundColor: "rgba(15,23,42,0.9)",
            }}
          />
          <span>PetReunite</span>
        </div>
        <nav style={topRightBar} aria-label="Main navigation">
          <button
            type="button"
            onClick={() => navigate("/")}
            style={menuBtnBase}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setShowRegister(false);
            }}
            style={{
              ...menuBtnBase,
              ...(activeTab === "login" && !showRegister
                ? menuBtnActive
                : {}),
            }}
          >
            Login
          </button>
          <div style={topRightText}>
            <span>Don't have an account?</span>
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setRegisterType("user");
                setShowRegister(true);
              }}
              style={topRightLink}
            >
              Sign up
            </button>
          </div>
        </nav>

        <div style={splitCard}>
          <div style={leftPane}>
            <div style={card}>
              {/* NOTE: removed the in-card toggle buttons so the card only shows the selected page */}

              {activeTab === "home" && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "white",
                    maxWidth: 800,
                    margin: "0 auto",
                  }}
                >
                  {/* Heading */}
                  <h1
                    style={{
                      fontSize: "28px",
                      fontWeight: 600,
                      lineHeight: "1.2",
                    }}
                  >
                    Lost a Pet?{" "}
                    <span
                      style={{
                        background: "linear-gradient(90deg, #ff6a00, #ff2fab)",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      Found a Friend?
                    </span>
                  </h1>

                  {/* Subheading */}
                  <h3
                    style={{
                      marginTop: 8,
                      fontSize: "16px",
                      fontWeight: 400,
                      opacity: 0.9,
                    }}
                  >
                    Let's Reunite Them Together
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      marginTop: 6,
                      fontSize: "14px",
                      opacity: 0.85,
                      lineHeight: 1.5,
                    }}
                  >
                    Helping lost pets find their way home through our caring
                    community network.
                  </p>

                  {/* ONLY ONE BUTTON — Start Your Search */}
                  <div
                    style={{
                      marginTop: 30,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "18px",
                    }}
                  >
                    <button
                      onClick={() => setActiveTab("login")}
                      style={{
                        background: "linear-gradient(90deg, #ff8a00, #ff2fab)",
                        border: "1px solid rgba(255,255,255,0.8)",
                        padding: "8px 20px",
                        borderRadius: 20,
                        color: "white",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
                        width: 180,
                      }}
                    >
                      Start Your Search →
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "login" && showRegister && (
                  <div>
                    <h2 style={titleStyle}>Register</h2>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
                      <button
                        type="button"
                        onClick={() => setRegisterType("user")}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 20,
                          border: "1px solid #e5e7eb",
                          background: registerType === "user" ? "#eef2ff" : "#fff",
                          color: registerType === "user" ? "#1d4ed8" : "#0f172a",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        User Register
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegisterType("admin")}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 20,
                          border: "1px solid #e5e7eb",
                          background: registerType === "admin" ? "#fee2e2" : "#fff",
                          color: registerType === "admin" ? "#b91c1c" : "#0f172a",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Admin Register
                      </button>
                    </div>
                    {registerType === "user" ? (
                    <form onSubmit={handleRegister}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px 12px",
                      }}
                    >
                      <div>
                        <label style={label}>Username</label>
                        <input
                          style={input}
                          placeholder="username"
                      value={reg.username}
                      onChange={(e) =>
                        setReg((p) => ({ ...p, username: e.target.value }))
                      }
                      required
                    />
                      </div>
                      <div>
                        <label style={label}>Email</label>
                        <input
                          style={input}
                          type="email"
                          placeholder="email"
                          value={reg.email}
                          onChange={(e) =>
                            setReg((p) => ({ ...p, email: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <label style={label}>Password</label>
                        <div style={field}>
                          <input
                            style={input}
                            type={showRegPass ? "text" : "password"}
                            placeholder="password"
                            value={reg.password}
                            onChange={(e) =>
                              setReg((p) => ({
                                ...p,
                                password: e.target.value,
                              }))
                            }
                            required
                          />
                          <button
                            type="button"
                            style={revealBtn}
                            aria-label={
                              showRegPass ? "Hide password" : "Show password"
                            }
                            onClick={() => setShowRegPass((p) => !p)}
                          >
                            {showRegPass ? (
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                />
                                <circle
                                  cx="8"
                                  cy="8"
                                  r="2"
                                  fill="currentColor"
                                />
                                <line
                                  x1="2"
                                  y1="2"
                                  x2="14"
                                  y2="14"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                />
                              </svg>
                            ) : (
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                />
                                <circle
                                  cx="8"
                                  cy="8"
                                  r="2"
                                  fill="currentColor"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label style={label}>Full Name</label>
                        <input
                          style={input}
                          placeholder="full name"
                          value={reg.full_name}
                          onChange={(e) =>
                            setReg((p) => ({ ...p, full_name: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <label style={label}>Phone Number</label>
                        <input
                          style={input}
                          placeholder="phone number"
                          value={reg.phone_number}
                          onChange={(e) =>
                            setReg((p) => ({
                              ...p,
                              phone_number: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <label style={label}>State</label>
                        <input
                          style={input}
                          placeholder="state"
                          value={reg.state}
                          onChange={(e) =>
                            setReg((p) => ({ ...p, state: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <label style={label}>City</label>
                        <input
                          style={input}
                          placeholder="city"
                          value={reg.city}
                          onChange={(e) =>
                            setReg((p) => ({ ...p, city: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <label style={label}>Landmark</label>
                        <input
                          style={input}
                          placeholder="nearby landmark"
                          value={reg.landmark}
                          onChange={(e) =>
                            setReg((p) => ({ ...p, landmark: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label style={label}>Pincode</label>
                        <input
                          style={input}
                          placeholder="pincode"
                          value={reg.pincode}
                          onChange={(e) =>
                            setReg((p) => ({ ...p, pincode: e.target.value }))
                          }
                          required
                        />
                      </div>
                    </div>
                    <label style={label}>Location URL (Google Maps link)</label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) auto",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <input
                        style={input}
                        placeholder="https://maps.google.com/..."
                        value={reg.location_url}
                        onChange={(e) =>
                          setReg((p) => ({
                            ...p,
                            location_url: e.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        style={{
                          ...locationBtn,
                          opacity: locating ? 0.7 : 1,
                          cursor: locating ? "default" : "pointer",
                        }}
                        disabled={locating}
                      >
                        {locating ? "Detecting..." : "Use my location"}
                      </button>
                    </div>
                    {locError && (
                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 10,
                          color: "#b91c1c",
                        }}
                      >
                    {locError}
                      </div>
                    )}
                    <label style={label}>Address</label>
                    <textarea
                      style={{ ...input, height: 100 }}
                      placeholder="address"
                      value={reg.address}
                      onChange={(e) =>
                        setReg((p) => ({ ...p, address: e.target.value }))
                      }
                      required
                    />
                    <button style={btn} type="submit" disabled={loading}>
                      {loading ? "Registering..." : "Register"}
                    </button>
                    <div style={{ textAlign: "center", marginTop: 12 }}>
                      <button
                        type="button"
                        onClick={() => setShowRegister(false)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "rgba(15,23,42,0.7)",
                          cursor: "pointer",
                        }}
                      >
                        Back to login
                      </button>
                    </div>
                    </form>
                    ) : (
                      <form onSubmit={handleAdminRegister}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "8px 12px",
                          }}
                        >
                          <div>
                            <label style={label}>Username</label>
                            <input
                              style={input}
                              placeholder="username"
                              value={adminReg.username}
                              onChange={(e) =>
                                setAdminReg((p) => ({
                                  ...p,
                                  username: e.target.value,
                                }))
                              }
                              required
                            />
                          </div>
                          <div>
                            <label style={label}>Email</label>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(0, 1fr) auto",
                                gap: 8,
                                alignItems: "center",
                              }}
                            >
                              <input
                                style={input}
                                type="email"
                                placeholder="email"
                                value={adminReg.email}
                                onChange={(e) =>
                                  setAdminReg((p) => ({
                                    ...p,
                                    email: e.target.value,
                                  }))
                                }
                                required
                              />
                              <button
                                type="button"
                                onClick={handleAdminEmailVerify}
                                style={{
                                  ...locationBtn,
                                  color: adminVerifyColor,
                                }}
                              >
                                {adminVerifyLabel}
                              </button>
                            </div>
                            {adminVerifyMsg && (
                              <div
                                style={{ marginTop: 3, fontSize: 10, color: adminVerifyColor }}
                              >
                                {adminVerifyMsg}
                              </div>
                            )}
                          </div>
                          <div>
                            <label style={label}>Password</label>
                            <div style={field}>
                              <input
                                style={input}
                                type={showRegPass ? "text" : "password"}
                                placeholder="password"
                                value={adminReg.password}
                                onChange={(e) =>
                                  setAdminReg((p) => ({
                                    ...p,
                                    password: e.target.value,
                                  }))
                                }
                                required
                              />
                              <button
                                type="button"
                                style={revealBtn}
                                aria-label={
                                  showRegPass ? "Hide password" : "Show password"
                                }
                                onClick={() => setShowRegPass((p) => !p)}
                              >
                                {showRegPass ? (
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5"
                                      stroke="currentColor"
                                      strokeWidth="1.6"
                                    />
                                    <circle cx="8" cy="8" r="2" fill="currentColor" />
                                    <line
                                      x1="2"
                                      y1="2"
                                      x2="14"
                                      y2="14"
                                      stroke="currentColor"
                                      strokeWidth="1.6"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5"
                                      stroke="currentColor"
                                      strokeWidth="1.6"
                                    />
                                    <circle cx="8" cy="8" r="2" fill="currentColor" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label style={label}>Full Name</label>
                            <input
                              style={input}
                              placeholder="full name"
                              value={adminReg.full_name}
                              onChange={(e) =>
                                setAdminReg((p) => ({
                                  ...p,
                                  full_name: e.target.value,
                                }))
                              }
                              required
                            />
                          </div>
                          <div>
                            <label style={label}>Phone Number</label>
                            <input
                              style={input}
                              placeholder="phone number"
                              value={adminReg.phone_number}
                              onChange={(e) =>
                                setAdminReg((p) => ({
                                  ...p,
                                  phone_number: e.target.value,
                                }))
                              }
                              required
                            />
                          </div>
                          <div>
                            <label style={label}>State</label>
                            <input
                              style={input}
                              placeholder="state"
                              value={adminReg.state}
                              onChange={(e) =>
                                setAdminReg((p) => ({ ...p, state: e.target.value }))
                              }
                              required
                            />
                          </div>
                          <div>
                            <label style={label}>City</label>
                            <input
                              style={input}
                              placeholder="city"
                              value={adminReg.city}
                              onChange={(e) =>
                                setAdminReg((p) => ({ ...p, city: e.target.value }))
                              }
                              required
                            />
                          </div>
                          <div>
                            <label style={label}>Pincode</label>
                            <input
                              style={input}
                              placeholder="pincode"
                              value={adminReg.pincode}
                              onChange={(e) =>
                                setAdminReg((p) => ({
                                  ...p,
                                  pincode: e.target.value,
                                }))
                              }
                              required
                            />
                          </div>
                          <div style={{ gridColumn: "1 / -1" }}>
                            <label style={label}>Address</label>
                            <textarea
                              style={{ ...input, height: 100 }}
                              placeholder="address"
                              value={adminReg.address}
                              onChange={(e) =>
                                setAdminReg((p) => ({
                                  ...p,
                                  address: e.target.value,
                                }))
                              }
                              required
                            />
                          </div>
                          <div style={{ gridColumn: "1 / -1" }}>
                            <label style={label}>Admin Code</label>
                            <input
                              style={input}
                              placeholder="code (emailed after verify)"
                              value={adminReg.code}
                              onChange={(e) =>
                                setAdminReg((p) => ({
                                  ...p,
                                  code: e.target.value,
                                }))
                              }
                              required
                            />
                          </div>
                        </div>
                        <button style={btn} type="submit" disabled={loading}>
                          {loading ? "Registering..." : "Register as Admin"}
                        </button>
                        <div style={{ textAlign: "center", marginTop: 12 }}>
                          <button
                            type="button"
                            onClick={() => setShowRegister(false)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "rgba(15,23,42,0.7)",
                              cursor: "pointer",
                            }}
                          >
                            Back to login
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
              )}
              {activeTab === "login" && !showRegister && (
                <>
                  <h2 style={titleStyle}>Login</h2>
                  <form onSubmit={handleUserLogin}>
                    <label style={label}>Email</label>
                    <input
                      style={input}
                      type="email"
                      placeholder="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <label style={label}>Password</label>
                    <div style={field}>
                      <input
                        style={input}
                        placeholder="password"
                        type={showUserPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        style={revealBtn}
                        aria-label={
                          showUserPass ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowUserPass((p) => !p)}
                      >
                        {showUserPass ? (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5"
                              stroke="currentColor"
                              strokeWidth="1.6"
                            />
                            <circle cx="8" cy="8" r="2" fill="currentColor" />
                            <line
                              x1="2"
                              y1="2"
                              x2="14"
                              y2="14"
                              stroke="currentColor"
                              strokeWidth="1.6"
                            />
                          </svg>
                        ) : (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5"
                              stroke="currentColor"
                              strokeWidth="1.6"
                            />
                            <circle cx="8" cy="8" r="2" fill="currentColor" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <button style={btn} type="submit" disabled={loading}>
                      {loading ? "Logging in..." : "Login"}
                    </button>
                  </form>
                  <p style={smallText}>
                    Don't have an account?
                    <span
                      style={blueLink}
                      onClick={() => {
                        setRegisterType("user");
                        setShowRegister(true);
                      }}
                    >
                      Sign up
                    </span>
                  </p>
                  
                </>
              )}

              {(errorMsg || serverMsg) && (
                <p
                  style={{
                    marginTop: 16,
                    padding: 12,
                    borderRadius: 8,
                    background: errorMsg ? "#fee2e2" : "#d1fae5",
                    color: errorMsg ? "#b91c1c" : "#059669",
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: 15,
                    border: errorMsg
                      ? "1px solid #fecaca"
                      : "1px solid #a7f3d0",
                  }}
                >
                  {errorMsg || serverMsg}
                </p>
              )}
            </div>
          </div>
          <div style={rightPane}>
            <div style={rightContent}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2c3e50"
                strokeWidth="1.5"
                style={{ marginBottom: 16 }}
              >
                <path d="M22 2L11 13"></path>
                <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
              </svg>
              <h2 style={{ fontSize: 36, fontWeight: 800, margin: 0 }}>
                Welcome to PetReunite
              </h2>
              <p style={{ marginTop: 8, opacity: 0.85, maxWidth: 320 }}>
                Our community helps bring lost pets back to their loving homes.
                Every share, post, and view counts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
