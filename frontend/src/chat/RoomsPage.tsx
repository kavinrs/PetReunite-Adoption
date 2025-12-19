import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  fetchChatConversations,
  getRooms,
  createChatConversationWithPet,
  sendChatMessageUser,
  sendChatMessageUserWithReply,
  fetchChatMessagesUser,
  confirmChatConversation,
  getProfile,
  deleteChatConversationUser,
  deleteChatMessageUserForMe,
  deleteChatMessageUserForEveryone,
  fetchMyChatrooms,
  fetchChatroomMessages,
  sendChatroomMessage,
} from "../services/api";

import emojiIcon from "../assets/chat/emoji.png";
import galleryIcon from "../assets/chat/gallery.png";
import sendIcon from "../assets/chat/send.png";

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
  pet_id?: number | null; // legacy numeric ID
  pet_unique_id?: string | null; // preferred stable ID (FP..., LP..., AP...)
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
  const [chatrooms, setChatrooms] = useState<any[]>([]);
  const [selectedChatroomId, setSelectedChatroomId] = useState<number | null>(null);
  const [chatroomMessages, setChatroomMessages] = useState<any[]>([]);
  const [chatroomMessagesLoading, setChatroomMessagesLoading] = useState(false);
  const [chatroomMessageInput, setChatroomMessageInput] = useState("");
  const [chatroomReplyingTo, setChatroomReplyingTo] = useState<any | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestPetId, setRequestPetId] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] =
    useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [menuForMessageId, setMenuForMessageId] = useState<number | null>(null);
  const [optionsMenu, setOptionsMenu] = useState<{
    message: any;
    x: number;
    y: number;
    items: { label: string; onClick: () => void }[];
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    messageId: number;
    x: number;
    y: number;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load conversations and rooms
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const [convRes, roomRes, chatroomsRes] = await Promise.all([
        fetchChatConversations(),
        getRooms(),
        fetchMyChatrooms(),
      ]);

      if (!convRes.ok && !roomRes.ok && !chatroomsRes.ok) {
        setError(
          String(
            convRes.error ?? roomRes.error ?? chatroomsRes.error ?? "Failed to load chats and rooms",
          ),
        );
        setLoading(false);
        return;
      }

      if (convRes.ok && Array.isArray(convRes.data)) {
        const list = convRes.data as Conversation[];
        setConversations(list);
        // Auto-select the most recent conversation so the chat bar works
        // immediately without requiring a manual click.
        if (!selectedConversationId && list.length > 0) {
          setSelectedConversationId(list[0].id);
        }
      }
      
      // Store old rooms separately
      if (roomRes.ok) {
        setRooms((roomRes.rooms ?? []) as Room[]);
      }
      
      // Store chatrooms separately
      if (chatroomsRes.ok && Array.isArray(chatroomsRes.data)) {
        setChatrooms(chatroomsRes.data);
        // Auto-select first chatroom if none selected
        if (!selectedChatroomId && chatroomsRes.data.length > 0) {
          setSelectedChatroomId(chatroomsRes.data[0].id);
        }
      }
      setLoading(false);
    };
    load();
  }, [selectedConversationId]);

  // Load current user profile to know which sender is "me"
  useEffect(() => {
    async function loadProfile() {
      const res = await getProfile();
      console.log("User getProfile response:", res);
      if (res.ok && res.data?.user_unique_id) {
        console.log("Setting currentUserId to:", res.data.user_unique_id);
        setCurrentUserId(res.data.user_unique_id);
      }
    }
    loadProfile();
  }, []);

  // Load messages for the selected conversation and poll periodically
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      setMessagesLoading(true);
      const res = await fetchChatMessagesUser(selectedConversationId);
      if (!cancelled && res.ok && Array.isArray(res.data?.messages ?? res.data)) {
        const list = (res.data.messages ?? res.data) as any[];
        setMessages(list);
      }
      setMessagesLoading(false);
    };

    loadMessages();
    const id = window.setInterval(loadMessages, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [selectedConversationId]);

  // Load messages for the selected chatroom and poll periodically
  useEffect(() => {
    if (!selectedChatroomId || tab !== "rooms") {
      setChatroomMessages([]);
      return;
    }

    let cancelled = false;

    const loadChatroomMessages = async () => {
      setChatroomMessagesLoading(true);
      const res = await fetchChatroomMessages(selectedChatroomId);
      if (!cancelled && res.ok && Array.isArray(res.data)) {
        setChatroomMessages(res.data);
      }
      setChatroomMessagesLoading(false);
    };

    loadChatroomMessages();
    const id = window.setInterval(loadChatroomMessages, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [selectedChatroomId, tab]);

  useEffect(() => {
    if (!selectedConversationId) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversationId, messages.length]);

  useEffect(() => {
    const onDocClick = () => {
      setMenuForMessageId(null);
      setOptionsMenu(null);
      setContextMenu(null);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
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
          {/* Inner taskbar for Active Chats / My Requests */}
          <div
            style={{
              display: "flex",
              gap: 0,
              padding: 4,
              borderRadius: 14,
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              marginBottom: 18,
              height: 44,
              boxSizing: "border-box",
              width: "50%",
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
                    flex: 1,
                    border: "none",
                    background: active ? "#2563eb" : "transparent",
                    height: "100%",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    color: active ? "#ffffff" : "#475569",
                    cursor: "pointer",
                    boxShadow: active
                      ? "0 3px 8px rgba(37,99,235,0.30)"
                      : "none",
                    transition:
                      "background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
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
                  background: "#f3f4f6", // slightly darker than main chat
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
                      {conversations.map((c) => {
                        const status = (c.status || "").toLowerCase();
                        let statusLabel = "Active";
                        let statusColor = "#16a34a"; // green
                        if (
                          status === "requested" ||
                          status === "pending_user" ||
                          status === "read_only"
                        ) {
                          statusLabel = "Waiting";
                          statusColor = "#f59e0b"; // amber
                        } else if (status === "closed") {
                          statusLabel = "Close";
                          statusColor = "#dc2626"; // red
                        }

                        const isSelected = selectedConversationId === c.id;

                        return (
                          <li
                            key={c.id}
                            style={{
                              borderRadius: 10,
                              padding: "8px 10px",
                              background: isSelected ? "#e0f2fe" : "#f8fafc",
                              border: isSelected
                                ? "1px solid #38bdf8"
                                : "1px solid rgba(148,163,184,0.6)",
                              cursor: "pointer",
                              transition: "background 0.15s ease, border-color 0.15s ease",
                            }}
                            onClick={() => setSelectedConversationId(c.id)}
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
                              Pet ID: {c.pet_unique_id || (c.pet_id != null ? `${c.pet_id}` : "-")}
                              {c.pet_name ? ` • ${c.pet_name}` : ""}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginTop: 4,
                                fontSize: 10,
                              }}
                            >
                              <span
                                style={{
                                  padding: "2px 6px",
                                  borderRadius: 999,
                                  background: "#f1f5f9",
                                  color: statusColor,
                                  fontWeight: 600,
                                }}
                              >
                                {statusLabel}
                              </span>
                              <span style={{ color: "#9ca3af" }}>
                                {new Date(c.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Middle column: main chat area */}
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
                {/* Chat header with context */}
                {(() => {
                  const convo = conversations.find(
                    (c) => c.id === selectedConversationId,
                  );
                  const status = (convo?.status || "").toLowerCase();
                  let statusLabel = "Active";
                  let statusColor = "#16a34a";
                  if (
                    status === "requested" ||
                    status === "pending_user" ||
                    status === "read_only"
                  ) {
                    statusLabel = "Waiting";
                    statusColor = "#f59e0b";
                  } else if (status === "closed") {
                    statusLabel = "Close";
                    statusColor = "#dc2626";
                  }

                  return (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderBottom: "1px solid #e5e7eb",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          {convo?.pet_id || convo?.pet_unique_id
                            ? `Pet Claim – ID #${
                                convo.pet_unique_id ??
                                (convo.pet_id != null
                                  ? String(convo.pet_id)
                                  : "?")
                              }`
                            : "Admin Chat"}
                        </div>
                        {convo?.pet_name && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "#64748b",
                              marginTop: 2,
                            }}
                          >
                            Pet: {convo.pet_name}
                          </div>
                        )}
                      </div>
                      {convo && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 999,
                              background: "#f1f5f9",
                              color: statusColor,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {statusLabel}
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!selectedConversationId) return;
                              if (
                                !window.confirm(
                                  "Delete this entire chat and all its messages?",
                                )
                              ) {
                                return;
                              }
                              const res = await deleteChatConversationUser(
                                selectedConversationId,
                              );
                              if (res.ok) {
                                setSelectedConversationId(null);
                                setMessages([]);
                                const convRes = await fetchChatConversations();
                                if (convRes.ok && Array.isArray(convRes.data)) {
                                  setConversations(convRes.data as Conversation[]);
                                }
                              }
                            }}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#dc2626",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            Delete chat
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Messages area */}
                <div
                  style={{
                    flex: 1,
                    background: "#f8fafc",
                    padding: 12,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {!selectedConversationId && (
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
                      Select a chat on the left to view messages. Chat messages
                      will appear here.
                    </div>
                  )}

                  {selectedConversationId &&
                    messages.length === 0 &&
                    !messagesLoading && (
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
                        No messages yet. Say hello to the admin.
                      </div>
                    )}

                  {selectedConversationId &&
                    messages.map((m) => {
                      // System messages: center-aligned pill with icon
                      if (m.is_system) {
                        let icon = "🔔";
                        const text = (m.text || m.content || "") as string;
                        const lower = text.toLowerCase();
                        const color = lower.includes("active")
                          ? "#16a34a"
                          : lower.includes("close") || lower.includes("closed")
                            ? "#dc2626"
                            : lower.includes("waiting")
                              ? "#f59e0b"
                              : "#4b5563";
                        if (text.toLowerCase().includes("joined")) {
                          icon = "👤";
                        } else if (text.toLowerCase().includes("closed")) {
                          icon = "🔒";
                        }
                        return (
                          <div
                            key={m.id || `${m.created_at}-${Math.random()}`}
                            style={{
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <div
                              style={{
                                maxWidth: "80%",
                                padding: "4px 10px",
                                borderRadius: 999,
                                fontSize: 11,
                                background: "#e5e7eb",
                                color,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <span>{icon}</span>
                              <span>{text}</span>
                            </div>
                          </div>
                        );
                      }

                      if (m.is_deleted_for_me || m.text === null) {
                        return null;
                      }

                      const isUser =
                        !m.is_system &&
                        (m.sender_role === "user" ||
                          (currentUserId != null &&
                            (m.sender?.id === currentUserId ||
                              m.sender === currentUserId)));

                      return (
                        <div
                          key={m.id || `${m.created_at}-${Math.random()}`}
                          style={{
                            display: "flex",
                            justifyContent: isUser
                              ? "flex-end"
                              : "flex-start",
                            // Leave a small gutter on the right for the 3-dot menu (so it never overlaps text)
                            paddingRight: isUser ? 32 : 0,
                          }}
                        >
                          <div
                            style={{
                              position: "relative",
                              maxWidth: "70%",
                              padding: "8px 12px",
                              borderRadius: 18,
                              fontSize: 13,
                              lineHeight: 1.4,
                              background: isUser ? "#0ea5e9" : "#e5e7eb",
                              color: isUser ? "#ffffff" : "#111827",
                            }}
                            onMouseEnter={() => setHoveredMessageId(Number(m.id))}
                            onMouseLeave={() => setHoveredMessageId(null)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setContextMenu({
                                messageId: Number(m.id),
                                x: e.clientX,
                                y: e.clientY,
                              });
                            }}
                          >
                            {m.reply_to && (
                              <div
                                style={{
                                  marginBottom: 6,
                                  padding: "6px 8px",
                                  borderRadius: 12,
                                  background: isUser
                                    ? "rgba(255,255,255,0.18)"
                                    : "#f3f4f6",
                                  borderLeft: `3px solid ${
                                    isUser ? "#ffffff" : "#0ea5e9"
                                  }`,
                                  fontSize: 11,
                                  opacity: 0.95,
                                }}
                              >
                                <div style={{ fontWeight: 700, marginBottom: 2 }}>
                                  {m.reply_to?.sender?.username ?? "Reply"}
                                </div>
                                <div
                                  style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {m.reply_to?.text ?? ""}
                                </div>
                              </div>
                            )}

                            {m.is_deleted ? (
                              <span style={{ fontStyle: "italic", opacity: 0.85 }}>
                                Message deleted
                              </span>
                            ) : (
                              (m.text || m.content)
                            )}

                            {hoveredMessageId === Number(m.id) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuForMessageId((prev) =>
                                    prev === Number(m.id) ? null : Number(m.id),
                                  );
                                  setContextMenu(null);
                                  const rect = (
                                    e.currentTarget as HTMLButtonElement
                                  ).getBoundingClientRect();
                                  const items: {
                                    label: string;
                                    onClick: () => void;
                                  }[] = [
                                    {
                                      label: "Reply",
                                      onClick: () => {
                                        setReplyingTo(m);
                                        setMenuForMessageId(null);
                                        setOptionsMenu(null);
                                      },
                                    },
                                    {
                                      label: "Delete for me",
                                      onClick: async () => {
                                        if (!selectedConversationId) return;
                                        await deleteChatMessageUserForMe(
                                          selectedConversationId,
                                          Number(m.id),
                                        );
                                        setMenuForMessageId(null);
                                        setOptionsMenu(null);
                                        const res = await fetchChatMessagesUser(
                                          selectedConversationId,
                                        );
                                        if (res.ok) {
                                          setMessages(
                                            (res.data?.messages ?? res.data) as any[],
                                          );
                                        }
                                      },
                                    },
                                  ];
                                  if (isUser) {
                                    items.push({
                                      label: "Delete for everyone",
                                      onClick: async () => {
                                        if (!selectedConversationId) return;
                                        await deleteChatMessageUserForEveryone(
                                          selectedConversationId,
                                          Number(m.id),
                                        );
                                        setMenuForMessageId(null);
                                        setOptionsMenu(null);
                                        const res = await fetchChatMessagesUser(
                                          selectedConversationId,
                                        );
                                        if (res.ok) {
                                          setMessages(
                                            (res.data?.messages ?? res.data) as any[],
                                          );
                                        }
                                      },
                                    });
                                  }

                                  const menuWidth = 180;
                                  const menuHeight = 10 + items.length * 40;
                                  const x = Math.min(
                                    Math.max(rect.right - menuWidth, 8),
                                    window.innerWidth - menuWidth - 8,
                                  );
                                  const y = Math.min(
                                    Math.max(rect.bottom + 6, 8),
                                    window.innerHeight - menuHeight - 8,
                                  );
                                  setOptionsMenu({ message: m, x, y, items });
                                }}
                                style={{
                                  position: "absolute",
                                  top: 6,
                                  // Fully outside the bubble, inside the gutter
                                  right: -28,
                                  width: 22,
                                  height: 22,
                                  borderRadius: 999,
                                  border: "1px solid rgba(0,0,0,0.15)",
                                  background: "#111827",
                                  color: "#ffffff",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 14,
                                  lineHeight: 1,
                                }}
                                aria-label="Message options"
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

                {/* Bottom chat bar */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!selectedConversationId || !messageInput.trim()) return;

                    const text = messageInput.trim();
                    setMessageInput("");
                    setShowEmojiPicker(false);
                    setMessageError(null);

                    // Ensure conversation is active before sending
                    const convo = conversations.find(
                      (c) => c.id === selectedConversationId,
                    );
                    if (convo && convo.status !== "active") {
                      const confirmRes = await confirmChatConversation(
                        selectedConversationId,
                      );
                      if (!confirmRes.ok) {
                        setMessageError(
                          confirmRes.error ||
                            "Conversation is not ready for messages yet.",
                        );
                        return;
                      }
                      setConversations((prev) =>
                        prev.map((c) =>
                          c.id === selectedConversationId
                            ? { ...c, status: "active" }
                            : c,
                        ),
                      );
                    }

                    const res = replyingTo
                      ? await sendChatMessageUserWithReply(
                          selectedConversationId,
                          text,
                          replyingTo?.id ? Number(replyingTo.id) : undefined,
                        )
                      : await sendChatMessageUser(selectedConversationId, text);
                    if (res.ok) {
                      setReplyingTo(null);
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: res.data?.id ?? `local-${Date.now()}`,
                          text,
                          sender_role: "user",
                          sender: { id: currentUserId },
                          reply_to: replyingTo
                            ? {
                                id: replyingTo.id,
                                text: replyingTo.text ?? "",
                                sender: replyingTo.sender ?? null,
                              }
                            : null,
                        },
                      ]);
                    } else if (res.error) {
                      setMessageError(res.error);
                    }
                  }}
                  style={{
                    padding: 10,
                    borderTop: "1px solid #e5e7eb",
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {replyingTo && (
                      <div
                        style={{
                          borderRadius: 12,
                          padding: "6px 10px",
                          background: "#f1f5f9",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#0f172a",
                            }}
                          >
                            Replying to {replyingTo?.sender?.username ?? "message"}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#475569",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {String(replyingTo?.text ?? "").slice(0, 120)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: 16,
                            lineHeight: 1,
                            color: "#0f172a",
                          }}
                          aria-label="Cancel reply"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    {showEmojiPicker && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "110%",
                          left: 12,
                          zIndex: 10,
                          padding: 6,
                          borderRadius: 12,
                          background: "#ffffff",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 8px 20px rgba(15,23,42,0.12)",
                          display: "flex",
                          gap: 4,
                          fontSize: 18,
                          cursor: "pointer",
                        }}
                      >
                        {["😊", "😂", "😍", "👍", "🙏", "😢"].map((emo) => (
                          <span
                            key={emo}
                            onClick={() => {
                              setMessageInput((prev) => prev + emo);
                            }}
                          >
                            {emo}
                          </span>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        borderRadius: 999,
                        border: "1px solid #e5e7eb",
                        padding: "6px 10px",
                        background: "#ffffff",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker((v) => !v)}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <img
                          src={emojiIcon}
                          alt="Emoji"
                          style={{ width: 20, height: 20 }}
                        />
                      </button>
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message"
                        style={{
                          flex: 1,
                          border: "none",
                          outline: "none",
                          fontSize: 13,
                          background: "#ffffff",
                          color: "#111827",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <img
                          src={galleryIcon}
                          alt="Gallery"
                          style={{ width: 20, height: 20 }}
                        />
                      </button>
                      <button
                        type="submit"
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: selectedConversationId
                            ? "pointer"
                            : "not-allowed",
                          opacity: selectedConversationId ? 0.9 : 0.5,
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <img
                          src={sendIcon}
                          alt="Send"
                          style={{ width: 20, height: 20 }}
                        />
                      </button>
                    </div>

                    {selectedFileName && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          paddingLeft: 6,
                        }}
                      >
                        Selected file: {selectedFileName}
                      </div>
                    )}

                    {messageError && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#b91c1c",
                          paddingLeft: 6,
                          marginTop: 2,
                        }}
                      >
                        {messageError}
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedFileName(file ? file.name : null);
                      }}
                    />
                  </div>
                </form>
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
                const res = await createChatConversationWithPet({
                  // Prefer unique ID if user enters FP/LP/AP..., otherwise fall back to numeric
                  pet_unique_id:
                    requestPetId && /[A-Za-z]/.test(requestPetId)
                      ? requestPetId.trim()
                      : undefined,
                  // Legacy fallback: numeric id
                  pet_id:
                    requestPetId && !/[A-Za-z]/.test(requestPetId)
                      ? Number(requestPetId)
                      : undefined,
                  // Store the user's reason for requesting chat
                  reason_for_chat: requestReason.trim() || undefined,
                });
                if (res.ok) {
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
                  type="text"
                  value={requestPetId}
                  onChange={(e) => setRequestPetId(e.target.value)}
                  style={{
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    padding: "8px 10px",
                    fontSize: 13,
                    background: "#ffffff",
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
                    background: "#ffffff",
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

      {/* Rooms tab - Chatroom Interface with Left-Right Split */}
      {!loading && !error && tab === "rooms" && (
        <div
          style={{
            marginTop: 4,
            display: "flex",
            gap: 12,
            height: "600px",
            borderRadius: 14,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          {/* Left Sidebar - Chatroom List */}
          <div
            style={{
              width: "300px",
              borderRight: "1px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #e2e8f0",
                background: "#ffffff",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
                Recent Admin Chats
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 8,
              }}
            >
              {chatrooms.length === 0 ? (
                <div
                  style={{
                    padding: "32px 8px",
                    textAlign: "center",
                    fontSize: 13,
                    color: "#64748b",
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    No chatrooms yet
                  </div>
                  <div style={{ fontSize: 12 }}>
                    Accept an invitation from admin to join a chatroom.
                  </div>
                </div>
              ) : (
                chatrooms.map((chatroom: any) => (
                  <div
                    key={chatroom.id}
                    onClick={() => setSelectedChatroomId(chatroom.id)}
                    style={{
                      padding: "12px",
                      borderRadius: 10,
                      background: selectedChatroomId === chatroom.id ? "#dbeafe" : "#ffffff",
                      border: `1px solid ${selectedChatroomId === chatroom.id ? "#3b82f6" : "#e5e7eb"}`,
                      cursor: "pointer",
                      marginBottom: 8,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>
                      {chatroom.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      Pet ID: {chatroom.pet_unique_id}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                      {new Date(chatroom.created_at).toLocaleDateString()}
                    </div>
                    {selectedChatroomId === chatroom.id && (
                      <div
                        style={{
                          marginTop: 6,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "#22c55e",
                          color: "white",
                          fontSize: 10,
                          fontWeight: 600,
                          display: "inline-block",
                        }}
                      >
                        Active
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Chat Interface */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
            }}
          >
            {!selectedChatroomId || chatrooms.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 16,
                  color: "#64748b",
                }}
              >
                <div style={{ fontSize: 48 }}>💬</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  Select a chatroom to start messaging
                </div>
                <div style={{ fontSize: 14 }}>
                  Choose a chatroom from the left to view messages
                </div>
              </div>
            ) : (() => {
              const selectedChatroom = chatrooms.find((c: any) => c.id === selectedChatroomId);
              if (!selectedChatroom) return null;

              return (
                <>
                  {/* Chat Header */}
                  <div
                    style={{
                      padding: "12px 20px",
                      borderBottom: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
                        {selectedChatroom.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        Pet: {selectedChatroom.pet_unique_id}
                      </div>
                    </div>
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
                  </div>

                  {/* Messages Area */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: 20,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      background: "#fafafa",
                    }}
                  >
                    {chatroomMessagesLoading && (
                      <div style={{ textAlign: "center", color: "#64748b", fontSize: 13 }}>
                        Loading messages...
                      </div>
                    )}

                    {!chatroomMessagesLoading && chatroomMessages.length === 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          color: "#9ca3af",
                          fontSize: 13,
                          fontStyle: "italic",
                          marginTop: 40,
                        }}
                      >
                        No messages yet. Start the conversation!
                      </div>
                    )}

                    {chatroomMessages.map((msg: any) => {
                      // System messages: center-aligned pill with icon
                      if (msg.is_system) {
                        let icon = "🔔";
                        const text = msg.text || "";
                        const lower = text.toLowerCase();
                        const color = lower.includes("active") || lower.includes("joined") || lower.includes("accepted")
                          ? "#16a34a"
                          : lower.includes("close") || lower.includes("closed") || lower.includes("rejected")
                            ? "#dc2626"
                            : "#4b5563";
                        if (lower.includes("joined") || lower.includes("accepted")) {
                          icon = "👤";
                        } else if (lower.includes("closed") || lower.includes("rejected")) {
                          icon = "🔒";
                        }
                        return (
                          <div
                            key={msg.id}
                            style={{
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <div
                              style={{
                                maxWidth: "80%",
                                padding: "4px 10px",
                                borderRadius: 999,
                                fontSize: 11,
                                background: "#e5e7eb",
                                color,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <span>{icon}</span>
                              <span>{text}</span>
                            </div>
                          </div>
                        );
                      }

                      if (msg.is_deleted) {
                        return null;
                      }

                      const senderName = msg.sender?.full_name || msg.sender?.username || "User";
                      // Compare using stable user_unique_id (USR000024 format)
                      const isMe = msg.sender?.user_unique_id === currentUserId;

                      // Debug logging
                      console.log("User chatroom message:", {
                        text: msg.text,
                        senderUniqueId: msg.sender?.user_unique_id,
                        currentUserId,
                        isMe,
                        comparison: `${msg.sender?.user_unique_id} === ${currentUserId} = ${msg.sender?.user_unique_id === currentUserId}`,
                        sender: msg.sender
                      });

                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isMe ? "flex-end" : "flex-start",
                            paddingRight: isMe ? 32 : 0,
                          }}
                        >
                          {/* Sender Name on Top */}
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#64748b",
                              marginBottom: 4,
                              paddingLeft: isMe ? 0 : 12,
                              paddingRight: isMe ? 12 : 0,
                            }}
                          >
                            {senderName}
                          </div>

                          <div
                            style={{
                              position: "relative",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <div
                              style={{
                                position: "relative",
                                maxWidth: "70%",
                                padding: "10px 14px",
                                borderRadius: 18,
                                fontSize: 14,
                                lineHeight: 1.5,
                                background: isMe ? "#6366f1" : "#ffffff",
                                color: isMe ? "#ffffff" : "#111827",
                                border: isMe ? "none" : "1px solid #e5e7eb",
                                boxShadow: isMe ? "0 2px 8px rgba(99,102,241,0.25)" : "0 2px 8px rgba(0,0,0,0.08)",
                                wordBreak: "break-word",
                                display: "block",
                              }}
                              onMouseEnter={() => setHoveredMessageId(msg.id)}
                              onMouseLeave={() => setHoveredMessageId(null)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setContextMenu({
                                  messageId: msg.id,
                                  x: e.clientX,
                                  y: e.clientY,
                                });
                              }}
                            >
                            {/* Reply Preview */}
                            {msg.reply_to && (
                              <div
                                style={{
                                  marginBottom: 6,
                                  padding: "6px 8px",
                                  borderRadius: 12,
                                  background: isMe ? "rgba(255,255,255,0.18)" : "#f3f4f6",
                                  borderLeft: `3px solid ${isMe ? "#ffffff" : "#0ea5e9"}`,
                                  fontSize: 11,
                                  opacity: 0.95,
                                }}
                              >
                                <div style={{ fontWeight: 700, marginBottom: 2 }}>
                                  {msg.reply_to.sender?.username || "Reply"}
                                </div>
                                <div
                                  style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {msg.reply_to.text || ""}
                                </div>
                              </div>
                            )}

                              {/* Message Text */}
                              <div style={{ 
                                wordBreak: "break-word",
                                whiteSpace: "pre-wrap",
                                display: "block"
                              }}>
                                {msg.text}
                              </div>
                            </div>

                            {/* Three-dot Menu - Closer to message */}
                            {hoveredMessageId === msg.id && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuForMessageId((prev) =>
                                    prev === msg.id ? null : msg.id,
                                  );
                                  setContextMenu(null);
                                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                  const items: { label: string; onClick: () => void }[] = [
                                    {
                                      label: "Reply",
                                      onClick: () => {
                                        setChatroomReplyingTo(msg);
                                        setMenuForMessageId(null);
                                        setOptionsMenu(null);
                                      },
                                    },
                                  ];
                                  setOptionsMenu({
                                    message: msg,
                                    x: rect.right,
                                    y: rect.bottom,
                                    items,
                                  });
                                }}
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: "50%",
                                  border: "1px solid rgba(0,0,0,0.1)",
                                  background: "#111827",
                                  color: "#ffffff",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 14,
                                  lineHeight: 1,
                                  flexShrink: 0,
                                }}
                              >
                                ⋮
                              </button>
                            )}
                          </div>

                          {/* Timestamp */}
                          <div
                            style={{
                              fontSize: 10,
                              color: "#9ca3af",
                              marginTop: 2,
                              paddingLeft: isMe ? 0 : 12,
                              paddingRight: isMe ? 12 : 0,
                            }}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      );
                    })}

                    <div ref={messagesEndRef} />

                    {/* Options Menu Dropdown */}
                    {optionsMenu && (
                      <div
                        style={{
                          position: "fixed",
                          top: optionsMenu.y,
                          left: optionsMenu.x,
                          background: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          zIndex: 1000,
                          minWidth: 150,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {optionsMenu.items.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              item.onClick();
                              setOptionsMenu(null);
                            }}
                            style={{
                              width: "100%",
                              padding: "10px 16px",
                              border: "none",
                              background: "transparent",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: 13,
                              color: "#0f172a",
                              borderBottom: idx < optionsMenu.items.length - 1 ? "1px solid #f1f5f9" : "none",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#f9fafb";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div
                    style={{
                      padding: 16,
                      borderTop: "1px solid #e2e8f0",
                      background: "#ffffff",
                    }}
                  >
                    {/* Reply Preview */}
                    {chatroomReplyingTo && (
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
                            Replying to {chatroomReplyingTo.sender?.username || "User"}
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
                            {chatroomReplyingTo.text}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setChatroomReplyingTo(null)}
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
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ fontSize: 20, cursor: "pointer" }}>😊</div>
                      <input
                        type="text"
                        placeholder="Type a message"
                        value={chatroomMessageInput}
                        onChange={(e) => setChatroomMessageInput(e.target.value)}
                        onKeyPress={async (e) => {
                          if (e.key === "Enter" && !e.shiftKey && chatroomMessageInput.trim()) {
                            e.preventDefault();
                            console.log("User sending chatroom message", { selectedChatroomId, text: chatroomMessageInput });
                            const res = await sendChatroomMessage(selectedChatroomId, {
                              text: chatroomMessageInput,
                              reply_to_message_id: chatroomReplyingTo?.id,
                            });
                            console.log("User chatroom message response", res);
                            if (res.ok) {
                              setChatroomMessageInput("");
                              setChatroomReplyingTo(null);
                              // Reload messages
                              const messagesRes = await fetchChatroomMessages(selectedChatroomId);
                              if (messagesRes.ok && Array.isArray(messagesRes.data)) {
                                setChatroomMessages(messagesRes.data);
                              }
                            } else {
                              console.error("Failed to send message", res.error);
                              alert(`Failed to send message: ${res.error || "Unknown error"}`);
                            }
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
                      <div style={{ fontSize: 20, cursor: "pointer" }}>📎</div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!chatroomMessageInput.trim()) return;
                          console.log("User clicking send button", { selectedChatroomId, text: chatroomMessageInput });
                          const res = await sendChatroomMessage(selectedChatroomId, {
                            text: chatroomMessageInput,
                            reply_to_message_id: chatroomReplyingTo?.id,
                          });
                          console.log("User chatroom message response", res);
                          if (res.ok) {
                            setChatroomMessageInput("");
                            setChatroomReplyingTo(null);
                            // Reload messages
                            const messagesRes = await fetchChatroomMessages(selectedChatroomId);
                            if (messagesRes.ok && Array.isArray(messagesRes.data)) {
                              setChatroomMessages(messagesRes.data);
                            }
                          } else {
                            console.error("Failed to send message", res.error);
                            alert(`Failed to send message: ${res.error || "Unknown error"}`);
                          }
                        }}
                        disabled={!chatroomMessageInput.trim()}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "none",
                          background: chatroomMessageInput.trim() ? "#3b82f6" : "#e5e7eb",
                          color: "white",
                          fontSize: 20,
                          cursor: chatroomMessageInput.trim() ? "pointer" : "not-allowed",
                        }}
                      >
                        ✈️
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 9999,
            minWidth: 160,
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 12px 30px rgba(15,23,42,0.18)",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={async () => {
              if (!selectedConversationId) return;
              const mid = contextMenu.messageId;
              setContextMenu(null);
              await deleteChatMessageUserForMe(selectedConversationId, mid);
              const res = await fetchChatMessagesUser(selectedConversationId);
              if (res.ok) {
                setMessages((res.data?.messages ?? res.data) as any[]);
              }
            }}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              padding: "10px 12px",
              textAlign: "left",
              cursor: "pointer",
              fontSize: 13,
              color: "#111827",
            }}
          >
            Delete message
          </button>
        </div>
      )}

      {optionsMenu && (
        <div
          style={{
            position: "fixed",
            top: optionsMenu.y,
            left: optionsMenu.x,
            zIndex: 10000,
            width: 180,
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 12px 30px rgba(15,23,42,0.18)",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {optionsMenu.items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                padding: "10px 12px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: 13,
                color: "#111827",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
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