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
import { useEffect, useState } from "react";
import {
  getProfile,
  clearTokens,
  fetchAdminSummary,
  fetchAdminFoundReports,
  fetchAdminLostReports,
  updateAdminFoundReport,
  updateAdminLostReport,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";

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

type TabKey = "found" | "lost";

export default function AdminHome() {
  // Apply viewport standardization to ensure consistent 100% scaling
  useViewportStandardization();

  const [profile, setProfile] = useState<any>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [foundReports, setFoundReports] = useState<any[]>([]);
  const [lostReports, setLostReports] = useState<any[]>([]);
  const [tab, setTab] = useState<TabKey>("found");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
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

      const [summaryRes, foundRes, lostRes] = await Promise.all([
        fetchAdminSummary(),
        fetchAdminFoundReports("pending"),
        fetchAdminLostReports("pending"),
      ]);
      if (!mounted) return;

      if (summaryRes.ok) setSummary(summaryRes.data);
      if (foundRes.ok) setFoundReports(foundRes.data ?? []);
      if (lostRes.ok) setLostReports(lostRes.data ?? []);

      if (!summaryRes.ok || !foundRes.ok || !lostRes.ok) {
        const msg = summaryRes.error || foundRes.error || lostRes.error;
        if (msg) setError(msg);
      }

      setLoading(false);
    }

    loadInitial();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function reloadTable(nextTab: TabKey, nextStatus: string) {
    setTableLoading(true);
    setError(null);
    if (nextTab === "found") {
      const res = await fetchAdminFoundReports(nextStatus);
      if (res.ok) setFoundReports(res.data ?? []);
      else if (res.error) setError(res.error);
    } else {
      const res = await fetchAdminLostReports(nextStatus);
      if (res.ok) setLostReports(res.data ?? []);
      else if (res.error) setError(res.error);
    }
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

  async function handleChangeStatus(kind: TabKey, id: number, status: string) {
    setActionKey(`${kind}-${id}-${status}`);
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
      }
    } finally {
      setActionKey(null);
    }
  }

  async function handleEditNotes(kind: TabKey, id: number) {
    const reports = kind === "found" ? foundReports : lostReports;
    const current = reports.find((r) => r.id === id);
    const existing = current?.admin_notes || "";
    const note = window.prompt("Admin notes", existing);
    if (note === null) return;
    setActionKey(`${kind}-${id}-note`);
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
      setActionKey(null);
    }
  }

  function renderSummaryCards() {
    if (!summary) return null;
    const cards = [
      {
        title: "Total Lost Reports",
        value: summary.lost_total,
        accent: "#ef4444",
      },
      {
        title: "Total Found Reports",
        value: summary.found_total,
        accent: "#3b82f6",
      },
      {
        title: "Lost This Month",
        value: summary.lost_this_month,
        accent: "#f97316",
      },
      {
        title: "Found This Month",
        value: summary.found_this_month,
        accent: "#10b981",
      },
    ];

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              padding: 16,
              borderRadius: 12,
              background: "#0f172a",
              color: "#e5e7eb",
              boxShadow: "0 10px 30px rgba(15,23,42,0.7)",
              border: `1px solid ${card.accent}33`,
            }}
          >
            <div
              style={{
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "#9ca3af",
                marginBottom: 8,
              }}
            >
              {card.title}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{card.value}</div>
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 999,
                marginTop: 10,
                background: card.accent,
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  function renderTable() {
    const rows = tab === "found" ? foundReports : lostReports;

    let body;
    if (tableLoading) {
      body = (
        <div style={{ padding: 18, fontSize: 14, color: "#9ca3af" }}>
          Loading reports...
        </div>
      );
    } else if (rows.length === 0) {
      body = (
        <div style={{ padding: 18, fontSize: 14, color: "#9ca3af" }}>
          No reports for this filter.
        </div>
      );
    } else {
      body = rows.map((r) => (
        <div
          key={r.id}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.3fr 1.5fr 1.2fr 1.5fr",
            padding: "12px 14px",
            fontSize: 14,
            color: "#e5e7eb",
            borderBottom: "1px solid #111827",
          }}
        >
          <div style={{ paddingRight: 8 }}>
            <div style={{ fontWeight: 600 }}>
              {tab === "lost" ? r.pet_name || r.pet_type : r.pet_type}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginTop: 2,
              }}
            >
              {r.breed || r.color || ""}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginTop: 4,
                maxHeight: 32,
                overflow: "hidden",
              }}
            >
              {r.description}
            </div>
          </div>
          <div style={{ fontSize: 13 }}>
            <div>{r.reporter?.username}</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>
              {r.reporter?.email}
            </div>
          </div>
          <div style={{ fontSize: 13 }}>
            {tab === "found" ? r.found_city : r.city}, {r.state}
          </div>
          <div>{renderStatusBadge(r.status)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(
                [
                  "pending",
                  "approved",
                  "rejected",
                  "investigating",
                  "resolved",
                ] as const
              ).map((s) => (
                <button
                  key={s}
                  onClick={() => handleChangeStatus(tab, r.id, s)}
                  disabled={actionKey === `${tab}-${r.id}-${s}`}
                  style={{
                    fontSize: 11,
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid #1f2937",
                    background: r.status === s ? "#111827" : "transparent",
                    color: "#e5e7eb",
                    cursor: "pointer",
                  }}
                >
                  {STATUS_LABELS[s] || s}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleEditNotes(tab, r.id)}
              disabled={actionKey === `${tab}-${r.id}-note`}
              style={{
                marginTop: 4,
                alignSelf: "flex-start",
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid #1f2937",
                background: "#0b1120",
                color: "#e5e7eb",
                cursor: "pointer",
              }}
            >
              {r.admin_notes ? "Edit note" : "Add note"}
            </button>
          </div>
        </div>
      ));
    }

    return (
      <div
        style={{
          borderRadius: 12,
          border: "1px solid #1f2937",
          overflow: "hidden",
          background: "#020617",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.3fr 1.5fr 1.2fr 1.5fr",
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            background: "#020617",
            color: "#9ca3af",
            borderBottom: "1px solid #1f2937",
          }}
        >
          <div>Pet</div>
          <div>Reporter</div>
          <div>Location</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        {body}
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
        background: "#020617",
        color: "#e5e7eb",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
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
            <img
              src="/pawreunite-logo.svg"
              alt="PawReunite logo"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
            <span>PawReunite</span>
          </div>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
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
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{email}</div>
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
                  <div style={{ fontSize: 13, color: "#6b7280" }}>{email}</div>
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

        {renderSummaryCards()}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
            marginTop: 4,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {(["found", "lost"] as TabKey[]).map((key) => (
              <button
                key={key}
                onClick={() => {
                  setTab(key);
                  reloadTable(key, statusFilter);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid #1f2937",
                  background: tab === key ? "#0b1120" : "transparent",
                  color: "#e5e7eb",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {key === "found" ? "Found pet reports" : "Lost pet reports"}
              </button>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
            }}
          >
            <span style={{ color: "#9ca3af" }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                const next = e.target.value;
                setStatusFilter(next);
                reloadTable(tab, next);
              }}
              style={{
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid #1f2937",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: 13,
              }}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="investigating">Investigating</option>
              <option value="matched">Matched</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {renderTable()}
      </div>
    </div>
  );
}
