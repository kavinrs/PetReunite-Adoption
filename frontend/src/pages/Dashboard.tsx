// src/pages/Dashboard.tsx
import React, { useState } from "react";
import { userLogin, adminLogin, registerUser } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    "home" | "about" | "userlogin" | "adminlogin"
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
      const res = await userLogin(username, password);
      if (res.ok) {
        setServerMsg(res.data);
        navigate("/user");
      } else setErrorMsg(res.error ?? "Login failed");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Network error");
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
      const res = await adminLogin(adminUser, adminPass);
      if (res.ok) {
        setServerMsg(res.data);
        navigate("/admin");
      } else setErrorMsg(res.error ?? "Admin login failed");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Network error");
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
        setServerMsg({ message: "Registered. Please login." });
        setUsername(reg.username);
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
  };

  const card: React.CSSProperties = {
    width: 420,
    maxWidth: "92vw",
    background: "rgba(0,0,0,0.45)",          // MATCH RIGHT MENUBAR
    backdropFilter: "blur(8px)",              // glass effect
    padding: 32,
    borderRadius: 16,                         // slightly softer corners
    boxShadow: "0 6px 18px rgba(0,0,0,0.6)",  // MATCH RIGHT MENUBAR
    color: "white",
    zIndex: 2,
    border: "1px solid rgba(255,255,255,0.15)" // optional thin border
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

  const MenuButton: React.FC<{ id: "home" | "about" | "userlogin" | "adminlogin"; label: string }> = ({ id, label }) => (
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
        {/* Top-right horizontal menu */}
        <nav style={topRightBar} aria-label="Main navigation">
          <MenuButton id="home" label="Home" />
          <MenuButton id="about" label="About us" />

          {/* Only show the login button(s) that are NOT currently active:
              - When userlogin is active hide the admin button inside the top bar? 
                (BUT user requested: when user selected, the center should not show admin — 
                 we keep both top buttons visible but the center shows only the selected one.
                 If you want to hide the opposite top button as well, say so and I'll update.)
          */}
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


{activeTab === "about" && (
  <div style={{ width: "100%", background: "#fff", color: "#111", boxSizing: "border-box", padding: "64px 32px" }}>
    {/* optional hero/banner (uses your uploaded image) */}
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto 36px",
        borderRadius: 12,
        overflow: "hidden",
        height: 0,
        // keep it visually subtle for the white design — height is 0 so it won't show unless you set it
        // If you want a visible banner, change height to 180 (example): height: 180
        backgroundImage: "url('/mnt/data/52032aef-5aea-44fe-b364-e83d2e460fd4.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />

    {/* heading */}
    <div style={{ textAlign: "center", maxWidth: 1100, margin: "0 auto 28px" }}>
      <h2 style={{ fontSize: 40, margin: 0, fontWeight: 800, color: "#0b1220" }}>
        How We{" "}
        <span
          style={{
            background: "linear-gradient(90deg,#ff8a00,#ff4fb0)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Help
        </span>
      </h2>

      <div
        style={{
          width: 90,
          height: 6,
          margin: "14px auto",
          borderRadius: 4,
          background: "linear-gradient(90deg,#ff8a00,#ff4fb0)",
        }}
      />

      <p style={{ marginTop: 8, fontSize: 18, color: "rgba(13,27,40,0.6)", lineHeight: 1.7 }}>
        Our platform provides everything you need to report, search, and reunite pets with their families.
      </p>
    </div>

    {/* cards grid */}
    <div
      style={{
        maxWidth: 1300,
        margin: "30px auto 0",
        display: "grid",
        gap: 28,
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        alignItems: "stretch",
      }}
    >
      {/* CARD: Search Lost Pets */}
      <div
        onClick={() => setActiveTab("userlogin")}
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 28,
          textAlign: "center",
          boxShadow: "0 12px 30px rgba(20,30,40,0.06)",
          transition: "transform 180ms ease, box-shadow 180ms ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e:any) => (e.currentTarget.style.transform = "translateY(-6px)")}
        onMouseLeave={(e:any) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        <div style={{
          width: 64, height: 64, margin: "0 auto 16px", borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(180deg,#39a2ff,#2eb3f8)"
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" stroke="#fff" fill="none" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="6" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <h4 style={{ margin: "6px 0 8px", fontSize: 18, fontWeight: 800 }}>Search Lost Pets</h4>
        <p style={{ margin: 0, color: "rgba(13,27,40,0.6)", fontSize: 15, lineHeight: 1.6 }}>
          Browse our database of lost pets and help reunite them with their families.
        </p>
      </div>

      {/* CARD: Report Found Pet */}
      <div
        onClick={() => setActiveTab("userlogin")}
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 28,
          textAlign: "center",
          boxShadow: "0 12px 30px rgba(20,30,40,0.06)",
          transition: "transform 180ms ease, box-shadow 180ms ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e:any) => (e.currentTarget.style.transform = "translateY(-6px)")}
        onMouseLeave={(e:any) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        <div style={{
          width: 64, height: 64, margin: "0 auto 16px", borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(180deg,#ff6aa1,#ff3f90)"
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.8 6.6c-1.6-1.8-4.3-1.9-6-.2l-.9.9-.9-.9c-1.7-1.7-4.4-1.6-6 .2-1.9 2.1-1.8 5.6.2 7.6L12 20.3l6.5-6.5c2-2 2.1-5.5.3-7.2z" />
          </svg>
        </div>
        <h4 style={{ margin: "6px 0 8px", fontSize: 18, fontWeight: 800 }}>Report Found Pet</h4>
        <p style={{ margin: 0, color: "rgba(13,27,40,0.6)", fontSize: 15, lineHeight: 1.6 }}>
          Found a pet? Report it quickly and help reconnect with the owner.
        </p>
      </div>

      {/* CARD: Rescue Support */}
      <div
        onClick={() => alert("Rescue support coming soon")}
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 28,
          textAlign: "center",
          boxShadow: "0 12px 30px rgba(20,30,40,0.06)",
          transition: "transform 180ms ease, box-shadow 180ms ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e:any) => (e.currentTarget.style.transform = "translateY(-6px)")}
        onMouseLeave={(e:any) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        <div style={{
          width: 64, height: 64, margin: "0 auto 16px", borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(180deg,#2ed573,#12c26a)"
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3l7 3v5c0 5-3.6 9.8-7 11-3.4-1.2-7-6-7-11V6l7-3z" />
          </svg>
        </div>
        <h4 style={{ margin: "6px 0 8px", fontSize: 18, fontWeight: 800 }}>Rescue Support</h4>
        <p style={{ margin: 0, color: "rgba(13,27,40,0.6)", fontSize: 15, lineHeight: 1.6 }}>
          Professional rescue teams ready to help in emergencies.
        </p>
      </div>

      {/* CARD: Community Network */}
      <div
        onClick={() => alert("Community features coming soon")}
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 28,
          textAlign: "center",
          boxShadow: "0 12px 30px rgba(20,30,40,0.06)",
          transition: "transform 180ms ease, box-shadow 180ms ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e:any) => (e.currentTarget.style.transform = "translateY(-6px)")}
        onMouseLeave={(e:any) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        <div style={{
          width: 64, height: 64, margin: "0 auto 16px", borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(180deg,#8b5cf6,#6a5af9)"
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12a3 3 0 100-6 3 3 0 000 6zm6 1a4 4 0 00-8 0v1h8v-1zM6 13a4 4 0 00-4 4v1h8v-1a4 4 0 00-4-4z" />
          </svg>
        </div>
        <h4 style={{ margin: "6px 0 8px", fontSize: 18, fontWeight: 800 }}>Community Network</h4>
        <p style={{ margin: 0, color: "rgba(13,27,40,0.6)", fontSize: 15, lineHeight: 1.6 }}>
          Join thousands of pet lovers working together to keep pets safe.
        </p>
      </div>
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
          {serverMsg && <div style={{ marginTop: 14, color: "#dfffe0", background: "rgba(0,0,0,0.45)", padding: 10, borderRadius: 8 }}><pre style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(serverMsg, null, 2)}</pre></div>}
        </div>
      </div>
    </div>
  );
}

