// src/components/PrivateRoute.tsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAccessToken, getProfile } from "../services/api";
import { getProfile as fetchProfile } from "../services/api";

type Props = { children: React.ReactNode; role?: "admin" | "user" };

export default function PrivateRoute({ children, role = "user" }: Props) {
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function check() {
      setLoading(true);
      const token = getAccessToken();
      if (!token) { if (mounted) { setOk(false); setLoading(false); } return; }

      // fetch profile to confirm token valid and role
      const res = await fetchProfile();
      if (!mounted) return;
      if (res.ok) {
        const profile = res.data;
        // backend returns profile.user? or structure from serializer; check role
        const userRole = profile?.role ?? profile?.user?.profile?.role ?? profile?.user?.role; // tolerant
        const isAdmin = profile?.user?.is_staff || profile?.user?.is_superuser || userRole === "admin";
        if (role === "admin") {
          setOk(!!isAdmin);
        } else {
          setOk(true);
        }
      } else {
        setOk(false);
      }
      setLoading(false);
    }
    check();
    return () => { mounted = false; };
  }, [role]);

  if (loading) return <div style={{padding:40}}>Checking authentication...</div>;
  if (!ok) return <Navigate to="/" replace />;
  return <>{children}</>;
}
