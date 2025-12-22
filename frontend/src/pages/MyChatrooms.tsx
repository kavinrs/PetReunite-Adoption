import React, { useEffect, useRef, useState } from "react";
import {
  fetchMyChatrooms,
  fetchChatroomMessages,
  sendChatroomMessage,
  deleteChatroom,
  type ApiResult,
} from "../services/api";
import Toast from "../components/Toast";

interface Chatroom {
  id: number;
  name: string;
  conversation: {
    id: number;
    pet_unique_id: string;
    pet_name: string;
    pet_kind: string;
  };
  pet_unique_id: string;
  pet_kind: string;
  purpose: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  participants: Array<{
    id: number;
    user: {
      id: number;
      username: string;
      full_name: string;
    };
    role: string;
  }>;
}

interface ChatMessage {
  id: number;
  sender: {
    id: number;
    username: string;
    full_name: string;
    is_staff?: boolean;
  };
  text: string;
  reply_to: any | null;
  is_deleted: boolean;
  is_system: boolean;
  created_at: string;
}

export default function MyChatrooms() {
  const [chatrooms, setChatrooms] = useState<Chatroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);
  
  const [selectedChatroomId, setSelectedChatroomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  
  const [messageInput, setMessageInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load chatrooms on mount
  useEffect(() => {
    loadChatrooms();
    const interval = setInterval(loadChatrooms, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Load messages when chatroom is selected
  useEffect(() => {
    if (!selectedChatroomId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      setMessagesLoading(true);
      const res = await fetchChatroomMessages(selectedChatroomId);
      if (!cancelled) {
        if (res.ok && Array.isArray(res.data)) {
          setMessages(res.data as ChatMessage[]);
        } else if (res.error) {
          setMessagesError(res.error);
        }
      }
      setMessagesLoading(false);
    };

    loadMessages();
    const interval = setInterval(loadMessages, 4000); // Poll every 4 seconds
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedChatroomId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function loadChatrooms() {
    setLoading(true);
    setError(null);
    const res = await fetchMyChatrooms();
    if (res.ok && Array.isArray(res.data)) {
      setChatrooms(res.data);
      // Auto-select first chatroom if none selected
      if (!selectedChatroomId && res.data.length > 0) {
        setSelectedChatroomId(res.data[0].id);
      }
    } else {
      setError(res.error || "Failed to load chatrooms");
    }
    setLoading(false);
  }

  async function handleSendMessage() {
    if (!messageInput.trim() || !selectedChatroomId) return;

    const res = await sendChatroomMessage(selectedChatroomId, {
      text: messageInput,
      reply_to_message_id: replyingTo?.id,
    });

    if (res.ok) {
      setMessageInput("");
      setReplyingTo(null);
      // Reload messages immediately
      const messagesRes = await fetchChatroomMessages(selectedChatroomId);
      if (messagesRes.ok && Array.isArray(messagesRes.data)) {
        setMessages(messagesRes.data as ChatMessage[]);
      }
    } else {
      setToast({
        isVisible: true,
        type: "error",
        title: "Error",
        message: res.error || "Failed to send message"
      });
    }
  }

  const selectedChatroom = chatrooms.find((c) => c.id === selectedChatroomId);

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
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={() => setToast(null)}
        />
      )}
      {/* Left Sidebar: Chatroom List */}
      <div
        style={{
          width: 320,
          borderRight: "1px solid #e5e7eb",
          background: "#f3f4f6",
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
            Chat Rooms
          </div>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            Your active chatrooms
          </div>
        </div>

        {/* Chatrooms List */}
        <div
          style={{
            borderRadius: 12,
            background: "#ffffff",
            padding: 10,
            boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            flex: 1,
            overflowY: "auto",
          }}
        >
          {loading && (
            <div style={{ fontSize: 13, color: "#6b7280", padding: 10 }}>
              Loading chatrooms...
            </div>
          )}

          {error && (
            <div
              style={{
                fontSize: 13,
                color: "#b91c1c",
                background: "#fee2e2",
                padding: 8,
                borderRadius: 8,
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && chatrooms.length === 0 && (
            <div
              style={{
                fontSize: 13,
                color: "#9ca3af",
                padding: 10,
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              No chatrooms yet. You'll see rooms here when an admin adds you.
            </div>
          )}

          {!loading &&
            !error &&
            chatrooms.map((chatroom) => (
              <button
                key={chatroom.id}
                type="button"
                onClick={() => setSelectedChatroomId(chatroom.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background:
                    selectedChatroomId === chatroom.id ? "#eef2ff" : "#f9fafb",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {chatroom.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  {chatroom.pet_unique_id} • {chatroom.pet_kind}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                  }}
                >
                  {new Date(chatroom.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Right Side: Chat Interface */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#f9fafb",
        }}
      >
        {!selectedChatroom ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ fontSize: 48 }}>💬</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#0f172a" }}>
              Select a chatroom to start chatting
            </div>
            <div style={{ fontSize: 14, color: "#64748b" }}>
              Choose a chatroom from the left sidebar
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e5e7eb",
                background: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {selectedChatroom.name}
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  {selectedChatroom.pet_unique_id} • {selectedChatroom.purpose}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    padding: "4px 12px",
                    borderRadius: 999,
                    background: "#d1fae5",
                    color: "#065f46",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Active
                </div>
                <button
                  onClick={async () => {
                    if (!selectedChatroomId) return;
                    if (!window.confirm(`Are you sure you want to delete the chatroom "${selectedChatroom.name}"? This action cannot be undone.`)) return;
                    
                    try {
                      const res = await deleteChatroom(selectedChatroomId);
                      if (res.ok) {
                        setToast({
                          isVisible: true,
                          type: "success",
                          title: "Success",
                          message: "Chatroom deleted successfully"
                        });
                        setSelectedChatroomId(null);
                        // Reload chatrooms list
                        loadChatrooms();
                      } else {
                        setToast({
                          isVisible: true,
                          type: "error",
                          title: "Error",
                          message: `Failed to delete chatroom: ${res.error}`
                        });
                      }
                    } catch (err) {
                      console.error("Error deleting chatroom:", err);
                      setToast({
                        isVisible: true,
                        type: "error",
                        title: "Error",
                        message: "An error occurred while deleting the chatroom"
                      });
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "#fee2e2",
                    color: "#991b1b",
                    border: "1px solid #fecaca",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  🗑️ Delete Room
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {messagesLoading && (
                <div style={{ fontSize: 13, color: "#6b7280", textAlign: "center" }}>
                  Loading messages...
                </div>
              )}

              {messagesError && (
                <div
                  style={{
                    fontSize: 13,
                    color: "#b91c1c",
                    background: "#fee2e2",
                    padding: 8,
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  {messagesError}
                </div>
              )}

              {!messagesLoading && messages.length === 0 && (
                <div
                  style={{
                    fontSize: 13,
                    color: "#9ca3af",
                    textAlign: "center",
                    fontStyle: "italic",
                    marginTop: 20,
                  }}
                >
                  No messages yet. Start the conversation!
                </div>
              )}

              {messages.map((msg) => {
                const isSystem = msg.is_system;
                const senderName = msg.sender.full_name || msg.sender.username;
                
                // Determine sender role for color coding
                const isAdmin = msg.sender?.is_staff === true;
                
                // Generate unique color for each user based on their ID
                const getUserColor = (userId: number, isAdmin: boolean) => {
                  if (isAdmin) return "#f59e0b"; // amber-500 for admins
                  
                  // Array of professional, distinct colors for users
                  const userColors = [
                    "#6366f1", // indigo-500
                    "#8b5cf6", // violet-500
                    "#ec4899", // pink-500
                    "#14b8a6", // teal-500
                    "#f97316", // orange-500
                    "#06b6d4", // cyan-500
                    "#84cc16", // lime-500
                    "#a855f7", // purple-500
                    "#10b981", // emerald-500
                    "#f43f5e", // rose-500
                  ];
                  
                  // Use user ID to consistently assign a color
                  return userColors[userId % userColors.length];
                };
                
                const senderNameColor = getUserColor(msg.sender?.id || 0, isAdmin);

                if (isSystem) {
                  return (
                    <div
                      key={msg.id}
                      style={{
                        textAlign: "center",
                        fontSize: 12,
                        color: "#9ca3af",
                        fontStyle: "italic",
                        padding: "8px 0",
                      }}
                    >
                      {msg.text}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      padding: 12,
                      borderRadius: 12,
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                    }}
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    {/* Reply Preview */}
                    {msg.reply_to && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          background: "#f9fafb",
                          padding: "6px 8px",
                          borderRadius: 6,
                          borderLeft: "3px solid #6366f1",
                          marginBottom: 4,
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>
                          Replying to {msg.reply_to.sender?.username || "User"}
                        </div>
                        <div
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {msg.reply_to.text}
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: senderNameColor,
                            marginBottom: 4,
                          }}
                        >
                          {senderName} {isAdmin ? "👑" : ""}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            color: "#0f172a",
                            wordBreak: "break-word",
                          }}
                        >
                          {msg.text}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginTop: 4,
                          }}
                        >
                          {new Date(msg.created_at).toLocaleString()}
                        </div>
                      </div>

                      {/* Three-dot menu button */}
                      {hoveredMessageId === msg.id && !msg.is_system && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            
                            const items = [
                              {
                                label: "Reply",
                                onClick: () => {
                                  setReplyingTo(msg);
                                },
                              },
                              {
                                label: "Delete for me",
                                onClick: async () => {
                                  // TODO: Implement delete for me functionality
                                  console.log("Delete for me:", msg.id);
                                },
                              },
                            ];
                            
                            // Only show "Delete for everyone" for own messages
                            // Check if current user is the sender
                            // For now, we'll add it for all messages - you can add user check later
                            items.push({
                              label: "Delete for everyone",
                              onClick: async () => {
                                if (!window.confirm("Delete this message for everyone?")) return;
                                // TODO: Implement delete for everyone functionality
                                console.log("Delete for everyone:", msg.id);
                              },
                            });
                            
                            // Show menu (you can implement a proper menu component later)
                            // For now, just execute the first action (Reply)
                            items[0].onClick();
                          }}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid #e5e7eb",
                            background: "#ffffff",
                            fontSize: 16,
                            color: "#6b7280",
                            cursor: "pointer",
                            fontWeight: 600,
                            lineHeight: 1,
                          }}
                        >
                          ⋮
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Area */}
            <div
              style={{
                padding: 16,
                borderTop: "1px solid #e5e7eb",
                background: "#ffffff",
              }}
            >
              {/* Reply Preview */}
              {replyingTo && (
                <div
                  style={{
                    marginBottom: 8,
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>
                      Replying to {replyingTo.sender.username}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#0f172a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {replyingTo.text}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: "none",
                      background: "transparent",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Input Box */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: "1px solid #e5e7eb",
                    fontSize: 14,
                    outline: "none",
                    background: "#f9fafb",
                    color: "#111827",
                  }}
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 999,
                    border: "none",
                    background: messageInput.trim() ? "#6366f1" : "#e5e7eb",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: messageInput.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
