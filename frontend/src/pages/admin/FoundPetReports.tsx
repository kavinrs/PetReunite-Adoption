import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Paper, Button, Chip, Avatar, TextField } from "@mui/material";
import { Check, Close, Search } from "@mui/icons-material";
import { fetchAdminFoundReports, updateAdminFoundReport } from "../../services/api";

type FoundReport = {
  id: number;
  pet_type: string;
  breed?: string;
  color?: string;
  estimated_age?: string;
  found_city: string;
  state: string;
  description?: string;
  status: string;
  reporter?: { username?: string; email?: string };
  photo_url?: string;
  created_at?: string;
};

const STATUS_OPTIONS = ["all", "pending", "approved", "rejected", "investigating", "resolved"] as const;

export default function FoundPetReports() {
  const [reports, setReports] = useState<FoundReport[]>([]);
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      const res = await fetchAdminFoundReports(status);
      if (!mounted) return;
      if (res.ok) setReports(res.data ?? []);
      else setError(res.error ?? "Failed to load reports");
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [status, tick]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return reports;
    return reports.filter((r) => {
      const text = [
        r.pet_type,
        r.breed,
        r.color,
        r.description,
        r.found_city,
        r.state,
        r.reporter?.username,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(term);
    });
  }, [reports, search]);

  async function changeStatus(id: number, next: string) {
    setActionKey(`${id}-${next}`);
    setError(null);
    const res = await updateAdminFoundReport(id, { status: next });
    if (!res.ok) {
      setError(res.error ?? "Failed to update status");
    } else {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    }
    setActionKey(null);
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Found Pet Reports
      </Typography>

      <Paper sx={{ p: 2, mb: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Search sx={{ color: "text.secondary" }} />
        <TextField
          fullWidth
          placeholder="Search by species, breed, or description..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          {STATUS_OPTIONS.map((s) => (
            <Button
              key={s}
              variant={status === s ? "contained" : "outlined"}
              onClick={() => setStatus(s)}
              size="small"
            >
              {s[0].toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </Box>
        <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
          <Chip label={`All: ${reports.length}`} size="small" />
          <Chip label={`Pending: ${reports.filter((r) => r.status === "pending").length}`} size="small" />
          <Chip label={`Approved: ${reports.filter((r) => r.status === "approved").length}`} size="small" />
          <Chip label={`Rejected: ${reports.filter((r) => r.status === "rejected").length}`} size="small" />
        </Box>
      </Paper>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: "error.light", color: "error.contrastText" }}>{error}</Paper>
      )}

      {loading ? (
        <Paper sx={{ p: 3 }}>Loading reports...</Paper>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 3 }}>No reports</Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filtered.map((r) => (
            <Paper key={r.id} sx={{ p: 2, display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 2 }}>
              <Avatar
                variant="rounded"
                src={r.photo_url || undefined}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "primary.main",
                  "& img": {
                    objectFit: "cover",
                    objectPosition: "center top",
                  },
                }}
              />
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Chip label="FOUND" color="success" size="small" />
                  <Chip label={r.status} size="small" />
                </Box>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  {r.pet_type}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Breed: {r.breed || "-"}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Last Seen Location: {r.found_city}, {r.state}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Reported by: {r.reporter?.username} ({r.reporter?.email})
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button
                  startIcon={<Check />}
                  color="success"
                  variant="contained"
                  size="small"
                  disabled={actionKey === `${r.id}-approved`}
                  onClick={() => changeStatus(r.id, "approved")}
                >
                  Accept
                </Button>
                <Button
                  startIcon={<Close />}
                  color="error"
                  variant="outlined"
                  size="small"
                  disabled={actionKey === `${r.id}-rejected`}
                  onClick={() => changeStatus(r.id, "rejected")}
                >
                  Reject
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
