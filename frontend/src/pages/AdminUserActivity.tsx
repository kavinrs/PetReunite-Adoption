import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchAdminUserActivity } from "../services/api";

type ActivityKind = "lost" | "found" | "adoption";

type ActivityRow = {
  id: string;
  kind: ActivityKind;
  record: any;
};

export default function AdminUserActivity() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    lost: any[];
    found: any[];
    adoptions: any[];
  } | null>(null);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | ActivityKind>("all");

  const username = location.state?.username as string | undefined;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const res = await fetchAdminUserActivity(Number(userId));
      if (cancelled) return;
      if (res.ok) {
        setData({
          lost: res.data?.lost ?? [],
          found: res.data?.found ?? [],
          adoptions: res.data?.adoptions ?? [],
        });
      } else {
        setError(res.error || "Failed to load user activity");
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const rows: ActivityRow[] = useMemo(() => {
    const items: ActivityRow[] = [];
    if (data) {
      for (const r of data.lost) {
        items.push({
          id: `lost-${r.id}`,
          kind: "lost",
          record: r,
        });
      }
      for (const r of data.found) {
        items.push({
          id: `found-${r.id}`,
          kind: "found",
          record: r,
        });
      }
      for (const r of data.adoptions) {
        items.push({
          id: `adoption-${r.id}`,
          kind: "adoption",
          record: r,
        });
      }
    }

    // sort by created_at desc
    items.sort((a, b) => {
      const ta = a.record?.created_at ? new Date(a.record.created_at).getTime() : 0;
      const tb = b.record?.created_at ? new Date(b.record.created_at).getTime() : 0;
      return tb - ta;
    });

    let filtered = items;
    if (kindFilter !== "all") {
      filtered = filtered.filter((i) => i.kind === kindFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((i) => {
        const r = i.record || {};
        const title =
          i.kind === "lost"
            ? r.pet_name || r.pet_type || "Lost report"
            : i.kind === "found"
            ? r.pet_type || "Found report"
            : r.pet?.name || "Adoption request";
        const status: string = r.status || "";
        const text = `${title} ${status}`.toLowerCase();
        return text.includes(q);
      });
    }
    return filtered;
  }, [data, kindFilter, search]);

  const displayName = username || `User ${userId}`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f7fb",
        display: "flex",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(15,23,42,0.08)",
          padding: 24,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
              User Activity
            </div>
            <div style={{ marginTop: 4, fontSize: 14, color: "#374151" }}>
              {displayName}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin?tab=users", { replace: true })}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              color: "#0f172a",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← Back to Users
          </button>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 12,
              borderRadius: 8,
              background: "#fff1f2",
              color: "#b91c1c",
              padding: 10,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* Search + filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or status..."
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: "white",
              fontSize: 14,
              color: "#374151",
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { key: "all", label: "All" },
              { key: "lost", label: "Lost" },
              { key: "found", label: "Found" },
              { key: "adoption", label: "Adoption" },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setKindFilter(f.key as any)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  background: kindFilter === f.key ? "#111827" : "#ffffff",
                  color: kindFilter === f.key ? "#ffffff" : "#111827",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ padding: 18, fontSize: 14, color: "#9ca3af" }}>
            Loading activity...
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 18, fontSize: 14, color: "#9ca3af" }}>
            No activity found for this user.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {rows.map((item) => (
              <ActivityCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityCard({ item }: { item: ActivityRow }) {
  const { kind, record: r } = item;

  const isLost = kind === "lost";
  const isFound = kind === "found";
  const isAdoption = kind === "adoption";

  const title = isLost
    ? r.pet_name || r.pet_type || "Lost report"
    : isFound
    ? r.pet_type || "Found report"
    : r.pet?.name || "Adoption request";

  const locationText = isLost
    ? `${r.location || r.city || r.found_city || ""}${
        r.state ? ", " + r.state : ""
      }`
    : isFound
    ? `${r.found_city || r.city || ""}${r.state ? ", " + r.state : ""}`
    : `${r.pet?.location_city || ""}${
        r.pet?.location_state ? ", " + r.pet.location_state : ""
      }`;

  const status: string = r.status || "";
  const createdAt = r.created_at || null;

  // -------- image URL logic (same pattern as other admin cards) --------
  const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "/api";
  const origin = /^https?:/.test(apiBase)
    ? new URL(apiBase).origin
    : "http://localhost:8000";

  // For lost/found, backend sends photo_url or photo.
  // For adoption, use pet.photos (if it’s a path string).
  const raw = isAdoption ? r.pet?.photos : r.photo_url || r.photo;

  const src = (() => {
    if (!raw) return null;
    const u = String(raw);
    if (u.startsWith("http")) return u;
    if (u.startsWith("/")) return origin + u;
    if (u.startsWith("media/")) return origin + "/" + u;
    return origin + "/media/" + u.replace(/^\/+/, "");
  })();
  // ---------------------------------------------------------------------

  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        padding: 16,
        border: "1px solid #f1f5f9",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
        display: "grid",
        gridTemplateColumns: "120px 2fr 1fr",
        gap: 16,
        alignItems: "center",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 12,
          overflow: "hidden",
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
          fontSize: 28,
        }}
      >
        {src ? (
          <img
            src={src}
            alt={title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span>🐾</span>
        )}
      </div>

      {/* Middle: badges + title + description */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              background: isAdoption
                ? "#ede9fe"
                : isLost
                ? "#fee2e2"
                : "#dbeafe",
              color: isAdoption
                ? "#6d28d9"
                : isLost
                ? "#b91c1c"
                : "#1d4ed8",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {isAdoption ? "ADOPTION" : isLost ? "LOST" : "FOUND"}
          </span>
          {status && (
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                background: "#f1f5f9",
                color: "#0f172a",
                fontSize: 12,
                fontWeight: 700,
                border: "1px solid #e5e7eb",
              }}
            >
              {status}
            </span>
          )}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
          {title}
        </div>
        {isAdoption ? (
          <div style={{ fontSize: 13, color: "#374151", marginTop: 4 }}>
            {r.pet?.species || "Pet"} • {r.pet?.breed || "—"}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#374151", marginTop: 4 }}>
            Breed: {r.breed || "—"}
          </div>
        )}
        {r.description && (
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              marginTop: 4,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {r.description}
          </div>
        )}
      </div>

      {/* Right: location + time */}
      <div>
        <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
          {isAdoption
            ? "Pet Location:"
            : isLost
            ? "Last Seen Location:"
            : "Found Location:"}
        </div>
        <div style={{ fontSize: 13, color: "#374151" }}>
          {locationText || "—"}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#6b7280",
            marginTop: 8,
          }}
        >
          {createdAt ? new Date(createdAt).toLocaleString() : ""}
        </div>
      </div>
    </div>
  );
}