import React, { useEffect, useState } from "react";
import {
  fetchChatroomAccessRequests,
  acceptChatroomAccessRequest,
  rejectChatroomAccessRequest,
} from "../services/api";

interface ChatroomAccessRequest {
  id: number;
  chatroom: {
    id: number;
    name: string;
    purpose: string;
  };
  pet: {
    id: number;
    pet_name?: string;
    pet_type: string;
    photo_url?: string;
  };
  pet_unique_id: string;
  pet_kind: string;
  requested_user: {
    id: number;
    username: string;
    full_name: string;
  };
  added_by: {
    id: number;
    username: string;
    full_name: string;
  };
  role: string;
  request_type: string;
  status: string;
  created_at: string;
}

export default function MyChatroomRequests() {
  const [requests, setRequests] = useState<ChatroomAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    setError(null);
    const res = await fetchChatroomAccessRequests();
    if (res.ok && Array.isArray(res.data)) {
      setRequests(res.data);
    } else {
      setError(res.error || "Failed to load requests");
    }
    setLoading(false);
  }

  async function handleAccept(requestId: number) {
    setProcessingId(requestId);
    const res = await acceptChatroomAccessRequest(requestId);
    if (res.ok) {
      // Remove from list or reload
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      alert("Chatroom access accepted! You can now view it in My Chats.");
    } else {
      alert(res.error || "Failed to accept request");
    }
    setProcessingId(null);
  }

  async function handleReject(requestId: number) {
    if (!confirm("Are you sure you want to reject this chatroom invitation?")) {
      return;
    }
    setProcessingId(requestId);
    const res = await rejectChatroomAccessRequest(requestId);
    if (res.ok) {
      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      alert("Chatroom invitation rejected.");
    } else {
      alert(res.error || "Failed to reject request");
    }
    setProcessingId(null);
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 16, color: "#64748b" }}>Loading requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 16, color: "#ef4444" }}>{error}</div>
        <button
          onClick={loadRequests}
          style={{
            marginTop: 16,
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>
          No Pending Requests
        </div>
        <div style={{ fontSize: 14, color: "#64748b" }}>
          You don't have any chatroom invitations at the moment.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
          Chatroom Invitations
        </h2>
        <p style={{ fontSize: 14, color: "#64748b" }}>
          Admin has invited you to join these chatrooms. Accept to start chatting.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {requests.map((request) => (
          <div
            key={request.id}
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              padding: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              {/* Pet Photo */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 8,
                  background: request.pet?.photo_url
                    ? `url(${request.pet.photo_url}) center/cover`
                    : "linear-gradient(135deg, #6366f1, #22c1c3)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 32,
                  fontWeight: 700,
                }}
              >
                {!request.pet?.photo_url && "🐾"}
              </div>

              {/* Request Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                      {request.chatroom.name}
                    </div>
                    <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
                      {request.pet?.pet_name || request.pet?.pet_type || "Pet"} •{" "}
                      {request.chatroom.purpose || "Chat"}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 999,
                      background: "#fef3c7",
                      color: "#92400e",
                      fontSize: 12,
                      fontWeight: 600,
                      height: "fit-content",
                    }}
                  >
                    Pending
                  </span>
                </div>

                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                  <strong>Request Type:</strong> Chatroom Access Request
                  <br />
                  <strong>Invited by:</strong> {request.added_by.full_name || request.added_by.username} (Admin)
                  <br />
                  <strong>Pet ID:</strong> {request.pet_unique_id}
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => handleAccept(request.id)}
                    disabled={processingId === request.id}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 8,
                      border: "none",
                      background: "#10b981",
                      color: "white",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: processingId === request.id ? "not-allowed" : "pointer",
                      opacity: processingId === request.id ? 0.6 : 1,
                    }}
                  >
                    {processingId === request.id ? "Processing..." : "✓ Accept"}
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#ffffff",
                      color: "#ef4444",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: processingId === request.id ? "not-allowed" : "pointer",
                      opacity: processingId === request.id ? 0.6 : 1,
                    }}
                  >
                    {processingId === request.id ? "Processing..." : "✗ Reject"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
