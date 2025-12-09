import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Paper, Button, Chip, Avatar, TextField } from "@mui/material";
import { Check, Close, Search } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  fetchAdminLostReports,
  fetchAdminFoundReports,
  fetchAllAdoptionRequests,
  updateAdminLostReport,
  updateAdminFoundReport,
  updateAdoptionRequestStatus,
  getProfile,
  clearTokens,
} from "../../services/api";

// Combined item type for pending approvals across lost, found, and adoption

type PendingKind = "lost" | "found" | "adoption";

type PendingItem = {
  kind: PendingKind;
  id: number;
  status: string;
  title: string;
  subtitle: string;
  location: string;
  reporter: string;
  reporterEmail?: string;
  photoUrl?: string;
};

const KIND_FILTERS: (PendingKind | "all")[] = ["all", "lost", "found", "adoption"]; 

function resolvePhotoUrl(raw: any | undefined): string | undefined {
  if (!raw) return undefined;
  const s = String(raw);
  if (s.startsWith("http")) return s;
  const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "/api";
  const origin = /^https?:/.test(apiBase)
    ? new URL(apiBase).origin
    : "http://localhost:8000";
  if (s.startsWith("/")) return origin + s;
  if (s.startsWith("media/")) return origin + "/" + s;
  return origin + "/media/" + s.replace(/^\/+/, "");
}

export default function PendingApprovals() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [kindFilter, setKindFilter] = useState<(typeof KIND_FILTERS)[number]>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [profile, setProfile] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);

      const [lostRes, foundRes, adoptionRes] = await Promise.all([
        fetchAdminLostReports("pending"),
        fetchAdminFoundReports("pending"),
        fetchAllAdoptionRequests(),
      ]);

      if (!mounted) return;

      if (!lostRes.ok && !foundRes.ok && !adoptionRes.ok) {
        setError(lostRes.error || foundRes.error || adoptionRes.error || "Failed to load pending approvals");
        setLoading(false);
        return;
      }

      const nextItems: PendingItem[] = [];

      if (lostRes.ok) {
        for (const r of (lostRes.data ?? []) as any[]) {
          if (r.status !== "pending") continue;
          nextItems.push({
            kind: "lost",
            id: r.id,
            status: r.status,
            title: r.pet_name || r.pet_type,
            subtitle: r.breed || r.color || "",
            location: `${r.city}, ${r.state}`,
            reporter: r.reporter?.username || "Unknown",
            reporterEmail: r.reporter?.email,
            photoUrl: resolvePhotoUrl(r.photo_url || r.photo),
          });
        }
      }

      if (foundRes.ok) {
        for (const r of (foundRes.data ?? []) as any[]) {
          if (r.status !== "pending") continue;
          nextItems.push({
            kind: "found",
            id: r.id,
            status: r.status,
            title: r.pet_type,
            subtitle: r.breed || r.color || "",
            location: `${r.found_city}, ${r.state}`,
            reporter: r.reporter?.username || "Unknown",
            reporterEmail: r.reporter?.email,
            photoUrl: resolvePhotoUrl(r.photo_url || r.photo),
          });
        }
      }

      if (adoptionRes.ok) {
        for (const r of (adoptionRes.data ?? []) as any[]) {
          if (r.status !== "pending") continue;
          nextItems.push({
            kind: "adoption",
            id: r.id,
            status: r.status,
            title: r.pet?.name || "Adoption request",
            subtitle: [r.pet?.species, r.pet?.breed].filter(Boolean).join(" • "),
            location: `${r.pet?.location_city ?? ""}${r.pet?.location_city || r.pet?.location_state ? ", " : ""}${r.pet?.location_state ?? ""}`,
            reporter: r.requester?.username || "Unknown",
            reporterEmail: r.requester?.email,
            photoUrl: resolvePhotoUrl(r.pet?.photos || r.pet?.photo),
          });
        }
      }

      nextItems.sort((a, b) => a.title.localeCompare(b.title));

      setItems(nextItems);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [tick]);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const res = await getProfile();
      if (!mounted) return;
      if (!res.ok) {
        clearTokens();
        navigate("/", { replace: true });
        return;
      }
      setProfile(res.data);
    }

    loadProfile();

    const id = window.setInterval(() => setTick((t) => t + 1), 15000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [navigate]);

  const visible = useMemo(() => {
    let rows = items;
    if (kindFilter !== "all") {
      rows = rows.filter((r) => r.kind === kindFilter);
    }
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => {
      const text = [
        r.title,
        r.subtitle,
        r.location,
        r.reporter,
        r.reporterEmail,
        r.kind,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(term);
    });
  }, [items, kindFilter, search]);

  async function changeStatus(item: PendingItem, next: "approved" | "rejected") {
    setActionKey(`${item.kind}-${item.id}-${next}`);
    setError(null);

    let res;
    if (item.kind === "lost") {
      res = await updateAdminLostReport(item.id, { status: next });
    } else if (item.kind === "found") {
      res = await updateAdminFoundReport(item.id, { status: next });
    } else {
      res = await updateAdoptionRequestStatus(item.id, { status: next });
    }

    if (!res.ok) {
      setError(res.error || "Failed to update status");
    } else {
      setItems((prev) => prev.filter((r) => !(r.kind === item.kind && r.id === item.id)));
    }
    setActionKey(null);
  }

  const totalPending = items.length;
  const lostCount = items.filter((i) => i.kind === "lost").length;
  const foundCount = items.filter((i) => i.kind === "found").length;
  const adoptionCount = items.filter((i) => i.kind === "adoption").length;

  const displayName =
    profile?.full_name ??
    profile?.username ??
    profile?.user?.username ??
    "Admin";
  const email = profile?.user?.email ?? profile?.email ?? "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#1e293b",
        display: "flex",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: "280px",
          background: "white",
          padding: "24px",
          borderRight: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          boxShadow: "4px 0 24px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #ff8a00, #ff2fab)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              🐾
            </div>
            <div>
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#1e293b",
                  margin: 0,
                }}
              >
                PetReunite
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  margin: 0,
                }}
              >
                Admin Dashboard
              </p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <div style={{ marginBottom: "24px" }}>
            <button
              onClick={() => navigate("/admin?tab=dashboard", { replace: true })}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                color: "white",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <span></span> Home
            </button>
            <button
              onClick={() => navigate("/admin?tab=found", { replace: true })}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "none",
                background: "transparent",
                color: "#64748b",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <span>👀</span> Found Pet Reports
            </button>
            <button
              onClick={() => navigate("/admin?tab=lost", { replace: true })}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "none",
                background: "transparent",
                color: "#64748b",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <span>🚨</span> Lost Pet Reports
            </button>
            <button
              onClick={() => navigate("/admin?tab=adoptions", { replace: true })}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "none",
                background: "transparent",
                color: "#64748b",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <span>💜</span> Adoption Requests
            </button>
            <button
              onClick={() => navigate("/admin?tab=pets", { replace: true })}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "none",
                background: "transparent",
                color: "#64748b",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <span>🐶</span> Pets
            </button>
            <button
              onClick={() => navigate("/admin?tab=users", { replace: true })}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "none",
                background: "transparent",
                color: "#64748b",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <span>👥</span> Users
            </button>
            <button
              onClick={() => navigate("/admin?tab=stats", { replace: true })}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "none",
                background: "transparent",
                color: "#64748b",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <span>📈</span> Statistics
            </button>
          </div>
        </nav>
      </div>

      <div style={{ flex: 1, padding: 28, boxSizing: "border-box" }}>
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 800,
                fontSize: 24,
              }}
            >
              <span>Pending Approvals</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
              <button
                type="button"
                aria-label="Notifications"
                style={{
                  position: "relative",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(15,23,42,0.16)",
                }}
              >
                <span style={{ fontSize: 18 }}>🔔</span>
                {totalPending > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#ef4444",
                      boxShadow: "0 0 0 2px #ffffff",
                    }}
                  />
                )}
              </button>

              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: "1px solid #111827",
                  background: "#ffffff",
                  color: "#111827",
                  boxShadow: "0 6px 14px rgba(15,23,42,0.18)",
                  minWidth: 260,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#6b7280",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
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
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{displayName}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{email}</div>
                  </div>
                </div>
                <span style={{ fontSize: 16, color: "#6b7280" }}>▾</span>
              </button>
            </div>
          </header>

          <Box
            sx={{
              mb: 3,
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
              borderRadius: 999,
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
              bgcolor: "white",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
              <Search sx={{ color: "text.secondary" }} />
              <TextField
                fullWidth
                placeholder="Search by species, breed, user, or location..."
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{
                  "& .MuiInputBase-root": {
                    borderRadius: 999,
                    bgcolor: "#f9fafb",
                  },
                }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {KIND_FILTERS.map((k) => (
                <Button
                  key={k}
                  size="small"
                  onClick={() => setKindFilter(k)}
                  sx={{
                    textTransform: "none",
                    px: 2.2,
                    borderRadius: 999,
                    fontWeight: 600,
                    fontSize: 12,
                    bgcolor: kindFilter === k ? "#0f172a" : "white",
                    color: kindFilter === k ? "#f9fafb" : "#0f172a",
                    border: "1px solid rgba(15,23,42,0.12)",
                    boxShadow:
                      kindFilter === k ? "0 8px 20px rgba(15,23,42,0.25)" : "none",
                    "&:hover": {
                      bgcolor: kindFilter === k ? "#020617" : "#f9fafb",
                    },
                  }}
                >
                  <span style={{ marginRight: 4 }}>
                    {k === "all" ? "All" : k[0].toUpperCase() + k.slice(1)}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      opacity: 0.85,
                    }}
                  >
                    {k === "all"
                      ? totalPending
                      : k === "lost"
                        ? lostCount
                        : k === "found"
                          ? foundCount
                          : adoptionCount}
                  </span>
                </Button>
              ))}
            </Box>
          </Box>

          {error && (
            <Paper
              sx={{
                p: 2,
                mb: 2,
                bgcolor: "#fef2f2",
                color: "#b91c1c",
                borderRadius: 2,
              }}
            >
              {error}
            </Paper>
          )}

          {loading ? (
            <Paper sx={{ p: 3, borderRadius: 3 }}>Loading pending approvals...</Paper>
          ) : visible.length === 0 ? (
            <Paper sx={{ p: 3, borderRadius: 3 }}>No pending approvals</Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {visible.map((r) => (
                <Paper
                  key={`${r.kind}-${r.id}`}
                  sx={{
                    p: 2,
                    display: "grid",
                    gridTemplateColumns: "90px 1fr auto",
                    gap: 2,
                    borderRadius: 3,
                    boxShadow: "0 18px 45px rgba(15,23,42,0.12)",
                  }}
                >
                  <Avatar
                    variant="rounded"
                    src={r.photoUrl}
                    sx={{
                      width: 90,
                      height: 90,
                      bgcolor:
                        r.kind === "lost"
                          ? "warning.main"
                          : r.kind === "found"
                            ? "primary.main"
                            : "info.main",
                      "& img": {
                        objectFit: "cover",
                        objectPosition: "center top",
                      },
                    }}
                  >
                    {r.kind === "adoption" ? "💙" : r.kind === "lost" ? "🚨" : "🐾"}
                  </Avatar>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Chip
                        label={r.kind.toUpperCase()}
                        color={r.kind === "lost" ? "warning" : r.kind === "found" ? "success" : "info"}
                        size="small"
                      />
                      <Chip label={r.status} size="small" />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {r.title}
                    </Typography>
                    {r.subtitle && (
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {r.subtitle}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Location: {r.location}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Reporter: {r.reporter}
                      {r.reporterEmail ? ` (${r.reporterEmail})` : ""}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {(r.kind === "lost" || r.kind === "found") && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          if (r.kind === "lost") navigate(`/admin/lost/${r.id}`);
                          else navigate(`/admin/found/${r.id}`);
                        }}
                        sx={{ textTransform: "none", borderRadius: 999 }}
                      >
                        View
                      </Button>
                    )}
                    <Button
                      startIcon={<Check />}
                      color="success"
                      variant="contained"
                      size="small"
                      disabled={actionKey === `${r.kind}-${r.id}-approved`}
                      onClick={() => changeStatus(r, "approved")}
                      sx={{ textTransform: "none", borderRadius: 999, px: 2.5 }}
                    >
                      Accept
                    </Button>
                    <Button
                      startIcon={<Close />}
                      color="error"
                      variant="outlined"
                      size="small"
                      disabled={actionKey === `${r.kind}-${r.id}-rejected`}
                      onClick={() => changeStatus(r, "rejected")}
                      sx={{ textTransform: "none", borderRadius: 999, px: 2.5 }}
                    >
                      Reject
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </div>
      </div>
    </div>
  );
}
