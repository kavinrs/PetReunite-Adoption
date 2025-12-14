import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  fetchChatConversations,
  getRooms,
  createChatConversationWithPet,
  sendChatMessageUser,
} from "../services/api";

// Minimal room type matching the getRooms response shape
type Room = {
  id: number;
  title: string;
  created_at: string;
  updated_at?: string;
};

type Conversation = {
  id: number;
  status: string;
  created_at: string;
  updated_at: string;
  pet_id?: number | null;
  pet_name?: string | null;
  pet_kind?: string | null;
};

// Primary tabs just below the header
type TabKey = "admin" | "rooms";
// Inner tabs shown when Admin Chat is active
type MyChatTabKey = "active" | "request";

interface RoomsPageProps {
  embedded?: boolean;
}

const RoomsPage: React.FC<RoomsPageProps> = ({ embedded = false }) => {
  const [tab, setTab] = useState<TabKey>("admin");
  const [myChatTab, setMyChatTab] = useState<MyChatTabKey>("active");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestPetId, setRequestPetId] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const [convRes, roomRes] = await Promise.all([
        fetchChatConversations(),
        getRooms(),
      ]);

      if (!convRes.ok && !roomRes.ok) {
        setError(
          String(
            convRes.error ?? roomRes.error ?? "Failed to load chats and rooms",
          ),
        );
        setLoading(false);
        return;
      }

      if (convRes.ok && Array.isArray(convRes.data)) {
        setConversations(convRes.data as Conversation[]);
      }
      if (roomRes.ok) {
        setRooms((roomRes.rooms ?? []) as Room[]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const card = (
    <div
      style={{
        width: "100%",
        maxWidth: embedded ? "100%" : 960,
        background: "white",
        borderRadius: 16,
        boxShadow: "0 18px 45px rgba(15,23,42,0.10)",
        border: "1px solid rgba(148,163,184,0.35)",
        padding: 32,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Chat app
          </div>
          <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
            Messenger
          </div>
        </div>
      </div>

      {/* Primary tabs: Admin Chat / Chat Room */}
      <div
        style={{
          marginTop: 8,
          marginBottom: 12,
          display: "inline-flex",
          gap: 10,
          padding: 4,
          borderRadius: 999,
          background: "#f1f5f9",
        }}
      >
        {([
          { id: "admin", label: "Admin Chat" },
          { id: "rooms", label: "Chat Room" },
        ] as { id: TabKey; label: string }[]).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                if (t.id === "admin") {
                  // Default to Active Chats whenever Admin Chat is chosen
                  setMyChatTab("active");
                }
              }}
              style={{
                border: "none",
                background: active ? "white" : "transparent",
                padding: "6px 18px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? "#0f172a" : "#64748b",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div style={{ padding: "24px 4px", fontSize: 14 }}>Loading chats...</div>
      )}

      {error && !loading && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Admin Chat tab with inner tabs */}
      {!loading && !error && tab === "admin" && (
        <div
          style={{
            marginTop: 4,
            padding: 16,
            borderRadius: 14,
            background: "#f9fafb",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              gap: 10,
              padding: 4,
              borderRadius: 999,
              background: "#f1f5f9",
              marginBottom: 18,
            }}
          >
            {(
              [
                { id: "active", label: "Active Chats" },
                { id: "request", label: "My Requests" },
              ] as { id: MyChatTabKey; label: string }[]
            ).map((t) => {
              const active = myChatTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setMyChatTab(t.id);
                    setRequestMessage(null);
                  }}
                  style={{
                    border: "none",
                    background: active ? "white" : "transparent",
                    padding: "6px 14px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? "#0f172a" : "#64748b",
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {myChatTab === "active" && (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 16,
                height: 420,
              }}
            >
              {/* Left column: recent chats list */}
              <div
                style={{
                  flex: "0 0 30%",
                  borderRadius: 12,
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  Recent Admin Chats
                </div>

                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: 8,
                    fontSize: 13,
                    color: "#475569",
                  }}
                >
                  {conversations.length === 0 ? (
                    <div
                      style={{
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        padding: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>💬</div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>
                          No active chats yet
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          You can send a chat request to an admin when you need
                          help.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {conversations.map((c) => (
                        <li
                          key={c.id}
                          style={{
                            borderRadius: 10,
                            padding: "8px 10px",
                            background: "#f8fafc",
                            border: "1px solid rgba(148,163,184,0.6)",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              marginBottom: 2,
                            }}
                          >
                            Pet Claim Chat
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            Pet ID: {c.pet_id ?? "-"}
                            {c.pet_name ? ` • ${c.pet_name}` : ""}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#9ca3af",
                              marginTop: 2,
                            }}
                          >
                            Created: {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Middle column: main chat area placeholder */}
              <div
                style={{
                  flex: "1 1 auto",
                  borderRadius: 12,
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  Admin Chat
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f8fafc",
                    fontSize: 13,
                    color: "#64748b",
                    textAlign: "center",
                    padding: 16,
                  }}
                >
                  Select a chat on the left to view messages. Chat messages will
                  appear here.
                </div>
              </div>
            </div>
          )}

          {myChatTab === "request" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!requestPetId.trim()) {
                  setRequestMessage("Please enter a pet ID.");
                  return;
                }
                setRequestSubmitting(true);
                setRequestMessage(null);
                const payload = {
                  // Backend expects pet_id to link the conversation to a pet.
                  pet_id: Number(requestPetId),
                };
                const res = await createChatConversationWithPet(payload);
                if (res.ok) {
                  const convoId = (res.data as any)?.id;
                  if (convoId && requestReason.trim()) {
                    // Send the user's reason as the first chat message so that
                    // admins see it as the conversation preview / reason.
                    await sendChatMessageUser(convoId, requestReason.trim());
                  }
                  setRequestMessage("Chat request sent to admin.");
                  setRequestPetId("");
                  setRequestReason("");
                } else {
                  setRequestMessage(res.error || "Failed to send chat request.");
                }
                setRequestSubmitting(false);
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 8,
              }}
            >
              <div style={{ fontSize: 14, color: "#64748b" }}>
                Request a new chat with an admin by providing the pet ID and a
                short reason.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                  Pet ID
                </label>
                <input
                  type="number"
                  value={requestPetId}
                  onChange={(e) => setRequestPetId(e.target.value)}
                  style={{
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    padding: "8px 10px",
                    fontSize: 13,
                  }}
                  placeholder="Enter pet ID"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                  Reason for chat
                </label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  rows={3}
                  style={{
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    padding: "8px 10px",
                    fontSize: 13,
                    resize: "vertical",
                  }}
                  placeholder="Describe why you want to chat with the admin"
                />
              </div>

              {requestMessage && (
                <div
                  style={{
                    fontSize: 13,
                    color: requestMessage.includes("sent") ? "#15803d" : "#b91c1c",
                  }}
                >
                  {requestMessage}
                </div>
              )}

              <div style={{ marginTop: 4 }}>
                <button
                  type="submit"
                  disabled={requestSubmitting}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: "none",
                    background: requestSubmitting ? "#7dd3fc" : "#0ea5e9",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: requestSubmitting ? "default" : "pointer",
                  }}
                >
                  {requestSubmitting ? "Sending..." : "Send Chat Request"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Rooms tab */}
      {!loading && !error && tab === "rooms" && rooms.length === 0 && (
        <div
          style={{
            padding: "32px 8px",
            textAlign: "center",
            fontSize: 14,
            color: "#64748b",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            No case rooms yet
          </div>
          <div>
            Admins can open a dedicated room if they need you and another
            user to coordinate directly.
          </div>
        </div>
      )}

      {!loading && !error && tab === "rooms" && rooms.length > 0 && (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {rooms.map((r) => (
            <li key={r.id}>
              <Link
                to={`/user/chat/rooms/${r.id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 10,
                  textDecoration: "none",
                  background: "#f8fafc",
                  color: "#0f172a",
                  border: "1px solid rgba(148,163,184,0.6)",
                  fontSize: 14,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{r.title}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      marginTop: 2,
                    }}
                  >
                    Opened at {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <span style={{ fontSize: 16 }}>›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (embedded) {
    return card;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px 24px 40px",
        background: "#f6f7fb",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      {card}
    </div>
  );
};

export default RoomsPage;
