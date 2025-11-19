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
      <h2>Admin Dashboard</h2>
      <pre>{JSON.stringify(profile, null, 2)}</pre>
      <button onClick={() => { clearTokens(); navigate("/", { replace: true }); }}>Logout</button>
    </div>
  );
}
