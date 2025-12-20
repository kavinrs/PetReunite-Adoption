import React, { useEffect, useState } from "react";
import {
  fetchChatroomAccessRequests,
  acceptChatroomAccessRequest,
  rejectChatroomAccessRequest,
} from "../services/api";
import Toast from "../components/Toast";

interface ChatroomAccessRequest {
  id: number;
  chatroom: number | null;
  chatroom_name: string | null;
  pet: number | null;
  pet_unique_id: string;
  pet_kind: string;
  pet_name: string;
  pet_type: string;
  pet_breed: string;
  pet_image: string | null;
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
  responded_at: string | null;
}

export default function MyChatroomRequests() {
  const [requests, setRequests] = useState<ChatroomAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    setError(null);
    const res = await fetchChatroomAccessRequests();
    if (res.ok && Array.isArray(res.data)) {
      // Show ALL requests (pending, accepted, rejected) - persistent history
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
      // Update status in the list (don't remove)
      setRequests((prev) => prev.map((r) => 
        r.id === requestId ? { ...r, status: 'accepted', responded_at: new Date().toISOString() } : r
      ));
      // Show success message
      setToast({
        isVisible: true,
        type: "success",
        title: "Success",
        message: "Chatroom invitation accepted! The chatroom has been created and you can now access it in Chat Rooms."
      });
    } else {
      setToast({
        isVisible: true,
        type: "error",
        title: "Error",
        message: res.error || "Failed to accept request"
      });
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
      // Update status in the list (don't remove)
      setRequests((prev) => prev.map((r) => 
        r.id === requestId ? { ...r, status: 'rejected', responded_at: new Date().toISOString() } : r
      ));
      setToast({
        isVisible: true,
        type: "success",
        title: "Success",
        message: "Chatroom invitation rejected."
      });
    } else {
      setToast({
        isVisible: true,
        type: "error",
        title: "Error",
        message: res.error || "Failed to reject request"
      });
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
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={() => setToast(null)}
        />
      )}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
          Chatroom Invitations
        </h2>
        <p style={{ fontSize: 14, color: "#64748b" }}>
          Admin has invited you to join these chatrooms. Accept to start chatting.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {requests.map((request) => {
          return (
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
                    background: request.pet_image
                      ? `url(${request.pet_image}) center/cover`
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
                  {!request.pet_image && "🐾"}
                </div>

                {/* Request Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                      {request.chatroom_name || `${request.pet_name} - ${request.pet_kind} Case`}
                    </div>
                    <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
                      {request.pet_name} • {request.pet_type}
                      {request.pet_breed && ` • ${request.pet_breed}`}
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                    <strong>Context:</strong> Chat room creation request from Admin
                    <br />
                    <strong>Requested by:</strong> {request.added_by.full_name || request.added_by.username}
                    <br />
                    <strong>Pet ID:</strong> {request.pet_unique_id}
                    <br />
                    <strong>Request Type:</strong> {request.request_type === "chatroom_creation_request" ? "Chatroom Creation Request" : "Chatroom Join Request"}
                  </div>

                  {/* Status Badge */}
                  <div style={{ marginBottom: 12 }}>
                    {request.status === 'pending' && (
                      <div>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: 999,
                          background: "#fef3c7",
                          color: "#92400e",
                          fontSize: 12,
                          fontWeight: 600,
                          marginBottom: 4,
                        }}>
                          Pending
                        </span>
                        <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                          Waiting for your response
                        </div>
                      </div>
                    )}
                    {request.status === 'accepted' && (
                      <div>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: 999,
                          background: "#d1fae5",
                          color: "#065f46",
                          fontSize: 12,
                          fontWeight: 600,
                          marginBottom: 4,
                        }}>
                          Accepted
                        </span>
                        <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                          You accepted this invitation. Go to Chat Rooms to access it.
                        </div>
                      </div>
                    )}
                    {request.status === 'rejected' && (
                      <div>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: 999,
                          background: "#fee2e2",
                          color: "#991b1b",
                          fontSize: 12,
                          fontWeight: 600,
                          marginBottom: 4,
                        }}>
                          Rejected
                        </span>
                        <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                          You rejected this invitation.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - Only show for pending requests */}
                  {request.status === 'pending' && (
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
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
