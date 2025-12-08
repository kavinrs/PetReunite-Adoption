import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Paper, Button, Chip, Avatar, TextField } from "@mui/material";
import { Check, Close, Pets, Search } from "@mui/icons-material";
import { fetchAllAdoptionRequests, updateAdoptionRequestStatus } from "../../services/api";

type AdoptionRequest = {
  id: number;
  pet?: { name?: string; species?: string; breed?: string; location_city?: string; location_state?: string };
  requester?: { username?: string; email?: string };
  phone?: string;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
};

const STATUS_OPTIONS = ["all", "pending", "approved", "rejected"] as const;

export default function AdoptionRequests() {
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
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
      const res = await fetchAllAdoptionRequests();
      if (!mounted) return;
      if (res.ok) {
        const data = (res.data ?? []) as AdoptionRequest[];
        const filtered = status === "all" ? data : data.filter((r) => r.status === status);
        setRequests(filtered);
      } else setError(res.error ?? "Failed to load adoption requests");
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

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((r) => {
      const text = [
        r.pet?.name,
        r.pet?.species,
        r.pet?.breed,
        r.pet?.location_city,
        r.pet?.location_state,
        r.requester?.username,
        r.requester?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(term);
    });
  }, [requests, search]);

  async function changeStatus(id: number, next: "pending" | "approved" | "rejected") {
    setActionKey(`${id}-${next}`);
    setError(null);
    const res = await updateAdoptionRequestStatus(id, { status: next });
    if (!res.ok) setError(res.error ?? "Failed to update status");
    else setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    setActionKey(null);
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Adoption Requests
      </Typography>

      <Paper sx={{ p: 2, mb: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Search sx={{ color: "text.secondary" }} />
        <TextField
          fullWidth
          placeholder="Search by pet, requester, or location..."
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
          <Chip label={`All: ${requests.length}`} size="small" />
          <Chip label={`Pending: ${requests.filter((r) => r.status === "pending").length}`} size="small" />
          <Chip label={`Approved: ${requests.filter((r) => r.status === "approved").length}`} size="small" />
          <Chip label={`Rejected: ${requests.filter((r) => r.status === "rejected").length}`} size="small" />
        </Box>
      </Paper>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: "error.light", color: "error.contrastText" }}>{error}</Paper>
      )}

      {loading ? (
        <Paper sx={{ p: 3 }}>Loading requests...</Paper>
      ) : visible.length === 0 ? (
        <Paper sx={{ p: 3 }}>No requests</Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {visible.map((r) => (
            <Paper key={r.id} sx={{ p: 2, display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 2 }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: "primary.main" }}>
                <Pets />
              </Avatar>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Chip label={r.status} size="small" />
                </Box>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  {r.pet?.name}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {r.pet?.species} • {r.pet?.breed}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Location: {r.pet?.location_city}, {r.pet?.location_state}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Requester: {r.requester?.username} ({r.requester?.email})
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
                  Approve
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
