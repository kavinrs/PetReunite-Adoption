// // src/pages/AdminHome.tsx
// import { useEffect, useState } from "react";
// import {
//   getProfile,
//   clearTokens,
//   fetchAdminSummary,
//   fetchAdminFoundReports,
//   fetchAdminLostReports,
//   updateAdminFoundReport,
//   updateAdminLostReport,
// } from "../services/api";
// import { useNavigate } from "react-router-dom";
// import { useViewportStandardization } from "../hooks/useViewportStandardization";

// const STATUS_LABELS: Record<string, string> = {
//   pending: "Pending",
//   approved: "Approved",
//   rejected: "Rejected",
//   investigating: "Investigating",
//   matched: "Matched",
//   resolved: "Resolved",
//   closed: "Closed",
// };

// const STATUS_COLORS: Record<string, string> = {
//   pending: "#f59e0b",
//   approved: "#16a34a",
//   rejected: "#dc2626",
//   investigating: "#2563eb",
//   matched: "#0d9488",
//   resolved: "#16a34a",
//   closed: "#6b7280",
// };

// type TabKey = "found" | "lost";

// export default function AdminHome() {
//   const [profile, setProfile] = useState<any>(null);
//   const [summary, setSummary] = useState<any | null>(null);
//   const [foundReports, setFoundReports] = useState<any[]>([]);
//   const [lostReports, setLostReports] = useState<any[]>([]);
//   const [tab, setTab] = useState<TabKey>("found");
//   const [statusFilter, setStatusFilter] = useState<string>("pending");
//   const [loading, setLoading] = useState(true);
//   const [tableLoading, setTableLoading] = useState(false);
//   const [actionKey, setActionKey] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [profileOpen, setProfileOpen] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     let mounted = true;
//     async function loadInitial() {
//       setLoading(true);
//       setError(null);
//       const profileRes = await getProfile();
//       if (!mounted) return;
//       if (!profileRes.ok) {
//         clearTokens();
//         navigate("/", { replace: true });
//         return;
//       }
//       setProfile(profileRes.data);

//       const [summaryRes, foundRes, lostRes] = await Promise.all([
//         fetchAdminSummary(),
//         fetchAdminFoundReports("pending"),
//         fetchAdminLostReports("pending"),
//       ]);
//       if (!mounted) return;

//       if (summaryRes.ok) setSummary(summaryRes.data);
//       if (foundRes.ok) setFoundReports(foundRes.data ?? []);
//       if (lostRes.ok) setLostReports(lostRes.data ?? []);

//       if (!summaryRes.ok || !foundRes.ok || !lostRes.ok) {
//         const msg = summaryRes.error || foundRes.error || lostRes.error;
//         if (msg) setError(msg);
//       }

//       setLoading(false);
//     }
//     loadInitial();
//     return () => {
//       mounted = false;
//     };
//   }, [navigate]);

//   async function reloadTable(nextTab: TabKey, nextStatus: string) {
//     setTableLoading(true);
//     setError(null);
//     if (nextTab === "found") {
//       const res = await fetchAdminFoundReports(nextStatus);
//       if (res.ok) setFoundReports(res.data ?? []);
//       else if (res.error) setError(res.error);
//     } else {
//       const res = await fetchAdminLostReports(nextStatus);
//       if (res.ok) setLostReports(res.data ?? []);
//       else if (res.error) setError(res.error);
//     }
//     setTableLoading(false);
//   }

//   function renderStatusBadge(status: string) {
//     const color = STATUS_COLORS[status] ?? "#6b7280";
//     const label = STATUS_LABELS[status] ?? status;
//     return (
//       <span
//         style={{
//           display: "inline-block",
//           padding: "2px 8px",
//           borderRadius: 999,
//           fontSize: 12,
//           fontWeight: 600,
//           backgroundColor: `${color}22`,
//           color,
//         }}
//       >
//         {label}
//       </span>
//     );
//   }

//   async function handleChangeStatus(kind: TabKey, id: number, status: string) {
//     setActionKey(`${kind}-${id}-${status}`);
//     setError(null);
//     try {
//       const fn = kind === "found" ? updateAdminFoundReport : updateAdminLostReport;
//       const res = await fn(id, { status });
//       if (!res.ok) {
//         if (res.error) setError(res.error);
//         return;
//       }
//       if (kind === "found") {
//         setFoundReports((prev) => prev.map((r) => (r.id === id ? res.data : r)));
//       } else {
//         setLostReports((prev) => prev.map((r) => (r.id === id ? res.data : r)));
//       }
//     } finally {
//       setActionKey(null);
//     }
//   }

//   async function handleEditNotes(kind: TabKey, id: number) {
//     const reports = kind === "found" ? foundReports : lostReports;
//     const current = reports.find((r) => r.id === id);
//     const existing = current?.admin_notes || "";
//     const note = window.prompt("Admin notes", existing);
//     if (note === null) return;
//     setActionKey(`${kind}-${id}-note`);
//     setError(null);
//     try {
//       const fn = kind === "found" ? updateAdminFoundReport : updateAdminLostReport;
//       const res = await fn(id, { admin_notes: note });
//       if (!res.ok) {
//         if (res.error) setError(res.error);
//         return;
//       }
//       if (kind === "found") {
//         setFoundReports((prev) => prev.map((r) => (r.id === id ? res.data : r)));
//       } else {
//         setLostReports((prev) => prev.map((r) => (r.id === id ? res.data : r)));
//       }
//     } finally {
//       setActionKey(null);
//     }
//   }

//   function renderSummaryCards() {
//     if (!summary) return null;
//     const cards = [
//       {
//         title: "Total Lost Reports",
//         value: summary.lost_total,
//         accent: "#ef4444",
//       },
//       {
//         title: "Total Found Reports",
//         value: summary.found_total,
//         accent: "#3b82f6",
//       },
//       {
//         title: "Lost This Month",
//         value: summary.lost_this_month,
//         accent: "#f97316",
//       },
//       {
//         title: "Found This Month",
//         value: summary.found_this_month,
//         accent: "#10b981",
//       },
//     ];

//     return (
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
//           gap: 16,
//           marginBottom: 24,
//         }}
//       >
//         {cards.map((card) => (
//           <div
//             key={card.title}
//             style={{
//               padding: 16,
//               borderRadius: 12,
//               background: "#0f172a",
//               color: "#e5e7eb",
//               boxShadow: "0 10px 30px rgba(15,23,42,0.7)",
//               border: `1px solid ${card.accent}33`,
//             }}
//           >
//             <div
//               style={{
//                 fontSize: 13,
//                 textTransform: "uppercase",
//                 letterSpacing: 1,
//                 color: "#9ca3af",
//                 marginBottom: 8,
//               }}
//             >
//               {card.title}
//             </div>
//             <div style={{ fontSize: 28, fontWeight: 800 }}>{card.value}</div>
//             <div
//               style={{
//                 width: 40,
//                 height: 4,
//                 borderRadius: 999,
//                 marginTop: 10,
//                 background: card.accent,
//               }}
//             />
//           </div>
//         ))}
//       </div>
//     );
//   }

//   function renderTable() {
//     const rows = tab === "found" ? foundReports : lostReports;
//     return (
//       <div
//         style={{
//           borderRadius: 12,
//           border: "1px solid #1f2937",
//           overflow: "hidden",
//           background: "#020617",
//         }}
//       >
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "2fr 1.3fr 1.5fr 1.2fr 1.5fr",
//             padding: "10px 14px",
//             fontSize: 13,
//             fontWeight: 600,
//             textTransform: "uppercase",
//             letterSpacing: 0.8,
//             background: "#020617",
//             color: "#9ca3af",
//             borderBottom: "1px solid #1f2937",
//           }}
//         >
//           <div>Pet</div>
//           <div>Reporter</div>
//           <div>Location</div>
//           <div>Status</div>
//           <div>Actions</div>
//         </div>
//         {tableLoading ? (
//           <div style={{ padding: 18, fontSize: 14, color: "#9ca3af" }}>Loading reports...</div>
//         ) : rows.length === 0 ? (
//           <div style={{ padding: 18, fontSize: 14, color: "#9ca3af" }}>No reports for this filter.</div>
//         ) : (
//           rows.map((r) => (
//             <div
//               key={r.id}
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "2fr 1.3fr 1.5fr 1.2fr 1.5fr",
//                 padding: "12px 14px",
//                 fontSize: 14,
//                 color: "#e5e7eb",
//                 borderBottom: "1px solid #111827",
//               }}
//             >
//               <div style={{ paddingRight: 8 }}>
//                 <div style={{ fontWeight: 600 }}>
//                   {tab === "lost" ? r.pet_name || r.pet_type : r.pet_type}
//                 </div>
//                 <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
//                   {r.breed || r.color || ""}
//                 </div>
//                 <div
//                   style={{
//                     fontSize: 11,
//                     color: "#6b7280",
//                     marginTop: 4,
//                     maxHeight: 32,
//                     overflow: "hidden",
//                   }}
//                 >
//                   {r.description}
//                 </div>
//               </div>
//               <div style={{ fontSize: 13 }}>
//                 <div>{r.reporter?.username}</div>
//                 <div style={{ fontSize: 11, color: "#9ca3af" }}>{r.reporter?.email}</div>
//               </div>
//               <div style={{ fontSize: 13 }}>
//                 {tab === "found" ? r.found_city : r.city}, {r.state}
//               </div>
//               <div>{renderStatusBadge(r.status)}</div>
//               <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
//                 <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
//                   {(["pending", "approved", "rejected", "investigating", "resolved"] as const).map(
//                     (s) => (
//                       <button
//                         key={s}
//                         onClick={() => handleChangeStatus(tab, r.id, s)}
//                         disabled={actionKey === `${tab}-${r.id}-${s}`}
//                         style={{
//                           fontSize: 11,
//                           padding: "4px 8px",
//                           borderRadius: 999,
//                           border: "1px solid #1f2937",
//                           background: r.status === s ? "#111827" : "transparent",
//                           color: "#e5e7eb",
//                           cursor: "pointer",
//                         }}
//                       >
//                         {STATUS_LABELS[s] || s}
//                       </button>
//                     )
//                   )}
//                 </div>
//                 <button
//                   onClick={() => handleEditNotes(tab, r.id)}
//                   disabled={actionKey === `${tab}-${r.id}-note`}
//                   style={{
//                     marginTop: 4,
//                     alignSelf: "flex-start",
//                     fontSize: 11,
//                     padding: "4px 8px",
//                     borderRadius: 999,
//                     border: "1px solid #1f2937",
//                     background: "#0b1120",
//                     color: "#e5e7eb",
//                     cursor: "pointer",
//                   }}
//                 >
//                   {r.admin_notes ? "Edit note" : "Add note"}
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//             borderRadius: 8,
//             background: "#450a0a",
//             color: "#fecaca",
//             fontSize: 13,
//           }}
//         >
//           {error}
//         </div>
//       )}

//       {renderSummaryCards()}

//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           marginBottom: 10,
//           marginTop: 4,
//         }}
//       >
//         <div style={{ display: "flex", gap: 8 }}>
//           {(["found", "lost"] as TabKey[]).map((key) => (
//             <button
//               key={key}
//               onClick={() => {
//                 setTab(key);
//                 reloadTable(key, statusFilter);
//               }}
//               style={{
//                 padding: "6px 14px",
//                 borderRadius: 999,
//                 border: "1px solid #1f2937",
//                 background: tab === key ? "#0b1120" : "transparent",
//                 color: "#e5e7eb",
//                 fontSize: 13,
//                 cursor: "pointer",
//               }}
//             >
//               {key === "found" ? "Found pet reports" : "Lost pet reports"}
//             </button>
//           ))}
//         </div>
//         <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
//           <span style={{ color: "#9ca3af" }}>Status:</span>
//           <select
//             value={statusFilter}
//             onChange={(e) => {
//               const next = e.target.value;
//               setStatusFilter(next);
//               reloadTable(tab, next);
//             }}
//             style={{
//               padding: "4px 8px",
//               borderRadius: 999,
//               border: "1px solid #1f2937",
//               background: "#020617",
//               color: "#e5e7eb",
//               fontSize: 13,
//             }}
//           >
//             <option value="all">All</option>
//             <option value="pending">Pending</option>
//             <option value="approved">Approved</option>
//             <option value="rejected">Rejected</option>
//             <option value="investigating">Investigating</option>
//             <option value="matched">Matched</option>
//             <option value="resolved">Resolved</option>
//             <option value="closed">Closed</option>
//           </select>
//         </div>
//       </div>

//       {renderTable()}
//     </div>
//   );
// }

// src/pages/AdminHome.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type ApiResult,
  getProfile,
  clearTokens,
  fetchAdminSummary,
  fetchAdminFoundReports,
  fetchAdminLostReports,
  updateAdminFoundReport,
  updateAdminLostReport,
  deleteAdminFoundReport,
  deleteAdminLostReport,
  fetchAllAdoptionRequests,
  updateAdoptionRequestStatus,
  deleteAdoptionRequest,
  fetchAdminUsers,
  fetchAvailablePets,
} from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";
import "leaflet/dist/leaflet.css";
import { useMap } from "react-leaflet";
import * as RL from "react-leaflet";
const AnyMapContainer = RL.MapContainer as any;
const AnyTileLayer = RL.TileLayer as any;
import L from "leaflet";
import "leaflet.heat";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  investigating: "Investigating",
  matched: "Matched",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#16a34a",
  rejected: "#dc2626",
  investigating: "#2563eb",
  matched: "#0d9488",
  resolved: "#16a34a",
  closed: "#6b7280",
};

type TabKey = "dashboard" | "found" | "lost" | "adoptions" | "pets" | "users" | "stats";

export default function AdminHome() {
  // Apply viewport standardization to ensure consistent 100% scaling
  useViewportStandardization();

  const [profile, setProfile] = useState<any>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [foundReports, setFoundReports] = useState<any[]>([]);
  const [lostReports, setLostReports] = useState<any[]>([]);
  const [adoptionRequests, setAdoptionRequests] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [petsSearch, setPetsSearch] = useState("");
  const [petsTypeFilter, setPetsTypeFilter] = useState<
    "all" | "lost" | "found" | "adoption"
  >("all");
  const [petsStatusFilter, setPetsStatusFilter] = useState<"all" | "approved">(
    "all",
  );
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [userActiveFilter, setUserActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [statsView, setStatsView] = useState<"default" | "recentPets">("default");
  const [recentPets, setRecentPets] = useState<any[]>([]);
  const [recentPetsSearch, setRecentPetsSearch] = useState("");
  const [recentPetsSpecies, setRecentPetsSpecies] = useState("All Species");
  const [recentPetsExpandedId, setRecentPetsExpandedId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [hasPendingNotification, setHasPendingNotification] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const lastSeenPendingRef = useRef(0);

  const [error, setError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const initialTab = qs.get("tab") as TabKey | null;
    if (initialTab && ["dashboard","found","lost","adoptions"].includes(initialTab)) {
      setTab(initialTab);
    }

    let mounted = true;

    async function loadInitial() {
      setLoading(true);
      setError(null);

      const profileRes = await getProfile();
      if (!mounted) return;

      if (!profileRes.ok) {
        clearTokens();
        navigate("/", { replace: true });
        return;
      }
      setProfile(profileRes.data);

      const [summaryRes, foundRes, lostRes, adoptionRes] = await Promise.all([
        fetchAdminSummary(),
        fetchAdminFoundReports(),
        fetchAdminLostReports(),
        fetchAllAdoptionRequests(),
      ]);
      if (!mounted) return;

      if (summaryRes.ok) setSummary(summaryRes.data);
      if (foundRes.ok) setFoundReports(foundRes.data ?? []);
      if (lostRes.ok) setLostReports(lostRes.data ?? []);
      if (adoptionRes.ok) setAdoptionRequests(adoptionRes.data ?? []);

      if (!summaryRes.ok || !foundRes.ok || !lostRes.ok || !adoptionRes.ok) {
        const msg =
          summaryRes.error ||
          foundRes.error ||
          lostRes.error ||
          adoptionRes.error;
        if (msg) setError(msg);
      }

      setLoading(false);
    }

    loadInitial();
    return () => {
      mounted = false;
    };
  }, [navigate, location.search]);

  useEffect(() => {
    const id = window.setInterval(() => setRefreshTick((t) => t + 1), 15000);
    return () => window.clearInterval(id);
  }, []);

  const isUpdated = (r: any) => {
    return !!(r && r.has_user_update);
  };

  useEffect(() => {
    if (tab !== "users") return;
    let cancelled = false;
    async function loadUsers() {
      setTableLoading(true);
      setError(null);
      const res = await fetchAdminUsers();
      if (cancelled) return;
      if (res.ok) setAdminUsers(res.data ?? []);
      else if (res.error) setError(res.error);
      setTableLoading(false);
    }
    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  useEffect(() => {
    if (tab === "dashboard") {
      fetchAdminSummary().then((res) => {
        if (res.ok) setSummary(res.data);
      });
    } else if (tab === "pets") {
      reloadPets();
    } else {
      // For lost/found/adoptions we always fetch full data and
      // apply the statusFilter purely on the frontend so that
      // pseudo-filters like "updated" work correctly.
      const backendStatus =
        tab === "lost" || tab === "found" ? "all" : statusFilter;
      reloadTable(tab, backendStatus);
    }
  }, [refreshTick, tab, statusFilter]);

  async function reloadTable(nextTab: TabKey, nextStatus: string) {
    setTableLoading(true);
    setError(null);
    if (nextTab === "found") {
      const res = await fetchAdminFoundReports(nextStatus === "all" ? undefined : nextStatus);
      if (res.ok) setFoundReports(res.data ?? []);
      else if (res.error) setError(res.error);
    } else if (nextTab === "lost") {
      const res = await fetchAdminLostReports(nextStatus === "all" ? undefined : nextStatus);
      if (res.ok) setLostReports(res.data ?? []);
      else if (res.error) setError(res.error);
    } else if (nextTab === "adoptions") {
      const res = await fetchAllAdoptionRequests();
      if (res.ok) {
        const filtered =
          nextStatus === "all"
            ? (res.data ?? [])
            : (res.data ?? []).filter((req: any) => req.status === nextStatus);
        setAdoptionRequests(filtered);
      } else if (res.error) setError(res.error);
    }
    setTableLoading(false);
  }

  async function loadRecentPets() {
    setTableLoading(true);
    setError(null);
    const res = await fetchAvailablePets();
    if (res.ok) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const rows = (res.data ?? []).filter((p: any) => {
        const created = p.created_at ? new Date(p.created_at) : null;
        return created && created >= weekAgo;
      });
      setRecentPets(rows);
    } else if (res.error) {
      setError(res.error);
    }
    setTableLoading(false);
  }

  useEffect(() => {
    if (!summary) return;
    const sb = summary.status_breakdown || {};
    const lostPending = sb.lost?.pending ?? 0;
    const foundPending = sb.found?.pending ?? 0;
    const adoptionPending = Array.isArray(adoptionRequests)
      ? adoptionRequests.filter((r: any) => r.status === "pending").length
      : 0;

    const lostUpdated = Array.isArray(lostReports)
      ? lostReports.filter(isUpdated).length
      : 0;
    const foundUpdated = Array.isArray(foundReports)
      ? foundReports.filter(isUpdated).length
      : 0;

    const totalAttention =
      lostPending + foundPending + adoptionPending + lostUpdated + foundUpdated;

    if (totalAttention > lastSeenPendingRef.current) {
      setHasPendingNotification(true);
    }
  }, [summary, adoptionRequests, lostReports, foundReports]);

  const notificationFeed = useMemo(
    () => {
      const items: {
        id: string;
        context: string;
        from: string;
        createdAt: string | null;
        tab: TabKey;
        filter: string;
        backendStatus: string;
      }[] = [];

      if (Array.isArray(lostReports)) {
        for (const r of lostReports as any[]) {
          const isUpdate = !!r.has_user_update;
          const status: string = r.status || "pending";
          const filter = isUpdate
            ? "updated"
            : status === "pending"
              ? "pending"
              : "all";
          items.push({
            id: `lost-${r.id}`,
            context: isUpdate ? "Lost Updation" : "Lost Report",
            from: r.reporter?.username || "Unknown user",
            createdAt: r.updated_at || r.created_at || null,
            tab: "lost",
            filter,
            backendStatus: "all",
          });
        }
      }

      if (Array.isArray(foundReports)) {
        for (const r of foundReports as any[]) {
          const isUpdate = !!r.has_user_update;
          const status: string = r.status || "pending";
          const filter = isUpdate
            ? "updated"
            : status === "pending"
              ? "pending"
              : "all";
          items.push({
            id: `found-${r.id}`,
            context: isUpdate ? "Found Updation" : "Found Report",
            from: r.reporter?.username || "Unknown user",
            createdAt: r.updated_at || r.created_at || null,
            tab: "found",
            filter,
            backendStatus: "all",
          });
        }
      }

      if (Array.isArray(adoptionRequests)) {
        for (const r of adoptionRequests as any[]) {
          const status: string = r.status || "pending";
          const isUpdate =
            !!r.updated_at && !!r.created_at && r.updated_at !== r.created_at;
          const context = isUpdate ? "Adoption Updation" : "Adoption Report";
          const filter = status === "pending" ? "pending" : status;
          items.push({
            id: `adoption-${r.id}`,
            context,
            from: r.requester?.username || "Unknown user",
            createdAt: r.updated_at || r.created_at || null,
            tab: "adoptions",
            filter,
            backendStatus: filter,
          });
        }
      }

      items.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });

      return items;
    },
    [lostReports, foundReports, adoptionRequests],
  );

  function handleNotificationClick() {
    // Toggle panel visibility
    setNotificationOpen((open) => !open);

    // Mark current attention total (pending + updated) as seen so the dot can clear
    if (!summary) {
      setHasPendingNotification(false);
      return;
    }
    const sb = summary.status_breakdown || {};
    const lostPending = sb.lost?.pending ?? 0;
    const foundPending = sb.found?.pending ?? 0;
    const adoptionPending = Array.isArray(adoptionRequests)
      ? adoptionRequests.filter((r: any) => r.status === "pending").length
      : 0;

    const lostUpdated = Array.isArray(lostReports)
      ? lostReports.filter(isUpdated).length
      : 0;
    const foundUpdated = Array.isArray(foundReports)
      ? foundReports.filter(isUpdated).length
      : 0;

    const totalAttention =
      lostPending + foundPending + adoptionPending + lostUpdated + foundUpdated;

    lastSeenPendingRef.current = totalAttention;
    setHasPendingNotification(false);
  }

  async function reloadPets() {
    // Pets tab reuses the reports already loaded into state for
    // lostReports, foundReports, and adoptionRequests.
    // Avoid extra network calls here so switching to Pets feels instant.
    setTableLoading(false);
  }

  function renderStatusBadge(status: string) {
    const color = STATUS_COLORS[status] ?? "#6b7280";
    const label = STATUS_LABELS[status] ?? status;
    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: `${color}22`,
          color,
        }}
      >
        {label}
      </span>
    );
  }

  function renderUsersTable() {
    let rows = adminUsers as any[];
    const q = userSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter((u) => {
        const text = [u.username, u.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(q);
      });
    }
    if (userRoleFilter !== "all") {
      rows = rows.filter((u) =>
        userRoleFilter === "admin" ? !!u.is_staff : !u.is_staff,
      );
    }
    if (userActiveFilter !== "all") {
      rows = rows.filter((u) =>
        userActiveFilter === "active" ? !!u.is_active : !u.is_active,
      );
    }

    if (tableLoading) {
      return (
        <div style={{ padding: 18, fontSize: 14, color: "#9ca3af" }}>
          Loading users...
        </div>
      );
    }
    if (!rows.length) {
      return (
        <div style={{ padding: 18, fontSize: 14, color: "#9ca3af" }}>
          No users found.
        </div>
      );
    }
    return (
      <div
        style={{
          background: "white",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          overflow: "hidden",
          marginBottom: 24,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
          }}
        >
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 16px",
                  color: "#6b7280",
                }}
              >
                Username
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 16px",
                  color: "#6b7280",
                }}
              >
                Email
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 16px",
                  color: "#6b7280",
                }}
              >
                Role
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 16px",
                  color: "#6b7280",
                }}
              >
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u: any) => (
              <tr key={u.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                <td style={{ padding: "10px 16px" }}>{u.username}</td>
                <td style={{ padding: "10px 16px" }}>{u.email}</td>
                <td style={{ padding: "10px 16px" }}>
                  {u.is_staff
                    ? u.is_superuser
                      ? "Super Admin"
                      : "Admin/Staff"
                    : "User"}
                </td>
                <td
                  style={{
                    padding: "10px 16px",
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  {u.joined || ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const filteredRows = useMemo(() => {
    const rows =
      tab === "adoptions"
        ? adoptionRequests
        : tab === "found"
          ? foundReports
          : lostReports;
    const q = search.trim().toLowerCase();
    const bySearch = !q
      ? rows
      : rows.filter((r: any) => {
        const text = [
          r.pet_name,
          r.pet_type,
          r.breed,
          r.color,
          r.description,
          r.found_city,
          r.city,
          r.state,
          r.requester?.username,
          r.reporter?.username,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(q);
      });
    // In Lost Pet Reports, "All" should hide pending items
    if (statusFilter === "all") {
      if (tab === "lost") {
        return bySearch.filter((r: any) => r.status !== "pending");
      }
      return bySearch;
    }

    // "updated" filter: items where user edited after initial approval
    if (statusFilter === "updated") {
      return bySearch.filter((r: any) => isUpdated(r));
    }

    return bySearch.filter((r: any) => r.status === statusFilter);
  }, [tab, adoptionRequests, foundReports, lostReports, search, statusFilter]);

  async function handleChangeStatus(kind: TabKey, id: number, status: string) {
    setError(null);
    try {
      const fn =
        kind === "found" ? updateAdminFoundReport : updateAdminLostReport;
      const res = await fn(id, { status });
      if (!res.ok) {
        if (res.error) setError(res.error);
        return;
      }
      if (kind === "found") {
        setFoundReports((prev) =>
          prev.map((r) => (r.id === id ? res.data : r)),
        );
      } else {
        setLostReports((prev) => prev.map((r) => (r.id === id ? res.data : r)));
        // If a lost report was approved, the backend may have created a new
        // adoption pet. Refresh the admin summary so 'Newly Added Pets (This
        // Week)' updates immediately.
        if (status === "approved") {
          const summaryRes = await fetchAdminSummary();
          if (summaryRes.ok) setSummary(summaryRes.data);
        }
      }
    } finally {
    }
  }

  async function handleEditNotes(kind: TabKey, id: number) {
    const reports = kind === "found" ? foundReports : lostReports;
    const current = reports.find((r) => r.id === id);
    const existing = current?.admin_notes || "";
    const note = window.prompt("Admin notes", existing);
    if (note === null) return;
    setError(null);
    try {
      const fn =
        kind === "found" ? updateAdminFoundReport : updateAdminLostReport;
      const res = await fn(id, { admin_notes: note });
      if (!res.ok) {
        if (res.error) setError(res.error);
        return;
      }
      if (kind === "found") {
        setFoundReports((prev) =>
          prev.map((r) => (r.id === id ? res.data : r)),
        );
      } else {
        setLostReports((prev) => prev.map((r) => (r.id === id ? res.data : r)));
      }
    } finally {
    }
  }

  async function handleAdoptionStatusChange(
    id: number,
    status: string,
    notes?: string,
  ) {
    setError(null);
    try {
      const res = await updateAdoptionRequestStatus(id, {
        status: status as "pending" | "approved" | "rejected",
        admin_notes: notes,
      });
      if (!res.ok) {
        if (res.error) setError(res.error);
        return;
      }
      setAdoptionRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status, admin_notes: notes || r.admin_notes }
            : r,
        ),
      );
    } finally {
    }
  }

  async function handleDeletePet(row: any) {
    const kind = row.__kind as "lost" | "found" | "adoption";
    const confirmed = window.confirm(
      "Are you sure you want to delete this pet entry? This action cannot be undone.",
    );
    if (!confirmed) return;
    setError(null);
    try {
      let res: ApiResult | null = null;
      if (kind === "lost") {
        res = await deleteAdminLostReport(row.id);
        if (res.ok) {
          setLostReports((prev: any[]) => prev.filter((r) => r.id !== row.id));
        }
      } else if (kind === "found") {
        res = await deleteAdminFoundReport(row.id);
        if (res.ok) {
          setFoundReports((prev: any[]) => prev.filter((r) => r.id !== row.id));
        }
      } else if (kind === "adoption") {
        res = await deleteAdoptionRequest(row.id);
        if (res.ok) {
          setAdoptionRequests((prev: any[]) =>
            prev.filter((r) => r.id !== row.id),
          );
        }
      }
      if (res && !res.ok && res.error) {
        setError(res.error);
      }
    } finally {
    }
  }

  function renderSummaryCards() {
    if (!summary) return null;

    // Always show all 4 dashboard cards for professional look
    const totalLost = (summary?.lost_total ?? summary?.lost_today ?? 0) as number;
    const totalFound = (summary?.found_total ?? summary?.found_today ?? 0) as number;
    const adoptionTotal = Array.isArray(adoptionRequests)
      ? adoptionRequests.length
      : ((summary?.adoption_total ?? 0) as number);
    const pendingApprovals = (() => {
      const sb = summary?.status_breakdown;
      const lostPending = sb?.lost?.pending ?? 0;
      const foundPending = sb?.found?.pending ?? 0;
      return lostPending + foundPending;
    })();

    const cards = [
      {
        title: "Total Lost Pets",
        value: totalLost,
        icon: "🚨",
        accent: "#ef4444",
        background: "linear-gradient(135deg, #fee2e2, #fecaca)",
      },
      {
        title: "Total Found Pets",
        value: totalFound,
        icon: "🎉",
        accent: "#10b981",
        background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
      },
      {
        title: "Adoption Requests",
        value: adoptionTotal,
        icon: "💙",
        accent: "#3b82f6",
        background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
      },
      {
        title: "Pending Approvals",
        value: pendingApprovals,
        icon: "⏰",
        accent: "#f59e0b",
        background: "linear-gradient(135deg, #fef3c7, #fde68a)",
      },
    ];

    return (
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
            marginBottom: 32,
          }}
        >
          {cards.map((card, idx) => (
            <div
              key={idx}
              style={{
                background: "white",
                borderRadius: 16,
                padding: "24px",
                border: "1px solid #f1f5f9",
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
              }}
              onClick={() => {
                if (idx === 0) {
                  setTab("lost");
                  setStatusFilter("all");
                  navigate("/admin?tab=lost", { replace: true });
                  reloadTable("lost", "all");
                } else if (idx === 1) {
                  setTab("found");
                  setStatusFilter("all");
                  navigate("/admin?tab=found", { replace: true });
                  reloadTable("found", "all");
                } else if (idx === 2) {
                  setTab("adoptions");
                  setStatusFilter("all");
                  navigate("/admin?tab=adoptions", { replace: true });
                  reloadTable("adoptions", "all");
                } else if (idx === 3) {
                  // Default to lost pending; user can switch to found
                  setTab("lost");
                  setStatusFilter("pending");
                  navigate("/admin?tab=lost", { replace: true });
                  reloadTable("lost", "pending");
                }
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: card.accent,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: card.background,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {card.icon}
                </div>
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "800",
                    color: "#1e293b",
                    lineHeight: 1,
                  }}
                >
                  {card.value}
                </div>
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                  fontWeight: "500",
                }}
              >
                {card.title}
              </div>
            </div>
          ))}
        </div>

        {/* Analytics Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 24,
            marginBottom: 32,
          }}
        >
          {/* Line Chart */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: "24px",
              border: "1px solid #f1f5f9",
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "20px",
                margin: 0,
              }}
            >
              Lost and Found Pets (Weekly Trend)
            </h3>
            <div style={{ height: 260 }}>
              {summary?.weekly_trend ? (
                <WeeklyBarChart data={summary.weekly_trend as { date: string; lost: number; found: number }[]} />
              ) : (
                <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>Loading trend…</div>
              )}
            </div>
          </div>

          {/* Map Panel */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: "24px",
              border: "1px solid #f1f5f9",
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "20px",
                margin: 0,
              }}
            >
              Pet Hotspots
            </h3>
            <div style={{ height: 220 }}>
              {(summary?.hotspots ?? []).length === 0 ? (
                <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#047857" }}>No hotspot data</div>
              ) : (
                <MapHeat summary={summary} />
              )}
            </div>
          </div>
        </div>

        {/* Categories and Activity Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          {/* Pet Types */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: "24px",
              border: "1px solid #f1f5f9",
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "20px",
                margin: "0 0 20px 0",
              }}
            >
              Most Reported Pet Types
            </h3>
            {(summary?.pet_types ?? []).map((item: any, idx: number) => (
              <div key={idx} style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    {item.name}
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1e293b",
                    }}
                  >
                    {item.count}
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "#f1f5f9",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(() => {
                        const max = Math.max(...(summary?.pet_types?.map((p: any) => p.count) || [1]));
                        return Math.round((item.count / max) * 100);
                      })()}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: "24px",
              border: "1px solid #f1f5f9",
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "20px",
                margin: "0 0 20px 0",
              }}
            >
              Recent Activity
            </h3>
            {(summary?.recent_activity ?? []).map((activity: any, idx: number) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "16px",
                  paddingBottom: "16px",
                  borderBottom: idx < 3 ? "1px solid #f1f5f9" : "none",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    background: "#e0e7ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                    fontSize: "16px",
                  }}
                >
                  📝
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "2px",
                    }}
                  >
                    {activity.text}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderSummaryTiles() {
    if (!summary) return null;
    const totalLost = (summary?.lost_total ?? summary?.lost_today ?? 0) as number;
    const totalFound = (summary?.found_total ?? summary?.found_today ?? 0) as number;
    const adoptionTotal = Array.isArray(adoptionRequests)
      ? adoptionRequests.length
      : ((summary?.adoption_total ?? 0) as number);
    const sb = summary?.status_breakdown;
    const lostPending = sb?.lost?.pending ?? 0;
    const foundPending = sb?.found?.pending ?? 0;
    const pendingApprovals = lostPending + foundPending;
    const cards = [
      { title: "Pending Approvals", value: pendingApprovals, icon: "⏰", accent: "#f59e0b", background: "linear-gradient(135deg, #fef3c7, #fde68a)" },
      { title: "Total Lost Pets", value: totalLost, icon: "🚨", accent: "#ef4444", background: "linear-gradient(135deg, #fee2e2, #fecaca)" },
      { title: "Total Found Pets", value: totalFound, icon: "🎉", accent: "#10b981", background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" },
      { title: "Adoption Requests", value: adoptionTotal, icon: "💙", accent: "#3b82f6", background: "linear-gradient(135deg, #dbeafe, #bfdbfe)" },
    ];
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {cards.map((card, idx) => (
            <div
              key={idx}
              style={{
                background: "white",
                borderRadius: 16,
                padding: "24px",
                border: "1px solid #f1f5f9",
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
              }}
              onClick={() => {
                if (idx === 0) {
                  // Pending Approvals: prefer lost-pending; if none, go to found-pending
                  if (lostPending > 0 || (lostPending === 0 && foundPending === 0)) {
                    setTab("lost");
                    setStatusFilter("pending");
                    navigate("/admin?tab=lost&status=pending", { replace: true });
                    reloadTable("lost", "pending");
                  } else {
                    setTab("found");
                    setStatusFilter("pending");
                    navigate("/admin?tab=found&status=pending", { replace: true });
                    reloadTable("found", "pending");
                  }
                } else if (idx === 1) {
                  setTab("found");
                  setStatusFilter("all");
                  navigate("/admin?tab=found", { replace: true });
                  reloadTable("found", "all");
                } else if (idx === 2) {
                  setTab("adoptions");
                  setStatusFilter("all");
                  navigate("/admin?tab=adoptions", { replace: true });
                  reloadTable("adoptions", "all");
                } else if (idx === 3) {
                  setTab("lost");
                  setStatusFilter("pending");
                  navigate("/admin?tab=lost", { replace: true });
                  reloadTable("lost", "pending");
                }
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: card.accent }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontSize: "28px", width: "48px", height: "48px", borderRadius: "12px", background: card.background, display: "flex", alignItems: "center", justifyContent: "center" }}>{card.icon}</div>
                <div style={{ fontSize: "32px", fontWeight: "800", color: "#1e293b", lineHeight: 1 }}>{card.value}</div>
              </div>
              <div style={{ fontSize: "14px", color: "#64748b", fontWeight: "500" }}>{card.title}</div>
            </div>
          ))}
        </div>
        {/* System Overview row under main tiles */}
        <div
          style={{
            marginTop: 24,
            background: "white",
            borderRadius: 20,
            border: "1px solid #e5e7eb",
            boxShadow: "0 16px 40px rgba(15,23,42,0.06)",
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                Platform Insights
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                Key metrics and activity overview
              </div>
            </div>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                background: "#ecfdf3",
                border: "1px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#16a34a",
                fontSize: 16,
              }}
            >
              📊
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0,1fr))",
              gap: 16,
            }}
          >
            {[
              {
                key: "total-users" as const,
                label: "Total Users",
                value: summary.total_users ?? 0,
              },
              {
                key: "update-requests" as const,
                label: "Updation Requests",
                value: summary.update_requests ?? 0,
              },
              {
                key: "new-pets" as const,
                label: "Newly Added Pets (This Week)",
                value: summary.new_pets_this_week ?? 0,
              },
              {
                key: "successful-adoptions" as const,
                label: "Successful Adoptions",
                value: summary.successful_adoptions ?? 0,
              },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  if (item.key === "total-users") {
                    setTab("users");
                    navigate("/admin?tab=users", { replace: true });
                  } else if (item.key === "update-requests") {
                    setTab("lost");
                    setStatusFilter("updated");
                    navigate("/admin?tab=lost&status=updated", { replace: true });
                    reloadTable("lost", "all");
                  } else if (item.key === "new-pets") {
                    setTab("stats");
                    setStatsView("recentPets");
                    navigate("/admin?tab=stats&view=recentPets", { replace: true });
                    loadRecentPets();
                  }
                }}
                style={{
                  background: "#ecfdf3",
                  borderRadius: 14,
                  padding: "14px 18px",
                  textAlign: "center",
                  border: "1px solid #bbf7d0",
                  cursor:
                    item.key === "total-users" ||
                    item.key === "update-requests" ||
                    item.key === "new-pets"
                      ? "pointer"
                      : "default",
                }}
              >
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#065f46",
                    marginBottom: 4,
                  }}
                >
                  {item.value}
                </div>
                <div style={{ fontSize: 13, color: "#047857", fontWeight: 500 }}>
                  {item.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderStatisticsPanels() {
    if (!summary) return null;

    if (statsView === "recentPets") {
      const filtered = (recentPets || []).filter((p: any) => {
        const q = recentPetsSearch.trim().toLowerCase();
        if (q) {
          const text = [p.name, p.species, p.breed, p.location_city, p.location_state]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!text.includes(q)) return false;
        }
        if (recentPetsSpecies !== "All Species") {
          return (p.species || "").toLowerCase() === recentPetsSpecies.toLowerCase();
        }
        return true;
      });

      return (
        <div>
          <div
            style={{
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1 }}>
              <input
                value={recentPetsSearch}
                onChange={(e) => setRecentPetsSearch(e.target.value)}
                placeholder="Search by name, breed, or location..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  background: "white",
                  color: "#374151",
                  fontSize: 14,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                }}
              />
            </div>
            <div>
              <select
                value={recentPetsSpecies}
                onChange={(e) => setRecentPetsSpecies(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "1px solid #e2e8f0",
                  background: "white",
                  color: "#374151",
                  fontSize: 14,
                  minWidth: 160,
                }}
              >
                <option value="All Species">All Species</option>
                <option value="Dog">Dogs</option>
                <option value="Cat">Cats</option>
                <option value="Rabbit">Rabbits</option>
                <option value="Bird">Birds</option>
              </select>
            </div>
          </div>

          {tableLoading ? (
            <div style={{ padding: 18, fontSize: 14, color: "#9ca3af" }}>Loading pets…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 18, fontSize: 14, color: "#9ca3af" }}>
              No pets added in the last 7 days.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map((p: any) => {
                const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "/api";
                const origin = /^https?:/.test(apiBase)
                  ? new URL(apiBase).origin
                  : "http://localhost:8000";
                const raw = p.photos || p.photo;
                const src = raw
                  ? (() => {
                      const u = String(raw);
                      if (u.startsWith("http")) return u;
                      if (u.startsWith("/")) return origin + u;
                      if (u.startsWith("media/")) return origin + "/" + u;
                      return origin + "/media/" + u.replace(/^\/+/, "");
                    })()
                  : null;
                return (
                  <div
                    key={p.id}
                    style={{
                      background: "white",
                      borderRadius: 16,
                      padding: 16,
                      border: "1px solid #f1f5f9",
                      display: "grid",
                      gridTemplateColumns: "90px 1.5fr 1fr",
                      gap: 16,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 90,
                        height: 90,
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt={p.name || p.species || "Pet"}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span style={{ fontSize: 28 }}>🐾</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
                        {p.name || "Pet"}
                      </div>
                      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                        {p.species} {p.breed ? `• ${p.breed}` : ""}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                        Location: {p.location_city}
                        {p.location_state ? ", " + p.location_state : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", justifySelf: "flex-end" }}>
                      <div>
                        Added on
                        <div style={{ fontWeight: 600, marginTop: 4 }}>
                          {p.created_at
                            ? new Date(p.created_at).toLocaleString()
                            : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setRecentPetsExpandedId((prev) =>
                            prev === p.id ? null : p.id,
                          )
                        }
                        style={{
                          marginTop: 10,
                          padding: "6px 12px",
                          borderRadius: 999,
                          border: "1px solid #111827",
                          background: "#111827",
                          color: "#f9fafb",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {recentPetsExpandedId === p.id ? "Hide Details" : "View Details"}
                      </button>
                    </div>
                    {recentPetsExpandedId === p.id && (
                      <div
                        style={{
                          gridColumn: "1 / span 3",
                          marginTop: 8,
                          fontSize: 12,
                          color: "#374151",
                        }}
                      >
                        {p.description && (
                          <div style={{ marginBottom: 4 }}>
                            <strong>Description:</strong> {p.description}
                          </div>
                        )}
                        {p.age && (
                          <div style={{ marginBottom: 2 }}>
                            <strong>Age:</strong> {p.age}
                          </div>
                        )}
                        {p.weight && (
                          <div style={{ marginBottom: 2 }}>
                            <strong>Weight:</strong> {p.weight}
                          </div>
                        )}
                        {p.gender && (
                          <div style={{ marginBottom: 2 }}>
                            <strong>Gender:</strong> {p.gender}
                          </div>
                        )}
                        {p.vaccinated != null && (
                          <div style={{ marginBottom: 2 }}>
                            <strong>Vaccinated:</strong> {String(p.vaccinated)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 32 }}>
          <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: 0 }}>Lost and Found Pets (Weekly Trend)</h3>
            <div style={{ height: 260, marginTop: 20 }}>
              {summary?.weekly_trend ? (
                <WeeklyBarChart data={summary.weekly_trend as { date: string; lost: number; found: number }[]} />
              ) : (
                <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>Loading trend…</div>
              )}
            </div>
          </div>
          <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: 0 }}>Pet Hotspots</h3>
            <div style={{ height: 220, marginTop: 20 }}>
              {(summary?.hotspots ?? []).length === 0 ? (
                <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#047857" }}>No hotspot data</div>
              ) : (
                <MapHeat summary={summary} />
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: "0 0 20px 0" }}>Most Reported Pet Types</h3>
            {(summary?.pet_types ?? []).map((item: any, idx: number) => (
              <div key={idx} style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>{item.name}</span>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>{item.count}</span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(() => {
                        const max = Math.max(...(summary?.pet_types?.map((p: any) => p.count) || [1]));
                        return Math.round((item.count / max) * 100);
                      })()}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", margin: "0 0 20px 0" }}>Recent Activity</h3>
            {(summary?.recent_activity ?? []).map((activity: any, idx: number) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: "16px", paddingBottom: "16px", borderBottom: idx < 3 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "12px", fontSize: "16px" }}>📝</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "2px" }}>{activity.text}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function WeeklyBarChart({
    data,
  }: {
    data: { date: string; lost: number; found: number }[];
  }) {
    const w = 560;
    const h = 220;
    const pad = 32;
    const barGroup = (w - 2 * pad) / data.length;
    const barWidth = Math.max(10, barGroup * 0.35);
    const maxY = Math.max(...data.map((d) => Math.max(d.lost, d.found)), 1);
    const toX = (i: number) => pad + i * barGroup + barGroup * 0.1;
    const toY = (v: number) => h - pad - (v * (h - 2 * pad)) / maxY;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

    const yTicks = 4;
    const yValues = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxY / yTicks) * i));

    function labelFor(dateStr: string) {
      const d = new Date(dateStr);
      try {
        return d.toLocaleDateString(undefined, { weekday: "short" });
      } catch {
        return dateStr.slice(5);
      }
    }

    function onMove(e: React.MouseEvent, d: { date: string; lost: number; found: number }) {
      const rect = containerRef.current?.getBoundingClientRect();
      const x = e.clientX - (rect?.left || 0) + 8;
      const y = e.clientY - (rect?.top || 0) - 32;
      setHover({ x, y, text: `${labelFor(d.date)} • Lost ${d.lost} • Found ${d.found}` });
    }

    return (
      <div ref={containerRef} style={{ position: "relative", width: w, height: h }}>
        <svg width={w} height={h}>
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e5e7eb" />
          <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#e5e7eb" />
          {yValues.map((yv) => (
            <g key={`yt-${yv}`}>
              <line x1={pad} y1={toY(yv)} x2={w - pad} y2={toY(yv)} stroke="#f1f5f9" />
              <text x={pad - 8} y={toY(yv) + 4} textAnchor="end" fontSize={11} fill="#64748b">
                {yv}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = toX(i);
            const lostH = h - pad - toY(d.lost);
            const foundH = h - pad - toY(d.found);
            return (
              <g key={d.date}>
                <rect
                  x={x}
                  y={toY(d.lost)}
                  width={barWidth}
                  height={lostH}
                  fill="#ef4444"
                  rx={3}
                />
                <rect
                  x={x + barWidth + 6}
                  y={toY(d.found)}
                  width={barWidth}
                  height={foundH}
                  fill="#16a34a"
                  rx={3}
                />
                <text x={x + barGroup * 0.45} y={h - pad + 16} textAnchor="middle" fontSize={11} fill="#64748b">
                  {labelFor(d.date)}
                </text>
                <rect
                  x={x - 2}
                  y={pad}
                  width={barGroup}
                  height={h - 2 * pad}
                  fill="transparent"
                  onMouseMove={(e) => onMove(e, d)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}
          <text x={w - pad} y={h - 4} textAnchor="end" fontSize={12} fill="#374151">
            Days
          </text>
          <text x={12} y={pad} transform={`rotate(-90 12 ${pad})`} textAnchor="end" fontSize={12} fill="#374151">
            Reports
          </text>
          <g>
            <rect x={w - pad - 120} y={pad} width={10} height={10} fill="#ef4444" rx={2} />
            <text x={w - pad - 104} y={pad + 9} fontSize={11} fill="#374151">Lost</text>
            <rect x={w - pad - 60} y={pad} width={10} height={10} fill="#16a34a" rx={2} />
            <text x={w - pad - 44} y={pad + 9} fontSize={11} fill="#374151">Found</text>
          </g>
        </svg>
        {hover && (
          <div
            style={{
              position: "absolute",
              left: hover.x,
              top: hover.y,
              background: "#111827",
              color: "#f9fafb",
              fontSize: 12,
              padding: "6px 8px",
              borderRadius: 8,
              boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
              pointerEvents: "none",
            }}
          >
            {hover.text}
          </div>
        )}
      </div>
    );
  }

  function MapHeat({ summary }: { summary: any }) {
    const [points, setPoints] = useState<
      { lat: number; lon: number; kind: "lost" | "found" | "adoption"; location: string; count: number }[]
    >([]);
    const [expanded, setExpanded] = useState(false);
    const CITY_COORDS: Record<string, [number, number]> = {
      chennai: [13.0827, 80.2707],
      bengaluru: [12.9716, 77.5946],
      bangalore: [12.9716, 77.5946],
      mumbai: [19.076, 72.8777],
      pune: [18.5204, 73.8567],
      hyderabad: [17.385, 78.4867],
      delhi: [28.6139, 77.209],
      ahmedabad: [23.0225, 72.5714],
      kolkata: [22.5726, 88.3639],
      coimbatore: [11.0168, 76.9558],
      madurai: [9.9252, 78.1198],
      nelore: [14.4426, 79.9865],
      nellore: [14.4426, 79.9865],
      visakhapatnam: [17.6868, 83.2185],
      tirupati: [13.6288, 79.4192],
      kochi: [9.9312, 76.2673],
      kozhikode: [11.2588, 75.7804],
      jaipur: [26.9124, 75.7873],
    };
    const STATE_COORDS: Record<string, [number, number]> = {
      tamilnadu: [11.1271, 78.6569],
      tamil_nadu: [11.1271, 78.6569],
      karnataka: [15.3173, 75.7139],
      maharashtra: [19.7515, 75.7139],
      andhra_pradesh: [15.9129, 79.74],
      "andhra pradesh": [15.9129, 79.74],
      telangana: [17.1232, 79.2088],
      kerala: [10.8505, 76.2711],
      delhi: [28.6139, 77.209],
      gujarat: [22.2587, 71.1924],
      west_bengal: [22.9868, 87.855],
      "west bengal": [22.9868, 87.855],
    };
    useEffect(() => {
      let cancelled = false;
      async function geocodeAll() {
        const cacheKey = "geocodeCache";
        const cache = JSON.parse(localStorage.getItem(cacheKey) || "{}");
        const next: { lat: number; lon: number; kind: "lost" | "found" | "adoption"; location: string; count: number }[] = [];
        const hotspots: any[] = summary?.hotspots ?? [];
        for (const h of hotspots) {
          const q = h.location as string;
          if (!q) continue;
          let entry = cache[q];
          if (!entry) {
            try {
              const controller = new AbortController();
              const t = setTimeout(() => controller.abort(), 4000);
              const resp = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`,
                { signal: controller.signal },
              );
              clearTimeout(t);
              const data = await resp.json();
              entry = data?.[0]
                ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
                : null;
              if (!entry) {
                const parts = q.split(",");
                const cityKey = parts[0].trim().toLowerCase();
                const stateKey = (parts[1] || "").trim().toLowerCase();
                const cityHit = CITY_COORDS[cityKey];
                const stateHit = STATE_COORDS[stateKey];
                if (cityHit) entry = { lat: cityHit[0], lon: cityHit[1] };
                else if (stateHit) entry = { lat: stateHit[0], lon: stateHit[1] };
              }
              cache[q] = entry;
              localStorage.setItem(cacheKey, JSON.stringify(cache));
            } catch {
              entry = null;
            }
          }
          if (!entry) continue;
          const base = { lat: entry.lat, lon: entry.lon, location: q };
          const lost = Number(h.lost || 0);
          const found = Number(h.found || 0);
          const adoption = Number(h.adoption || 0);
          if (lost > 0) next.push({ ...base, kind: "lost", count: lost });
          if (found > 0) next.push({ ...base, kind: "found", count: found });
          if (adoption > 0) next.push({ ...base, kind: "adoption", count: adoption });
        }
        if (!cancelled) setPoints(next);
      }
      geocodeAll();
      return () => {
        cancelled = true;
      };
    }, [summary]);

    return (
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setExpanded(true)}
          style={{
            position: "absolute",
            right: 8,
            top: 8,
            zIndex: 1000,
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            color: "#0f172a",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Expand
        </button>
        <AnyMapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: 200 }}>
          <AnyTileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {points.map((p, idx) => {
            const color =
              p.kind === "lost" ? "#dc2626" : p.kind === "found" ? "#16a34a" : "#eab308";
            const label =
              (p.kind === "lost"
                ? "Lost reports"
                : p.kind === "found"
                  ? "Found reports"
                  : "Adoption pets") + ` • ${p.location} (${p.count})`;
            return (
              <RL.CircleMarker
                key={idx}
                center={[p.lat, p.lon]}
                radius={4}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <RL.Tooltip direction="top" offset={[0, -4]} opacity={0.9}>
                  {label}
                </RL.Tooltip>
              </RL.CircleMarker>
            );
          })}
        </AnyMapContainer>
        {expanded && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
            <div style={{ width: "90vw", height: "80vh", background: "#ffffff", borderRadius: 12, padding: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Pet Hotspots</div>
                <button onClick={() => setExpanded(false)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#ffffff", color: "#0f172a", fontSize: 12, fontWeight: 600 }}>Close</button>
              </div>
              <AnyMapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                style={{ width: "100%", height: "calc(80vh - 48px)" }}
              >
                <AnyTileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                {points.map((p, idx) => {
                  const color =
                    p.kind === "lost" ? "#dc2626" : p.kind === "found" ? "#16a34a" : "#eab308";
                  const label =
                    (p.kind === "lost"
                      ? "Lost reports"
                      : p.kind === "found"
                        ? "Found reports"
                        : "Adoption pets") + ` • ${p.location} (${p.count})`;
                  return (
                    <RL.CircleMarker
                      key={`big-${idx}`}
                      center={[p.lat, p.lon]}
                      radius={7}
                      pathOptions={{
                        color,
                        fillColor: color,
                        fillOpacity: 0.9,
                        weight: 2,
                      }}
                    >
                      <RL.Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
                        {label}
                      </RL.Tooltip>
                    </RL.CircleMarker>
                  );
                })}
              </AnyMapContainer>
            </div>
          </div>
        )}
      </div>
    );
  }


  function renderCards() {
    const rows = filteredRows;
    if (tableLoading) {
      return (
        <div style={{ padding: 18, fontSize: 14, color: "#9ca3af" }}>Loading...</div>
      );
    }
    if (rows.length === 0) {
      return (
        <div style={{ padding: 18, fontSize: 14, color: "#9ca3af" }}>No items found.</div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {rows.map((r: any) => {
          const isLost = tab === "lost";
          const isFound = tab === "found";
          const isAdoption = tab === "adoptions";
          const isPetsTab = tab === "pets";
          const title = isLost
            ? `${r.pet_name || r.pet_type || "Pet"}`
            : isFound
              ? `${r.pet_type || r.pet_name || "Pet"}`
              : r.pet?.name || "Adoption Request";
          const locationText = isLost
            ? `${r.location || r.city || r.found_city || ""}${r.state ? ", " + r.state : ""}`
            : isFound
              ? `${r.found_city || r.city || ""}${r.state ? ", " + r.state : ""}`
              : `${r.pet?.location_city || ""}${r.pet?.location_state ? ", " + r.pet?.location_state : ""}`;

          const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "/api";
          const origin = /^https?:/.test(apiBase)
            ? new URL(apiBase).origin
            : "http://localhost:8000";
          const rawDetail = isLost
            ? r.photo_url || r.photo
            : isFound
              ? r.photo_url || r.photo
              : r.pet?.photos;
          const detailSrc = (() => {
            if (!rawDetail) return null;
            const u = String(rawDetail);
            if (u.startsWith("http")) return u;
            if (u.startsWith("/")) return origin + u;
            if (u.startsWith("media/")) return origin + "/" + u;
            return origin + "/media/" + u.replace(/^\/+/, "");
          })();

          return (
            <div
              key={r.id}
              style={{
                background: "white",
                borderRadius: 16,
                padding: 16,
                border: "1px solid #f1f5f9",
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr 1fr auto",
                  gap: 16,
                  alignItems: "center",
                }}
              >
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
                  {(() => {
                    const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "/api";
                    const origin = /^https?:/.test(apiBase) ? new URL(apiBase).origin : "http://localhost:8000";
                    const raw = isLost
                      ? r.photo_url || r.photo
                      : isFound
                        ? r.photo_url || r.photo
                        : r.pet?.photos;
                    const src = (() => {
                      if (!raw) return null;
                      const u = String(raw);
                      if (u.startsWith("http")) return u;
                      if (u.startsWith("/")) return origin + u;
                      if (u.startsWith("media/")) return origin + "/" + u;
                      return origin + "/media/" + u.replace(/^\/+/, "");
                    })();
                    return src ? (
                      <img src={src} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span>🐾</span>
                    );
                  })()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: isLost ? "#fee2e2" : isFound ? "#dbeafe" : "#ede9fe",
                        color: isLost ? "#b91c1c" : isFound ? "#1d4ed8" : "#6d28d9",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {isLost ? "LOST" : isFound ? "FOUND" : "ADOPTION"}
                    </span>
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
                      {r.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{title}</div>
                  <div style={{ fontSize: 13, color: "#374151", marginTop: 4 }}>
                    {isLost ? `Breed: ${r.breed || "—"}` : isFound ? `Breed: ${r.breed || "—"}` : `${r.pet?.species || "Pet"} • ${r.pet?.breed || "—"}`}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.description || r.pet?.description || ""}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>Last Seen Location:</div>
                  <div style={{ fontSize: 13, color: "#374151" }}>{locationText || "—"}</div>
                  <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600, marginTop: 8 }}>Reported by:</div>
                  <div style={{ fontSize: 13, color: "#374151" }}>{r.reporter?.username || r.requester?.username || "—"}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{r.reporter?.email || r.requester?.email || ""}</div>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                  <button
                    onClick={() => {
                      if (isPetsTab && r.pet?.id) {
                        navigate(`/pets/${r.pet.id}`);
                      } else if (isLost) {
                        navigate(`/admin/lost/${r.id}`);
                      } else {
                        setExpandedId((prev) => (prev === r.id ? null : r.id));
                      }
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: "1px solid #e5e7eb",
                      background: "#ffffff",
                      color: "#0f172a",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    View
                  </button>
                  {/* Show action buttons only when status is pending; otherwise show status on the right */}
                  {r.status === "pending" ? (
                    <>
                      <button
                        onClick={() => {
                          if (isAdoption) handleAdoptionStatusChange(r.id, "approved");
                          else handleChangeStatus(isFound ? "found" : "lost", r.id, "approved");
                        }}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 999,
                          border: "1px solid #10b981",
                          background: "#10b981",
                          color: "white",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          const reason = window.prompt("Reason", "");
                          if (isAdoption) handleAdoptionStatusChange(r.id, "rejected", reason || undefined);
                          else {
                            handleChangeStatus(isFound ? "found" : "lost", r.id, "rejected");
                            if (reason) handleEditNotes(isFound ? "found" : "lost", r.id);
                          }
                        }}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 999,
                          border: "1px solid #ef4444",
                          background: "#ef4444",
                          color: "white",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <div>{renderStatusBadge(r.status)}</div>
                  )}
                </div>
              </div>

              {expandedId === r.id && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 16,
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
                      gap: 16,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        background: "#f9fafb",
                        borderRadius: 18,
                        padding: 8,
                        boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                      }}
                    >
                      {detailSrc ? (
                        <img
                          src={detailSrc}
                          alt={title}
                          style={{
                            width: "100%",
                            height: 260,
                            borderRadius: 14,
                            objectFit: "cover",
                            objectPosition: "center top",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: 260,
                            borderRadius: 14,
                            background: "#e5e7eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 32,
                          }}
                        >
                          🐾
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 16,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              color: "#0f172a",
                              fontWeight: 600,
                            }}
                          >
                            Breed
                          </div>
                          <div style={{ fontSize: 13, color: "#374151" }}>
                            {r.breed || r.pet?.breed || "—"}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: "#0f172a",
                              fontWeight: 600,
                              marginTop: 8,
                            }}
                          >
                            Color
                          </div>
                          <div style={{ fontSize: 13, color: "#374151" }}>
                            {r.color || r.pet?.color || "—"}
                          </div>
                          {isLost && (
                            <>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "#0f172a",
                                  fontWeight: 600,
                                  marginTop: 8,
                                }}
                              >
                                Vaccinated
                              </div>
                              <div style={{ fontSize: 13, color: "#374151" }}>
                                {r.vaccinated || "—"}
                              </div>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "#0f172a",
                                  fontWeight: 600,
                                  marginTop: 8,
                                }}
                              >
                                Age
                              </div>
                              <div style={{ fontSize: 13, color: "#374151" }}>
                                {r.age || "—"}
                              </div>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "#0f172a",
                                  fontWeight: 600,
                                  marginTop: 8,
                                }}
                              >
                                Weight
                              </div>
                              <div style={{ fontSize: 13, color: "#374151" }}>
                                {r.weight || "—"}
                              </div>
                            </>
                          )}
                          {isFound && (
                            <>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "#0f172a",
                                  fontWeight: 600,
                                  marginTop: 8,
                                }}
                              >
                                Estimated Age
                              </div>
                              <div style={{ fontSize: 13, color: "#374151" }}>
                                {r.estimated_age || "—"}
                              </div>
                            </>
                          )}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              color: "#0f172a",
                              fontWeight: 600,
                            }}
                          >
                            Location
                          </div>
                          <div style={{ fontSize: 13, color: "#374151" }}>
                            {locationText || "—"}
                          </div>
                          {isLost && (
                            <>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "#0f172a",
                                  fontWeight: 600,
                                  marginTop: 8,
                                }}
                              >
                                Pincode
                              </div>
                              <div style={{ fontSize: 13, color: "#374151" }}>
                                {r.pincode || "—"}
                              </div>
                            </>
                          )}
                          <div
                            style={{
                              fontSize: 13,
                              color: "#0f172a",
                              fontWeight: 600,
                              marginTop: 8,
                            }}
                          >
                            Reporter
                          </div>
                          <div style={{ fontSize: 13, color: "#374151" }}>
                            {r.reporter?.username || r.requester?.username || "—"}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {r.reporter?.email || r.requester?.email || ""}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#0f172a",
                            fontWeight: 600,
                            marginBottom: 4,
                          }}
                        >
                          Description
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            color: "#374151",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {r.description || r.pet?.description || "No details provided."}
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          gap: 12,
                          fontSize: 12,
                          color: "#64748b",
                        }}
                      >
                        <span>Status: {r.status}</span>
                        <span>Notes: {r.admin_notes || "—"}</span>
                        <span>
                          Date: {new Date(r.created_at || r.date || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const displayName = profile?.full_name ?? profile?.user?.username ?? "Admin";
  const email = profile?.user?.email ?? "—";

  if (loading) {
    return <div style={{ padding: 40 }}>Loading admin dashboard...</div>;
  }

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
      {/* Sidebar */}
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
              onClick={() => {
                setTab("dashboard");
                navigate("/admin?tab=dashboard", { replace: true });
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "none",
                background:
                  tab === "dashboard"
                    ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                    : "transparent",
                color: tab === "dashboard" ? "white" : "#64748b",
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
              onClick={() => {
                setTab("found");
                navigate("/admin?tab=found", { replace: true });
                reloadTable("found", statusFilter);
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "none",
                background:
                  tab === "found" ? "rgba(59, 130, 246, 0.1)" : "transparent",
                color: tab === "found" ? "#3b82f6" : "#64748b",
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
              onClick={() => {
                setTab("lost");
                navigate("/admin?tab=lost", { replace: true });
                reloadTable("lost", statusFilter);
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "none",
                background:
                  tab === "lost" ? "rgba(239, 68, 68, 0.1)" : "transparent",
                color: tab === "lost" ? "#ef4444" : "#64748b",
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
              onClick={() => {
                setTab("adoptions");
                navigate("/admin?tab=adoptions", { replace: true });
                reloadTable("adoptions", statusFilter);
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "none",
                background:
                  tab === "adoptions"
                    ? "rgba(139, 92, 246, 0.1)"
                    : "transparent",
                color: tab === "adoptions" ? "#8b5cf6" : "#64748b",
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
              onClick={() => {
                setTab("pets");
                setStatusFilter("all");
                navigate("/admin?tab=pets", { replace: true });
                reloadPets();
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "none",
                background:
                  tab === "pets" ? "rgba(20,184,166,0.1)" : "transparent",
                color: tab === "pets" ? "#14b8a6" : "#64748b",
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
              onClick={() => {
                setTab("users");
                navigate("/admin?tab=users", { replace: true });
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "none",
                background:
                  tab === "users" ? "rgba(59,130,246,0.08)" : "transparent",
                color: tab === "users" ? "#2563eb" : "#64748b",
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
              onClick={() => {
                setTab("stats");
                navigate("/admin?tab=stats", { replace: true });
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "none",
                background:
                  tab === "stats" ? "rgba(99,102,241,0.12)" : "transparent",
                color: tab === "stats" ? "#4f46e5" : "#64748b",
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
              position: "relative",
              zIndex: 40,
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
              <span>
                {tab === "dashboard"
                  ? "Dashboard"
                  : tab === "found"
                    ? "Found Pet Reports"
                    : tab === "lost"
                      ? "Lost Pet Reports"
                      : tab === "adoptions"
                        ? "Adoption Requests"
                        : tab === "pets"
                          ? "All Pets"
                          : tab === "users"
                            ? "Users"
                            : "Statistics"}
              </span>
            </div>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
              <button
                type="button"
                onClick={handleNotificationClick}
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
                {hasPendingNotification && (
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

              {notificationOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: 48,
                    right: 80,
                    width: 380,
                    background: "#ffffff",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 12px 30px rgba(15,23,42,0.18)",
                    padding: 12,
                    fontSize: 13,
                    zIndex: 60,
                    color: "#111827",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>Notifications</span>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>
                      Latest activity
                    </span>
                  </div>
                  {notificationFeed.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#6b7280", paddingTop: 4 }}>
                      No notifications yet.
                    </div>
                  ) : (
                    <div
                      style={{
                        maxHeight: 260,
                        overflowY: "auto",
                        paddingRight: 4,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {notificationFeed
                        .filter((n) => !dismissedNotifications.includes(n.id))
                        .map((n) => {
                          const dateLabel = n.createdAt
                            ? new Date(n.createdAt).toLocaleString(undefined, {
                                month: "short",
                                day: "2-digit",
                                hour: "numeric",
                                minute: "2-digit",
                              })
                            : "";
                          return (
                            <button
                              key={n.id}
                              onClick={() => {
                                setDismissedNotifications((prev) =>
                                  prev.includes(n.id)
                                    ? prev
                                    : [...prev, n.id],
                                );
                                setTab(n.tab);
                                setStatusFilter(n.filter);
                                navigate(`/admin?tab=${n.tab}`, { replace: true });
                                const backendStatus =
                                  n.tab === "lost" || n.tab === "found"
                                    ? "all"
                                    : n.backendStatus || n.filter;
                                reloadTable(n.tab, backendStatus);
                                setNotificationOpen(false);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "16px 18px",
                                borderRadius: 12,
                                border: "1px solid #e5e7eb",
                                background: "#f9fafb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 14,
                                fontSize: 14,
                                cursor: "pointer",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-start",
                                  gap: 4,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "#111827",
                                  }}
                                >
                                  {n.context}
                              </span>
                              <span style={{ fontSize: 12, color: "#6b7280" }}>
                                From {n.from}
                              </span>
                              {dateLabel && (
                                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                                  {dateLabel}
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: "#ef4444",
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setProfileOpen((prev) => !prev)}
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
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {email}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    transform: profileOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.15s ease",
                  }}
                >
                  ▼
                </div>
              </button>
              {profileOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "110%",
                    right: 0,
                    marginTop: 8,
                    width: 260,
                    borderRadius: 20,
                    background: "#ffffff",
                    boxShadow: "0 18px 40px rgba(15,23,42,0.25)",
                    padding: 16,
                    fontSize: 13,
                    zIndex: 30,
                    color: "#111827",
                  }}
                >
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                      {email}
                    </div>
                  </div>
                  <div
                    style={{
                      height: 1,
                      background: "#e5e7eb",
                      margin: "6px 0 10px",
                    }}
                  />
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/admin/profile");
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      borderRadius: 999,
                      border: "1px solid rgba(129,140,248,0.4)",
                      background: "#eef2ff",
                      color: "#4f46e5",
                      fontWeight: 600,
                      cursor: "pointer",
                      marginBottom: 8,
                    }}
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => {
                      clearTokens();
                      setProfileOpen(false);
                      navigate("/", { replace: true });
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      borderRadius: 999,
                      border: "1px solid rgba(248,113,113,0.4)",
                      background: "#fee2e2",
                      color: "#b91c1c",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Logout
                  </button>
                  {/* removed reset button per request */}
                </div>
              )}
            </div>
          </header>

          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: 10,
                borderRadius: 8,
                background: "#450a0a",
                color: "#fecaca",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {tab === "users" && (
            <>
              <div
                style={{
                  marginBottom: 16,
                  display: "grid",
                  gridTemplateColumns: "1.4fr auto auto",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by username or email"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    background: "white",
                    color: "#374151",
                    fontSize: 14,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  }}
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) =>
                    setUserRoleFilter(e.target.value as "all" | "admin" | "user")
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    background: "white",
                    color: "#374151",
                    fontSize: 14,
                  }}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins / Staff</option>
                  <option value="user">Users</option>
                </select>
                <select
                  value={userActiveFilter}
                  onChange={(e) =>
                    setUserActiveFilter(
                      e.target.value as "all" | "active" | "inactive",
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    background: "white",
                    color: "#374151",
                    fontSize: 14,
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              {renderUsersTable()}
            </>
          )}

          {tab === "dashboard" && renderSummaryTiles()}
          {tab === "stats" && renderStatisticsPanels()}

          {tab !== "dashboard" && tab !== "pets" && tab !== "stats" && tab !== "users" && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => reloadTable(tab, statusFilter)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: "1px solid #e2e8f0",
                    background: "#f9fafb",
                    color: "#0f172a",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ↻
                </button>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    tab === "adoptions"
                      ? "Search by pet, requester, or notes"
                      : "Search by species, breed, or description"
                  }
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    background: "white",
                    color: "#374151",
                    fontSize: 14,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  {(
                    tab === "adoptions"
                      ? ["all", "pending", "approved", "rejected"]
                      : [
                          "all",
                          "pending",
                          "updated",
                          "approved",
                          "rejected",
                          "investigating",
                          "resolved",
                          "closed",
                        ]
                  ).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        reloadTable(tab, s);
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        border: "1px solid #e2e8f0",
                        background:
                          statusFilter === s ? "#14b8a6" : "#ffffff",
                        color: statusFilter === s ? "white" : "#0f172a",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        boxShadow:
                          statusFilter === s
                            ? "0 6px 14px rgba(20,184,166,0.3)"
                            : "0 2px 10px rgba(0,0,0,0.04)",
                      }}
                    >
                      {s[0].toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "dashboard" && (
            <div style={{ padding: 18, fontSize: 14, color: "#64748b" }}>
              Select a section from the sidebar to manage reports.
            </div>
          )}

          {tab === "pets" && (
            <div>
              {/* Pets search & filters row */}
              <div
                style={{
                  marginBottom: 16,
                  display: "grid",
                  gridTemplateColumns: "auto 1.6fr 0.7fr 0.7fr",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setTableLoading(true);
                    setError(null);
                    Promise.all([
                      fetchAdminLostReports("approved"),
                      fetchAdminFoundReports("approved"),
                      fetchAllAdoptionRequests(),
                    ])
                      .then(([lostRes, foundRes, adoptionRes]) => {
                        if (lostRes.ok) setLostReports(lostRes.data ?? []);
                        else if (lostRes.error) setError(lostRes.error);
                        if (foundRes.ok) setFoundReports(foundRes.data ?? []);
                        else if (foundRes.error) setError(foundRes.error);
                        if (adoptionRes.ok)
                          setAdoptionRequests(adoptionRes.data ?? []);
                        else if (adoptionRes.error) setError(adoptionRes.error);
                      })
                      .finally(() => setTableLoading(false));
                  }}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: "1px solid #e2e8f0",
                    background: "#f9fafb",
                    color: "#0f172a",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ↻
                </button>
                <input
                  value={petsSearch}
                  onChange={(e) => setPetsSearch(e.target.value)}
                  placeholder="Search by breed, species, location, or status..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    background: "white",
                    color: "#374151",
                    fontSize: 14,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  }}
                />
                <select
                  value={petsTypeFilter}
                  onChange={(e) =>
                    setPetsTypeFilter(
                      e.target.value as "all" | "lost" | "found" | "adoption",
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    background: "white",
                    color: "#374151",
                    fontSize: 14,
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                  <option value="adoption">Adoption</option>
                </select>
                <select
                  value={petsStatusFilter}
                  onChange={(e) =>
                    setPetsStatusFilter(e.target.value as "all" | "approved")
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    background: "white",
                    color: "#374151",
                    fontSize: 14,
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                </select>
              </div>

              {(() => {
                // Only include lost and found reports in this consolidated list.
                // Adoption requests are managed separately in the Adoptions tab.
                const lostRows = lostReports
                  .filter((r: any) => r.status === "approved")
                  .map((r: any) => ({ ...r, __kind: "lost" }));
                const foundRows = foundReports
                  .filter((r: any) => r.status === "approved")
                  .map((r: any) => ({ ...r, __kind: "found" }));
                const allRows: any[] = [...lostRows, ...foundRows];

                // apply type filter
                let rows = allRows;
                if (petsTypeFilter !== "all") {
                  rows = rows.filter((r) => r.__kind === petsTypeFilter);
                }

                // apply status filter (currently mostly approved only)
                if (petsStatusFilter === "approved") {
                  rows = rows.filter((r) => r.status === "approved");
                }

                // text search
                const q = petsSearch.trim().toLowerCase();
                if (q) {
                  rows = rows.filter((r) => {
                    const text = [
                      r.pet_name,
                      r.pet_type,
                      r.breed,
                      r.pet?.species,
                      r.pet?.breed,
                      r.city,
                      r.found_city,
                      r.state,
                      r.pet?.location_city,
                      r.pet?.location_state,
                      r.status,
                      r.description,
                      r.pet?.description,
                    ]
                      .filter(Boolean)
                      .join(" ")
                      .toLowerCase();
                    return text.includes(q);
                  });
                }

                if (rows.length === 0)
                  return (
                    <div style={{ padding: 18, fontSize: 14, color: "#9ca3af" }}>
                      No items found.
                    </div>
                  );

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {rows.map((r: any) => {
                      const isLost = r.__kind === "lost";
                      const isFound = r.__kind === "found";
                      const title = isLost
                        ? `${r.pet_name || r.pet_type || "Pet"}`
                        : `${r.pet_type || r.pet_name || "Pet"}`;
                      const locationText = isLost
                        ? `${r.location || r.city || r.found_city || ""}${r.state ? ", " + r.state : ""}`
                        : `${r.found_city || r.city || ""}${r.state ? ", " + r.state : ""}`;
                      const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "/api";
                      const origin = /^https?:/.test(apiBase)
                        ? new URL(apiBase).origin
                        : "http://localhost:8000";
                      const raw = r.photo_url || r.photo;
                      const src = raw
                        ? (() => {
                            const u = String(raw);
                            if (u.startsWith("http")) return u;
                            if (u.startsWith("/")) return origin + u;
                            if (u.startsWith("media/")) return origin + "/" + u;
                            return origin + "/media/" + u.replace(/^\/+/, "");
                          })()
                        : null;

                      return (
                        <div
                          key={`${r.__kind}-${r.id}`}
                          style={{
                            background: "white",
                            borderRadius: 16,
                            padding: 16,
                            border: "1px solid #f1f5f9",
                            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "120px 1fr 1fr auto",
                              gap: 16,
                              alignItems: "center",
                            }}
                          >
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
                                <img src={src} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <span>🐾</span>
                              )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                <span
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: 999,
                                    background: isLost ? "#fee2e2" : isFound ? "#dbeafe" : "#ede9fe",
                                    color: isLost ? "#b91c1c" : isFound ? "#1d4ed8" : "#6d28d9",
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }}
                                >
                                  {isLost ? "LOST" : isFound ? "FOUND" : "ADOPTION"}
                                </span>
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
                                  {r.status}
                                </span>
                              </div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{title}</div>
                              <div style={{ fontSize: 13, color: "#374151", marginTop: 4 }}>
                                {isLost ? `Breed: ${r.breed || "—"}` : isFound ? `Breed: ${r.breed || "—"}` : `${r.pet?.species || "Pet"} • ${r.pet?.breed || "—"}`}
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {r.description || r.pet?.description || ""}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>Last Seen Location:</div>
                              <div style={{ fontSize: 13, color: "#374151" }}>{locationText || "—"}</div>
                              <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600, marginTop: 8 }}>Reported by:</div>
                              <div style={{ fontSize: 13, color: "#374151" }}>{r.reporter?.username || r.requester?.username || "—"}</div>
                              <div style={{ fontSize: 12, color: "#64748b" }}>{r.reporter?.email || r.requester?.email || ""}</div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                justifyContent: "flex-end",
                                alignItems: "center",
                              }}
                            >
                              <div>{renderStatusBadge(r.status)}</div>
                              <button
                                onClick={() => {
                                  if ((r as any).pet?.id) {
                                    navigate(`/pets/${(r as any).pet.id}`);
                                  } else if (isLost) {
                                    navigate(`/admin/lost/${r.id}`);
                                  }
                                }}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: 999,
                                  border: "1px solid #e5e7eb",
                                  background: "#ffffff",
                                  color: "#0f172a",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                View details
                              </button>
                              <button
                                onClick={() => handleDeletePet(r)}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: 999,
                                  border: "1px solid #ef4444",
                                  background: "#ffffff",
                                  color: "#b91c1c",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {(tab === "lost" || tab === "found" || tab === "adoptions") &&
            renderCards()}
        </div>
      </div>
    </div>
  );
}
