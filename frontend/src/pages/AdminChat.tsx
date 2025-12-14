import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAdminChatConversations,
  acceptAdminConversation,
  closeAdminConversation,
  fetchAdminLostReports,
  fetchAdminFoundReports,
  fetchChatMessagesAdmin,
  sendChatMessageAdmin,
  type ApiResult,
} from "../services/api";

const mockRooms = [
  { id: 1, name: "Lost Pets - Chennai" },
  { id: 2, name: "Found Pets - Bangalore" },
  { id: 3, name: "Adoption Follow-ups" },
];

export default function AdminChat() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [centerView, setCenterView] = useState<"chat" | "requests">("chat");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [selectedPet, setSelectedPet] = useState<any | null>(null);
  const [selectedPetSource, setSelectedPetSource] = useState<
    "lost" | "found" | null
  >(null);
  const [petLoading, setPetLoading] = useState(false);
  const [petError, setPetError] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] =
    useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load admin chat conversations (both pending requests and active chats)
  async function loadConversations(statusFilter?: string) {
    setLoading(true);
    setError(null);
    const res: ApiResult = await fetchAdminChatConversations(statusFilter);
    if (res.ok) {
      setConversations((res.data as any[]) ?? []);
    } else if (res.error) {
      setError(res.error);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadConversations();
    const id = window.setInterval(() => {
      loadConversations();
    }, 10000);
    return () => window.clearInterval(id);
  }, []);

  // When a request is selected, try to load its pet details using the
  // existing admin lost/found report APIs so we can show pet_name and
  // pet_type and navigate to the correct detail page.
  useEffect(() => {
    async function loadPet() {
      setSelectedPet(null);
      setSelectedPetSource(null);
      setPetError(null);
      setSelectedReason(null);

      const petId = selectedRequest?.pet_id;
      const convoId = selectedRequest?.id;
      if (!petId && !convoId) return;

      setPetLoading(true);
      try {
        // First try lost reports
        const lostRes = await fetchAdminLostReports("all");
        if (lostRes.ok && Array.isArray(lostRes.data)) {
          const list = lostRes.data as any[];
          const found = list.find((r) => String(r.id) === String(petId));
          if (found) {
            setSelectedPet(found);
            setSelectedPetSource("lost");
            setPetLoading(false);
            return;
          }
        }

        // Then try found reports
        const foundRes = await fetchAdminFoundReports("all");
        if (foundRes.ok && Array.isArray(foundRes.data)) {
          const list = foundRes.data as any[];
          const found = list.find((r) => String(r.id) === String(petId));
          if (found) {
            setSelectedPet(found);
            setSelectedPetSource("found");
            setPetLoading(false);
            return;
          }
        }

        setPetError("Pet details not found for this ID.");

        // Regardless of pet lookup outcome, also load the last message
        // so we can show the user's reason for chat.
      } finally {
        setPetLoading(false);
      }

      if (convoId) {
        try {
          const msgRes = await fetchChatMessagesAdmin(convoId);
          if (msgRes.ok && Array.isArray(msgRes.data)) {
            const messages = msgRes.data as any[];
            const last = messages[messages.length - 1];
            if (last && typeof last.text === "string") {
              setSelectedReason(last.text);
            }
          }
        } catch (e) {
          // ignore message load errors for now
        }
      }
    }

    loadPet();
  }, [selectedRequest]);

  // Load messages for the selected direct chat conversation (admin side)
  useEffect(() => {
    if (!selectedConversationId) {
      setChatMessages([]);
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      setChatLoading(true);
      const res = await fetchChatMessagesAdmin(selectedConversationId);
      if (!cancelled) {
        if (res.ok && Array.isArray(res.data)) {
          setChatMessages(res.data as any[]);
        } else if (res.error) {
          setChatError(res.error);
        }
      }
      setChatLoading(false);
    };

    loadMessages();
    const id = window.setInterval(loadMessages, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [selectedConversationId]);

  const getUserDisplayName = (c: any): string => {
    // Try several possible fields that backend might use
    const direct =
      c.user_full_name ||
      c.user_username ||
      c.full_name ||
      c.username ||
      c.name;
    const nested = c.user || c.requester || c.owner;
    const nestedName =
      nested?.full_name || nested?.username || nested?.name || nested?.email;
    return String(direct || nestedName || "User");
  };

  const pendingRequests = useMemo(
    () =>
      (conversations ?? []).filter((c: any) => {
        const s = (c.status || "").toLowerCase();
        return s === "pending" || s === "requested";
      }),
    [conversations],
  );

  const directChats = useMemo(
    () =>
      (conversations ?? []).filter((c: any) => {
        const s = (c.status || "").toLowerCase();
        return s !== "pending" && s !== "requested" && s !== "closed";
      }),
    [conversations],
  );

  const handleAcceptRequest = async (id: number) => {
    setLoading(true);
    const res = await acceptAdminConversation(id);
    if (!res.ok && res.error) {
      setError(res.error);
    }
    await loadConversations();
  };

  // Try to auto-select the first active direct chat if none is selected yet
  useEffect(() => {
    if (selectedConversationId || directChats.length === 0) return;
    const first = directChats[0];
    if (first) {
      setSelectedConversationId(first.id);
    }
  }, [selectedConversationId, directChats]);

  const handleRejectRequest = async (id: number) => {
    setLoading(true);
    const res = await closeAdminConversation(id);
    if (!res.ok && res.error) {
      setError(res.error);
    }
    await loadConversations();
  };

  const activeConversation =
    selectedConversationId != null
      ? conversations.find((c: any) => c.id === selectedConversationId) || null
      : null;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "78vh",
        borderRadius: 18,
        background: "#ffffff",
        boxShadow: "0 18px 60px rgba(15,23,42,0.20)",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* Left column: header + requests + direct chats + rooms */}
      <div
        style={{
          width: 320,
          borderRight: "1px solid #e5e7eb",
          background: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          padding: 16,
          boxSizing: "border-box",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 4,
            }}
          >
            Chat
          </div>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            Manage direct chats and case rooms.
          </div>
        </div>

        {pendingRequests.length > 0 && (
          <div
            style={{
              borderRadius: 10,
              background: "#f9fafb",
              padding: 8,
              border: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => setCenterView("requests")}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Requests
            </span>
            <span
              style={{
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 999,
                background: "#e0f2fe",
                color: "#0369a1",
                fontWeight: 600,
              }}
            >
              {pendingRequests.length}
            </span>
          </div>
        )}

        {/* Direct Chats card */}
        <div
          style={{
            borderRadius: 12,
            background: "#ffffff",
            padding: 10,
            boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <input
            type="text"
            placeholder="Search contact"
            style={{
              width: "100%",
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              fontSize: 13,
              outline: "none",
              background: "#ffffff",
              color: "#111827",
            }}
          />

          <div
            style={{
              fontSize: 12,
              color: "#9ca3af",
              marginTop: 4,
            }}
          >
            Direct Chats
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxHeight: 210,
              overflowY: "auto",
            }}
          >
            {directChats.map((c: any, idx: number) => (
              <button
                key={c.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr auto",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background:
                    selectedConversationId === c.id
                      ? "#eef2ff"
                      : "#f9fafb",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onClick={() => {
                  setSelectedConversationId(c.id);
                  setCenterView("chat");
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#6366f1,#22c1c3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {getUserDisplayName(c).charAt(0)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: 2,
                    }}
                  >
                    {getUserDisplayName(c)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.topic || c.last_message_preview || "Conversation"}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 4,
                    fontSize: 11,
                    color: "#9ca3af",
                  }}
                >
                  <span>
                    {c.updated_at
                      ? new Date(c.updated_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                  {c.unread > 0 && (
                    <span
                      style={{
                        minWidth: 18,
                        padding: "2px 6px",
                        borderRadius: 999,
                        background: "#f97316",
                        color: "white",
                        fontSize: 10,
                        fontWeight: 700,
                        textAlign: "center",
                      }}
                    >
                      {c.unread}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            borderRadius: 12,
            background: "#ffffff",
            padding: 10,
            boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            <span>Chat Rooms</span>
            <span style={{ fontSize: 18, cursor: "pointer" }}>+</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: 160,
              overflowY: "auto",
            }}
          >
            {mockRooms.map((r) => (
              <button
                key={r.id}
                style={{
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  padding: "6px 8px",
                  fontSize: 12,
                  textAlign: "left",
                  cursor: "pointer",
                  background: "#f9fafb",
                }}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center column: active conversation or requests list */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 16,
          boxSizing: "border-box",
          background: "#f9fafb",
        }}
      >
        {centerView === "requests" ? (
          <div
            style={{
              flex: 1,
              borderRadius: 16,
              background: "#ffffff",
              padding: 16,
              marginBottom: 12,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                Requests
              </div>
              <div
                style={{
                  fontSize: 12,
                  padding: "3px 8px",
                  borderRadius: 999,
                  background: "#e0f2fe",
                  color: "#0369a1",
                  fontWeight: 600,
                }}
              >
                {pendingRequests.length} pending
              </div>
            </div>

            {loading && (
              <div style={{ fontSize: 13, color: "#6b7280" }}>Loading...</div>
            )}
            {error && (
              <div
                style={{
                  fontSize: 13,
                  color: "#b91c1c",
                  background: "#fee2e2",
                  padding: 8,
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {pendingRequests.map((c: any) => {
                const isSelected = selectedRequest && selectedRequest.id === c.id;
                return (
                  <div
                    key={c.id}
                    style={{
                      perspective: 1000,
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        minHeight: isSelected ? 170 : 80,
                        transformStyle: "preserve-3d",
                        transition: "transform 0.6s, min-height 0.3s",
                        transform: isSelected
                          ? "rotateY(180deg)"
                          : "rotateY(0deg)",
                      }}
                    >
                      {/* Front side: summary */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          padding: 10,
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 8,
                          alignItems: "center",
                          backfaceVisibility: "hidden",
                          background: "#ffffff",
                          borderRadius: 12,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#0f172a",
                              marginBottom: 2,
                            }}
                          >
                            {getUserDisplayName(c)}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#64748b",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {c.topic || c.last_message_preview || "Chat request"}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#9ca3af",
                              marginTop: 2,
                            }}
                          >
                            {c.created_at
                              ? new Date(c.created_at).toLocaleString()
                              : ""}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            alignItems: "flex-end",
                          }}
                        >
                          <button
                            onClick={() => setSelectedRequest(c)}
                            style={{
                              border: "1px solid #e5e7eb",
                              borderRadius: 999,
                              padding: "3px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                              background: "#ffffff",
                              color: "#0f172a",
                              cursor: "pointer",
                            }}
                          >
                            View details
                          </button>
                        </div>
                      </div>

                      {/* Back side: detailed view */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          padding: 12,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          backfaceVisibility: "hidden",
                          background: "#ffffff",
                          borderRadius: 12,
                          transform: "rotateY(180deg)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#0f172a",
                            }}
                          >
                            {getUserDisplayName(c)}
                          </div>
                          <div
                            style={{ fontSize: 11, color: "#6b7280" }}
                          >
                            {c.created_at
                              ? new Date(c.created_at).toLocaleString()
                              : ""}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 8,
                            fontSize: 12,
                            color: "#374151",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600 }}>Pet name</div>
                            <div>{selectedPet?.pet_name || c.pet_name || "-"}</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>Pet type</div>
                            <div>
                              {selectedPet?.pet_type ||
                                c.pet_type ||
                                c.pet_kind ||
                                "-"}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>Pet ID</div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span>{c.pet_id ?? "-"}</span>
                              {c.pet_id && (
                                <button
                                  onClick={() => {
                                    const reportId = selectedPet?.id ?? c.pet_id;
                                    if (selectedPetSource === "found") {
                                      navigate(`/admin/found/${reportId}`, {
                                        state: { from: "admin-chat-requests" },
                                      });
                                    } else if (selectedPetSource === "lost") {
                                      navigate(`/admin/lost/${reportId}`, {
                                        state: { from: "admin-chat-requests" },
                                      });
                                    } else {
                                      navigate(`/pets/${c.pet_id}`);
                                    }
                                  }}
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: 999,
                                    border: "1px solid #e5e7eb",
                                    background: "#ffffff",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "#0f172a",
                                    cursor: "pointer",
                                  }}
                                >
                                  Pet details
                                </button>
                              )}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>Reason for chat</div>
                            <div
                              style={{
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                              }}
                            >
                              {selectedReason ||
                                c.topic ||
                                c.reason ||
                                c.last_message_preview ||
                                "-"}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 8,
                            marginTop: 4,
                          }}
                        >
                          <button
                            onClick={() => setSelectedRequest(null)}
                            style={{
                              borderRadius: 999,
                              border: "1px solid #e5e7eb",
                              padding: "4px 10px",
                              background: "#ffffff",
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#374151",
                              cursor: "pointer",
                            }}
                          >
                            Back
                          </button>
                          <button
                            onClick={() => {
                              setCenterView("chat");
                              handleAcceptRequest(c.id);
                            }}
                            style={{
                              border: "none",
                              borderRadius: 999,
                              padding: "4px 12px",
                              background: "#22c55e",
                              color: "#ffffff",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(c.id)}
                            style={{
                              border: "none",
                              borderRadius: 999,
                              padding: "4px 12px",
                              background: "#fee2e2",
                              color: "#b91c1c",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {pendingRequests.length === 0 && !loading && !error && (
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  No pending requests.
                </div>
              )}
            </div>

          </div>
        ) : (
          <>
            {/* Active chat header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {activeConversation
                  ? getUserDisplayName(activeConversation)
                  : "No chat selected"}
              </div>
              {activeConversation && (
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Chat with user
                </div>
              )}
            </div>

            {/* Messages list */}
            <div
              style={{
                flex: 1,
                borderRadius: 16,
                background: "#ffffff",
                padding: 16,
                marginBottom: 12,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {!activeConversation && (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    color: "#64748b",
                    textAlign: "center",
                  }}
                >
                  Select a chat on the left to start messaging.
                </div>
              )}

              {activeConversation && chatMessages.length === 0 && !chatLoading && (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    color: "#64748b",
                    textAlign: "center",
                  }}
                >
                  No messages yet. Say hello to the user.
                </div>
              )}

              {activeConversation &&
                chatMessages.map((m: any) => {
                  const userId = activeConversation.user?.id;
                  const isAdmin =
                    !m.is_system && userId && m.sender && m.sender.id !== userId;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        justifyContent: isAdmin
                          ? "flex-end"
                          : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "70%",
                          padding: "8px 12px",
                          borderRadius: 18,
                          fontSize: 13,
                          lineHeight: 1.4,
                          background: isAdmin ? "#4f46e5" : "#e5e7eb",
                          color: isAdmin ? "#ffffff" : "#111827",
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Bottom admin chat input */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!activeConversation || !chatInput.trim()) return;
                const text = chatInput.trim();
                setChatInput("");
                setChatError(null);
                const res = await sendChatMessageAdmin(activeConversation.id, text);
                if (res.ok) {
                  setChatMessages((prev) => [
                    ...prev,
                    {
                      id: res.data?.id ?? `local-${Date.now()}`,
                      text,
                      is_system: false,
                      sender: activeConversation.admin || null,
                    },
                  ]);
                } else if (res.error) {
                  setChatError(res.error);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#ffffff",
                borderRadius: 999,
                padding: "6px 12px",
                border: "1px solid #e5e7eb",
              }}
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message here..."
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "#111827",
                  background: "#ffffff",
                }}
              />
              <button
                type="submit"
                style={{
                  border: "none",
                  borderRadius: 999,
                  padding: "6px 14px",
                  background: "#4f46e5",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: activeConversation ? "pointer" : "not-allowed",
                  opacity: activeConversation ? 1 : 0.5,
                }}
              >
                Send
              </button>
            </form>

            {chatError && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#b91c1c",
                }}
              >
                {chatError}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
