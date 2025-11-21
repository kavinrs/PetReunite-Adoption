// src/pages/UserHome.tsx
import React, { useEffect, useRef, useState } from "react";
import { getProfile, clearTokens } from "../services/api";
import { useNavigate } from "react-router-dom";

type Tab = "owner" | "rescuer" | "adopter";

export default function UserHome() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("owner");
  const menuRef = useRef<HTMLDivElement | null>(null);
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
    function handleClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    if (menuOpen) {
      window.addEventListener("mousedown", handleClickOutside);
    } else {
      window.removeEventListener("mousedown", handleClickOutside);
    }
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (loading) return <div style={{ padding: 40 }}>Loading home...</div>;

  const displayName =
    profile?.full_name ??
    profile?.username ??
    profile?.user?.username ??
    "User";
  const avatarUrl = profile?.profile_photo || "/profile-avatar.svg";
  const email = profile?.user?.email ?? profile?.email ?? "";

  const tabItems: { id: Tab; label: string }[] = [
    { id: "owner", label: "Pet Owner" },
    { id: "rescuer", label: "Pet Rescuer" },
    { id: "adopter", label: "Pet Adopter" },
  ];

  const sidebarLinks = [
    {
      label: "Dashboard",
      icon: "🗂",
      onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
      accent: true,
    },
    {
      label: "Report Lost Pet",
      icon: "⚠️",
      onClick: () => navigate("/user/report-lost"),
    },
    {
      label: "Report Found Pet",
      icon: "🐾",
      onClick: () => navigate("/user/report-found"),
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#f6f7fb",
        fontFamily: "'Inter', sans-serif",
        color: "#0f172a",
      }}
    >
      <aside
        style={{
          width: 240,
          background: "#ffffff",
          borderRight: "1px solid rgba(15,23,42,0.08)",
          padding: 24,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/pawreunite-logo.svg"
            alt="PawReunite"
            style={{ width: 44, height: 44 }}
          />
          <div style={{ fontWeight: 800, fontSize: 20 }}>
            <div>PawReunite</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sidebarLinks.map((link) => (
            <button
              key={link.label}
              onClick={link.onClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontWeight: 600,
                padding: "12px 18px",
                borderRadius: 16,
                cursor: "pointer",
                border: "none",
                background: link.accent
                  ? "linear-gradient(135deg,#ff8a00,#ff2fab)"
                  : "transparent",
                color: link.accent ? "white" : "#0f172a",
                fontSize: 15,
                textAlign: "left",
                boxShadow: link.accent
                  ? "0 10px 25px rgba(255,138,0,0.35)"
                  : "none",
              }}
            >
              <span role="img" aria-label={link.label}>
                {link.icon}
              </span>
              {link.label}
            </button>
          ))}
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "32px 40px",
          boxSizing: "border-box",
          gap: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 30, fontWeight: 800 }}>Dashboard</div>
            <div style={{ color: "rgba(15,23,42,0.6)", marginTop: 4 }}>
              Manage your pet rescue activities
            </div>
          </div>

          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "white",
                borderRadius: 20,
                padding: "8px 16px",
                boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                border: "1px solid rgba(15,23,42,0.1)",
                cursor: "pointer",
                minWidth: 240,
                textAlign: "left",
              }}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <div
                style={{
                  borderRadius: "50%",
                  width: 44,
                  height: 44,
                  overflow: "hidden",
                  background: "linear-gradient(135deg,#6d5dfc,#58c4ff)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{displayName}</span>
                <span style={{ fontSize: 13, color: "rgba(15,23,42,0.6)" }}>{email}</span>
              </div>
              <span style={{ fontSize: 18, color: "rgba(15,23,42,0.5)" }}>
                {menuOpen ? "▴" : "▾"}
              </span>
            </button>
            {menuOpen && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "120%",
                  right: 0,
                  width: 220,
                  background: "white",
                  borderRadius: 16,
                  boxShadow: "0 16px 40px rgba(15,23,42,0.2)",
                  padding: 14,
                  color: "#0f172a",
                  zIndex: 10,
                }}
              >
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700 }}>{displayName}</div>
                  <div style={{ fontSize: 12, color: "rgba(15,23,42,0.6)" }}>
                    {email}
                  </div>
                </div>
                <div
                  style={{
                    height: 1,
                    background: "rgba(15,23,42,0.08)",
                    marginBottom: 10,
                  }}
                />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/user/profile");
                  }}
                  style={{
                    width: "100%",
                    border: "1px solid rgba(99,102,241,0.4)",
                    background: "rgba(99,102,241,0.15)",
                    color: "#312e81",
                    borderRadius: 12,
                    padding: "12px 12px",
                    cursor: "pointer",
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    clearTokens();
                    navigate("/", { replace: true });
                  }}
                  style={{
                    width: "100%",
                    border: "1px solid rgba(248,113,113,0.6)",
                    background: "rgba(248,113,113,0.2)",
                    borderRadius: 12,
                    padding: "12px 12px",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: "#b91c1c",
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 24px 60px rgba(15,23,42,0.08)",
            border: "1px solid rgba(15,23,42,0.05)",
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          

          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Lost Pets</div>
            <div style={{ color: "rgba(15,23,42,0.6)" }}>
              Report and manage your lost pets
            </div>
          </div>

          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            {[
              {
                title: "Report Lost Pet",
                description: "Let the community know about a missing pet.",
                cta: "Report Lost Pet",
                onClick: () => navigate("/user/report-lost"),
                gradient: "linear-gradient(135deg,#ff8a00,#ff2fab)",
              },
              {
                title: "Report Found Pet",
                description: "Share details about a pet you found.",
                cta: "Report Found Pet",
                onClick: () => navigate("/user/report-found"),
                gradient: "linear-gradient(135deg,#16a34a,#22c55e)",
              },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  flex: "1 1 280px",
                  borderRadius: 20,
                  border: "1px solid rgba(15,23,42,0.08)",
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  background: "rgba(15,23,42,0.01)",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 20 }}>{card.title}</div>
                <div style={{ color: "rgba(15,23,42,0.6)", flex: 1 }}>
                  {card.description}
                </div>
                <button
                  onClick={card.onClick}
                  style={{
                    border: "none",
                    borderRadius: 14,
                    padding: "10px 16px",
                    color: "white",
                    fontWeight: 700,
                    background: card.gradient,
                    cursor: "pointer",
                  }}
                >
                  {card.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
