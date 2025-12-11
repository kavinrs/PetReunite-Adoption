import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchAdminVolunteerDetail, updateAdminVolunteerRequest, deleteAdminVolunteerRequest } from "../services/api";

export default function AdminVolunteerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [vol, setVol] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const action = new URLSearchParams(location.search).get("action");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await fetchAdminVolunteerDetail(Number(id));
      if (cancelled) return;
      if (res.ok) {
        setVol(res.data);
        setNotes(res.data.admin_notes || "");
      }
      else setError(res.error || "Failed to load volunteer");
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    // Auto-open approve/reject flow if navigated with action param
    if (!vol || !action) return;
    if (action === "approve") handleUpdate("approved");
    if (action === "reject") handleUpdate("rejected");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vol, action]);

  async function handleUpdate(next: "approved" | "rejected" | "pending") {
    setError(null);
    const res = await updateAdminVolunteerRequest(Number(id), {
      status: next,
      admin_notes: notes,
    });
    if (res.ok) {
      navigate("/admin?tab=volunteers", { replace: true });
    } else {
      setError(res.error || "Failed to update");
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading volunteer…</div>;
  if (!vol) return <div style={{ padding: 24 }}>Volunteer not found</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f6f7fb", display: "flex", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 880, background: "white", border: "1px solid #e5e7eb", borderRadius: 16, boxShadow: "0 24px 60px rgba(15,23,42,0.08)", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Volunteer Details</div>
            <div style={{ color: "#374151", marginTop: 4 }}>{vol.full_name}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => navigate("/admin?tab=volunteers", { replace: true })}
              style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#0f172a", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={async () => {
                const ok = window.confirm("Delete this volunteer request?");
                if (!ok) return;
                const res = await deleteAdminVolunteerRequest(Number(id));
                if (res.ok) navigate("/admin?tab=volunteers", { replace: true });
                else setError(res.error || "Failed to delete");
              }}
              style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid #ef4444", background: "#ffffff", color: "#b91c1c", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Delete
            </button>
          </div>
        </div>

        {error && <div style={{ marginBottom: 12, borderRadius: 8, background: "#fff1f2", color: "#b91c1c", padding: 10, fontSize: 13 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr", gap: 12, alignItems: "start" }}>
          <div style={{ width: 160, height: 160, borderRadius: 12, overflow: "hidden", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {(() => {
              const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "/api";
              const origin = /^https?:/.test(apiBase) ? new URL(apiBase).origin : "http://localhost:8000";
              const raw = vol.profile_photo || vol.id_proof_document;
              if (!raw) return <span style={{ fontSize: 28, color: "#6b7280" }}>🐾</span>;
              const u = String(raw);
              const isAbsolute = u.startsWith("http");
              const isRoot = u.startsWith("/");
              const fixed = isAbsolute ? u : isRoot ? origin + u : origin + "/media/" + u.replace(/^\/+/, "");
              const ext = u.split(".").pop()?.toLowerCase();
              const isImage = ["jpg", "jpeg", "png", "gif", "webp"]
                .includes((ext || "").replace(/\?.*$/, ""));
              return isImage ? (
                <img src={fixed} alt="ID proof" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 28, color: "#6b7280" }}>🐾</span>
              );
            })()}
          </div>
          <Info label="Email" value={vol.email} />
          <Info label="Phone" value={vol.phone_number} />
          <Info label="City" value={vol.city} />
          <Info label="State" value={vol.state} />
          <Info label="Pincode" value={vol.pincode} />
          <Info label="Skills" value={vol.skills} />
          <Info label="Availability" value={vol.availability} />
          <Info label="Experience Level" value={vol.experience_level} />
          <Info label="Date of Birth" value={vol.date_of_birth ? new Date(vol.date_of_birth).toLocaleDateString() : undefined} />
          <Info label="ID Proof Type" value={vol.id_proof_type} />
          <Info label="Status" value={vol.status} />
          <Info label="Submitted On" value={vol.created_at ? new Date(vol.created_at).toLocaleString() : undefined} />
        </div>

        {vol.motivation && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>Additional Details from Volunteer</div>
            <div
              style={{
                whiteSpace: "pre-wrap",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 12,
                fontSize: 13,
                color: "#111827",
              }}
            >
              {vol.motivation}
            </div>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>Admin Notes</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: "100%", minHeight: 100, padding: 12, borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14 }} />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={() => handleUpdate("approved")} style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #16a34a", background: "#ffffff", color: "#166534", fontWeight: 800, cursor: "pointer" }}>Accept</button>
          <button onClick={() => handleUpdate("rejected")} style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #ef4444", background: "#ffffff", color: "#b91c1c", fontWeight: 800, cursor: "pointer" }}>Reject</button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{value || "—"}</div>
    </div>
  );
}
