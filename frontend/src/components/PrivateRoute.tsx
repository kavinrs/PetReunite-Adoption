
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAccessToken, getProfile } from "../services/api";

type Props = { children: React.ReactNode; role?: "admin" | "user" };

export default function PrivateRoute({ children, role = "user" }: Props) {
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function check() {
      setLoading(true);
      const token = getAccessToken();
      console.log(
        "PrivateRoute: Checking token:",
        token ? "Token exists" : "No token found",
      );
      if (!token) {
        if (mounted) {
          setOk(false);
          setLoading(false);
        }
        return;
      }

      
      const res = await getProfile();
      console.log("PrivateRoute: Profile response:", res);
      if (!mounted) return;
      if (res.ok) {
        const profile = res.data;
        console.log("PrivateRoute: Profile data structure:", profile);

        
        
        const userRole = profile?.role; 
        const isAdmin =
          profile?.user?.is_staff ||
          profile?.user?.is_superuser ||
          userRole === "admin";

        console.log(
          "PrivateRoute: User role:",
          userRole,
          "Is admin:",
          isAdmin,
          "Required role:",
          role,
        );

        if (role === "admin") {
          setOk(!!isAdmin);
        } else {
          setOk(true); 
        }
      } else {
        console.log("PrivateRoute: Profile fetch failed, redirecting to home");
        setOk(false);
      }
      setLoading(false);
    }
    check();
    return () => {
      mounted = false;
    };
  }, [role]);

  if (loading)
    return <div style={{ padding: 40 }}>Checking authentication...</div>;
  if (!ok) return <Navigate to="/" replace />;
  return <>{children}</>;
}
