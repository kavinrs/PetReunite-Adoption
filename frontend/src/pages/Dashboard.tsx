// src/pages/Dashboard.tsx
import React, { useState } from "react";
import { userLogin, adminLogin, registerUser } from "../services/api";
import { useNavigate } from "react-router-dom";

const SearchIcon = () => (
  <div
    style={{
      width: 64,
      height: 64,
      margin: "0 auto 16px",
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg,#39a2ff,#2eb3f8)",
    }}
  >
    <svg width="28" height="28" viewBox="0 0 24 24" stroke="#fff" fill="none" strokeWidth="2">
      <circle cx="11" cy="11" r="6" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  </div>
);

const HeartIcon = () => (
  <div
    style={{
      width: 64,
      height: 64,
      margin: "0 auto 16px",
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg,#ff6aa1,#ff3f90)",
    }}
  >
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
      <path d="M20.8 6.6c-1.6-1.8-4.3-1.9-6-.2l-.9.9-.9-.9c-1.7-1.7-4.4-1.6-6 .2-1.9 2.1-1.8 5.6.2 7.6L12 20.3l6.5-6.5c2-2 2.1-5.5.3-7.2z" />
    </svg>
  </div>
);

const ShieldIcon = () => (
  <div
    style={{
      width: 64,
      height: 64,
      margin: "0 auto 16px",
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg,#2ed573,#12c26a)",
    }}
  >
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
      <path d="M12 3l7 3v5c0 5-3.6 9.8-7 11-3.4-1.2-7-6-7-11V6l7-3z" />
    </svg>
  </div>
);

const PeopleIcon = () => (
  <div
    style={{
      width: 64,
      height: 64,
      margin: "0 auto 16px",
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg,#8b5cf6,#6a5af9)",
    }}
  >
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
      <path d="M12 12a3 3 0 100-6 3 3 0 000 6zm6 1a4 4 0 00-8 0v1h8v-1zM6 13a4 4 0 00-4 4v1h8v-1a4 4 0 00-4-4z" />
    </svg>
  </div>
);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    "home" | "userlogin" | "adminlogin"
  >("userlogin");

  // simplified: default background placed in public/dashboard.png
  const bgFile = "/bg2.jpeg";

  const [loading, setLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // user login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  // admin
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

  // inline register state
  const [reg, setReg] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    state: "",
    city: "",
    address: "",
    pincode: "",
  });

  const navigate = useNavigate();

  async function handleUserLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setServerMsg(null);
    setLoading(true);
    
    try {
      console.log('Attempting login with:', { username });
      const res = await userLogin(username, password);
      console.log('Login response:', res);
      
      if (res.ok) {
        console.log('Login successful, navigating to /user');
        // Force a hard navigation to ensure the page refreshes
        window.location.href = '/user';
      } else {
        const errorMessage = res.status === 401
          ? "Incorrect username or password"
          : res.error || "Login failed";
        console.error('Login failed:', errorMessage);
        setErrorMsg(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Network error';
      console.error('Login error:', errorMessage, err);
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setServerMsg(null);
    setLoading(true);
    
    try {
      console.log('Attempting admin login with:', { username: adminUser });
      const res = await adminLogin(adminUser, adminPass);
      console.log('Admin login response:', res);
      
      if (res.ok) {
        console.log('Admin login successful, navigating to /admin');
        // Force a hard navigation to ensure the page refreshes
        window.location.href = '/admin';
      } else {
        const errorMessage = res.status === 401
          ? "Incorrect username or password"
          : res.error || "Admin login failed";
        console.error('Admin login failed:', errorMessage);
        setErrorMsg(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Network error';
      console.error('Admin login error:', errorMessage, err);
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
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
        setActiveTab("userlogin");
      } else setErrorMsg(res.error ?? "Registration failed");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }

  // ---------------- styles ----------------
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
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
    minHeight: "100vh",
    backgroundColor: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    padding: 24,
    overflowY: "auto",
  };

  const card: React.CSSProperties = {
    width: 420,
    maxWidth: "92vw",
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(8px)",
    padding: 32,
    borderRadius: 16,
    boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
    color: "white",
    zIndex: 2,
    border: "1px solid rgba(255,255,255,0.15)",
  };
  

  const titleStyle: React.CSSProperties = { textAlign: "center", margin: 0, marginBottom: 14, fontSize: 24, fontWeight: 700 };
  const input: React.CSSProperties = {
    width: "100%", padding: "10px 12px", marginTop: 10, borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "white",
    boxSizing: "border-box",
  };
  const btn: React.CSSProperties = {
    marginTop: 14, padding: "10px 14px", borderRadius: 8, border: "none",
    background: "#0b6aa0", color: "white", fontWeight: 700, cursor: "pointer",
  };
  const smallText: React.CSSProperties = { marginTop: 12, textAlign: "center", color: "rgba(255,255,255,0.85)" };
  const blueLink: React.CSSProperties = { color: "#4aa3ff", textDecoration: "underline", cursor: "pointer", fontWeight: 700 };

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
    borderRadius: 8,
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  };

  const menuBtnActive: React.CSSProperties = {
    background: "linear-gradient(90deg, rgba(10,120,180,0.18), rgba(10,120,180,0.08))",
    color: "#fff",
  };

  const brandBadge: React.CSSProperties = {
    position: "absolute",
    left: 16,
    top: 16,
    padding: "10px 18px",
    borderRadius: 12,
    background: "rgba(0,0,0,0.55)",
    color: "white",
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: 0.5,
    boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
    zIndex: 3,
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    gap: 10,
  };

  const MenuButton: React.FC<{ id: "home" | "userlogin" | "adminlogin"; label: string }> = ({ id, label }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        if (id !== "userlogin") setShowRegister(false);
      }}
      style={{
        ...menuBtnBase,
        ...(activeTab === id ? menuBtnActive : {}),
      }}
      aria-pressed={activeTab === id}
    >
      {label}
    </button>
  );

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
          <span>PawReunite</span>
        </div>
        {/* Top-right horizontal menu */}
        <nav style={topRightBar} aria-label="Main navigation">
          <MenuButton id="userlogin" label="User Login" />
          <MenuButton id="adminlogin" label="Admin Login" />
        </nav>

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
        fontSize: "48px",
        fontWeight: 700,
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
        marginTop: 10,
        fontSize: "22px",
        fontWeight: 400,
        opacity: 0.9,
      }}
    >
      Let's Reunite Them Together
    </h3>

    {/* Description */}
    <p
      style={{
        marginTop: 8,
        fontSize: "18px",
        opacity: 0.85,
        lineHeight: 1.6,
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
        onClick={() => setActiveTab("userlogin")}   // ← IMPORTANT: GO TO LOGIN
        style={{
          background: "linear-gradient(90deg, #ff8a00, #ff2fab)",
          border: "2px solid rgba(255,255,255,0.8)",
          padding: "12px 32px",
          borderRadius: 30,
          color: "white",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          width: 240,
        }}
      >
        Start Your Search →
      </button>
    </div>
  </div>
)}

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
                  fontSize: "48px",
                  fontWeight: 700,
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
                  marginTop: 10,
                  fontSize: "22px",
                  fontWeight: 400,
                  opacity: 0.9,
                }}
              >
                Let's Reunite Them Together
              </h3>

              {/* Description */}
              <p
                style={{
                  marginTop: 8,
                  fontSize: "18px",
                  opacity: 0.85,
                  lineHeight: 1.6,
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
                  onClick={() => setActiveTab("userlogin")}
                  style={{
                    background: "linear-gradient(90deg, #ff8a00, #ff2fab)",
                    border: "2px solid rgba(255,255,255,0.8)",
                    padding: "12px 32px",
                    borderRadius: 30,
                    color: "white",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    width: 240,
                  }}
                >
                  Start Your Search →
                </button>
              </div>
            </div>
          )}


{activeTab === "about" && (
  <div style={{ width: "100%", background: "#fff", color: "#0b1220", boxSizing: "border-box", padding: "80px 32px" }}>
    <div style={{ textAlign: "center", maxWidth: 750, margin: "0 auto 48px" }}>
      <h2 style={{ fontSize: 46, margin: 0, fontWeight: 800 }}>
        How We{" "}
        <span style={{ background: "linear-gradient(90deg,#ff8a00,#ff4fb0)", WebkitBackgroundClip: "text", color: "transparent" }}>
          Help
        </span>
      </h2>
      <div style={{ width: 100, height: 6, margin: "18px auto", borderRadius: 4, background: "linear-gradient(90deg,#ff8a00,#ff4fb0)" }} />
      <p style={{ margin: 0, fontSize: 20, color: "rgba(13,27,40,0.7)", lineHeight: 1.7 }}>
        Our platform provides everything you need to report, search, and reunite pets with their families.
      </p>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
        gap: 24,
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {[
        {
          title: "Search Lost Pets",
          description: "Browse our database of lost pets and help reunite them with their families.",
          icon: SearchIcon,
        },
        {
          title: "Report Found Pet",
          description: "Found a pet? Report it quickly and help us connect them with their owner.",
          icon: HeartIcon,
        },
        {
          title: "Rescue Support",
          description: "Professional rescue team ready to help with emergency pet situations.",
          icon: ShieldIcon,
        },
        {
          title: "Community Network",
          description: "Join thousands of pet lovers working together to keep pets safe.",
          icon: PeopleIcon,
        },
      ].map((card) => (
        <div
          key={card.title}
          style={{
            background: "#fff",
            borderRadius: 18,
            padding: "32px 28px",
            textAlign: "center",
            boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
          }}
        >
          <card.icon />
          <h4 style={{ margin: "18px 0 10px", fontSize: 20, fontWeight: 800 }}>{card.title}</h4>
          <p style={{ margin: 0, color: "rgba(13,27,40,0.65)", fontSize: 15, lineHeight: 1.6 }}>{card.description}</p>
        </div>
      ))}
    </div>
  </div>
)}




          {activeTab === "userlogin" && (
            <>
              <h2 style={titleStyle}>User Login</h2>

              {showRegister ? (
                <form onSubmit={handleRegister}>
                  <input style={input} placeholder="username" value={reg.username} onChange={(e)=>setReg(p=>({...p, username: e.target.value}))} required />
                  <input style={input} placeholder="email" value={reg.email} onChange={(e)=>setReg(p=>({...p, email: e.target.value}))} required />
                  <input style={input} type="password" placeholder="password" value={reg.password} onChange={(e)=>setReg(p=>({...p, password: e.target.value}))} required />
                  <input style={input} placeholder="full name" value={reg.full_name} onChange={(e)=>setReg(p=>({...p, full_name: e.target.value}))} required />
                  <input style={input} placeholder="phone number" value={reg.phone_number} onChange={(e)=>setReg(p=>({...p, phone_number: e.target.value}))} required />
                  <input style={input} placeholder="state" value={reg.state} onChange={(e)=>setReg(p=>({...p, state: e.target.value}))} required />
                  <input style={input} placeholder="city" value={reg.city} onChange={(e)=>setReg(p=>({...p, city: e.target.value}))} required />
                  <input style={input} placeholder="pincode" value={reg.pincode} onChange={(e)=>setReg(p=>({...p, pincode: e.target.value}))} required />
                  <textarea style={{...input, height:80}} placeholder="address" value={reg.address} onChange={(e)=>setReg(p=>({...p, address: e.target.value}))} required />
                  <button style={btn} type="submit" disabled={loading}>{loading ? "Registering..." : "Register"}</button>
                  <div style={{ textAlign: "center", marginTop: 12 }}>
                    <button type="button" onClick={()=>setShowRegister(false)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.85)", cursor: "pointer" }}>
                      Back to login
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <form onSubmit={handleUserLogin}>
                    <input style={input} placeholder="username" value={username} onChange={(e)=>setUsername(e.target.value)} required />
                    <input style={input} placeholder="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
                    <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                      <button style={btn} type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
                    </div>
                  </form>

                  <div style={smallText}>
                    New user?{" "}
                    <span style={blueLink} onClick={() => setShowRegister(true)}>
                      Register now
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === "adminlogin" && (
            <>
              <h2 style={titleStyle}>Admin Login</h2>
              <form onSubmit={handleAdminLogin}>
                <input style={input} placeholder="username" value={adminUser} onChange={(e)=>setAdminUser(e.target.value)} required />
                <input style={input} placeholder="password" type="password" value={adminPass} onChange={(e)=>setAdminPass(e.target.value)} required />
                <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                  <button style={btn} type="submit" disabled={loading}>{loading ? "Logging..." : "Login"}</button>
                </div>
              </form>

              <div style={smallText}>If you are an admin and cannot login contact your site administrator.</div>
            </>
          )}

          {errorMsg && <div style={{ marginTop: 14, color: "#ffb3b3", background: "rgba(0,0,0,0.45)", padding: 10, borderRadius: 8 }}>{errorMsg}</div>}
          {serverMsg && (
            <div
              style={{
                marginTop: 14,
                color: "#dfffe0",
                background: "rgba(0,0,0,0.45)",
                padding: 10,
                borderRadius: 8,
              }}
            >
              {serverMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

