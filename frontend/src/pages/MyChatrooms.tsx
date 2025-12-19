import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMyChatrooms } from "../services/api";

interface Chatroom {
  id: number;
  name: string;
  conversation: {
    id: number;
    topic: string;
  };
  pet_id: number;
  pet_unique_id: string;
  pet_kind: string;
  purpose: string;
  created_by: {
    id: number;
    username: string;
    full_name: string;
  };
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export default function MyChatrooms() {
  const [chatrooms, setChatrooms] = useState<Chatroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadChatrooms();
  }, []);

  async function loadChatrooms() {
    setLoading(true);
    setError(null);
    const res = await fetchMyChatrooms();
    if (res.ok && Array.isArray(res.data)) {
      setChatrooms(res.data);
    } else {
      setError(res.error || "Failed to load chatrooms");
    }
    setLoading(false);
  }

  function handleChatroomClick(chatroom: Chatroom) {
    // Navigate to user chat page with conversation ID
    navigate(`/user/chat?conversation=${chatroom.conversation.id}`);
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 16, color: "#64748b" }}>Loading chatrooms...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 16, color: "#ef4444" }}>{error}</div>
        <button
          onClick={loadChatrooms}
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

  if (chatrooms.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>
          No Active Chatrooms
        </div>
        <div style={{ fontSize: 14, color: "#64748b" }}>
          You haven't joined any chatrooms yet. Check your requests to accept invitations.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
          My Chatrooms
        </h2>
        <p style={{ fontSize: 14, color: "#64748b" }}>
          Chatrooms you have access to. Click to open and start chatting.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {chatrooms.map((chatroom) => (
          <button
            key={chatroom.id}
            onClick={() => handleChatroomClick(chatroom)}
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              padding: 16,
              textAlign: "left",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #6366f1, #22c1c3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                👥
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                  {chatroom.name}
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  {chatroom.purpose || "Chat"}
                </div>
              </div>
              {chatroom.is_active && (
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: 999,
                    background: "#d1fae5",
                    color: "#065f46",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Active
                </span>
              )}
            </div>

            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
              Pet ID: {chatroom.pet_unique_id || "N/A"}
            </div>

            <div style={{ fontSize: 12, color: "#64748b" }}>
              Created by: {chatroom.created_by.full_name || chatroom.created_by.username}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
