// src/pages/AdminHome.tsx
import React, { useEffect, useState } from "react";
import { getProfile, clearTokens } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function AdminHome() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const res = await getProfile();
      if (!mounted) return;
      if (res.ok) setProfile(res.data);
      else { clearTokens(); navigate("/", { replace: true }); }
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div style={{ padding: 40 }}>Loading admin profile...</div>;

  return (
    <div style={{ padding: 24 }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          <img
            src="/pawreunite-logo.svg"
            alt="PawReunite logo"
            style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
          />
          <span>PawReunite</span>
        </div>
        <div style={{ fontWeight: 600 }}>Admin Dashboard</div>
      </header>
      <pre>{JSON.stringify(profile, null, 2)}</pre>
      <button onClick={() => { clearTokens(); navigate("/", { replace: true }); }}>Logout</button>
    </div>
  );
}
