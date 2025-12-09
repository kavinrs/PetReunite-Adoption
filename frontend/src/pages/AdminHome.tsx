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
  fetchAdminChatConversations,
  fetchChatMessagesAdmin,
  sendChatMessageAdmin,
  acceptAdminConversation,
  closeAdminConversation,
} from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";
import "leaflet/dist/leaflet.css";
import { useMap } from "react-leaflet";
import * as RL from "react-leaflet";
const AnyMapContainer = RL.MapContainer as any;
const AnyTileLayer = RL.TileLayer as any;
const AnyMarker = RL.Marker as any;
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

type TabKey =
  | "dashboard"
  | "found"
  | "lost"
  | "adoptions"
  | "pets"
  | "users"
  | "chat"
  | "stats";

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
  const [chatConversations, setChatConversations] = useState<any[]>([]);
  const [chatStatusFilter, setChatStatusFilter] = useState<string>("requested");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatMessagesLoading, setChatMessagesLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
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

  async function reloadAdminChats(statusFilter: string) {
    setChatLoading(true);
    setChatError(null);
    const res = await fetchAdminChatConversations(statusFilter === "all" ? undefined : statusFilter);
    if (res.ok) {
      setChatConversations(res.data ?? []);
    } else if (res.error) {
      setChatError(res.error);
    }
    setChatLoading(false);
  }

  useEffect(() => {
    if (tab !== "chat" || !selectedChatId) {
      setChatMessages([]);
      return;
    }
    let cancelled = false;
    async function loadMessages() {
      setChatMessagesLoading(true);
      const res = await fetchChatMessagesAdmin(selectedChatId as number);
      if (cancelled) return;
      if (res.ok) setChatMessages(res.data ?? []);
      setChatMessagesLoading(false);
    }
    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [tab, selectedChatId]);

  const handleAdminSendMessage = async () => {
    if (!selectedChatId || !chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput("");
    const optimistic = {
      id: `local-${Date.now()}`,
      conversation: selectedChatId,
      sender: { username: profile?.username || "Admin" },
      text,
      is_system: false,
      created_at: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, optimistic]);
    const res = await sendChatMessageAdmin(selectedChatId, text);
    if (!res.ok) {
      setChatError(res.error || "Failed to send message");
    } else if (res.data) {
      setChatMessages((prev) => prev.map((m) => (m.id === optimistic.id ? res.data : m)));
    }
  };

  const handleAdminAcceptChat = async (id: number) => {
    const res = await acceptAdminConversation(id);
    if (!res.ok) {
      setChatError(res.error || "Failed to accept conversation");
      return;
    }
    reloadAdminChats(chatStatusFilter);
    setSelectedChatId(id);
  };

  const handleAdminCloseChat = async (id: number) => {
    const res = await closeAdminConversation(id);
    if (!res.ok) {
      setChatError(res.error || "Failed to close conversation");
      return;
    }
    reloadAdminChats(chatStatusFilter);
    if (selectedChatId === id) setSelectedChatId(null);
  };

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
      </div>
    </div>
  );

// ... later inside the main JSX return, keep the pets tab section:
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
