import React, { useEffect, useRef, useState } from "react";

interface Message {
  id: number;
  sender_name: string;
  is_admin: boolean;
  text: string;
  created_at: string;
  read: boolean;
}

interface ChatWidgetProps {
  adoptionRequestId: number;
  petName: string;
  petId?: string | number;
  status: "pending" | "approved" | "rejected";
  onClose: () => void;
}

export default function ChatWidget({
  adoptionRequestId,
  petName,
  petId,
  status,
  onClose,
}: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchMessages();
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [adoptionRequestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `/api/pets/adoption-requests/${adoptionRequestId}/messages/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        setError("Failed to load messages");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    const token = localStorage.getItem("access_token");
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/adoption/${adoptionRequestId}/chat/?token=${token}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setConnected(true);
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "chat_message") {
          setMessages((prev) => [...prev, data.message]);
        } else if (data.error) {
          setError(data.error);
        }
      };

      wsRef.current.onerror = () => {
        setConnected(false);
        setError("Connection error. Messages may not be real-time.");
      };

      wsRef.current.onclose = () => {
        setConnected(false);
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (adoptionRequestId) {
            setupWebSocket();
          }
        }, 3000);
      };
    } catch (err) {
      setError("Failed to establish real-time connection");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      // Send via WebSocket if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            message: messageText,
          })
        );
      } else {
        // Fallback to HTTP API
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `/api/pets/adoption-requests/${adoptionRequestId}/messages/create/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: messageText,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setMessages((prev) => [...prev, data]);
        } else {
          setError("Failed to send message");
        }
      }
    } catch (err) {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusColor = () => {
    switch (status) {
      case "approved":
        return "#10b981";
      case "rejected":
        return "#ef4444";
      default:
        return "#f59e0b";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "approved":
        return "APPROVED";
      case "rejected":
        return "REJECTED";
      default:
        return "PENDING";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "400px",
        height: "100vh",
        background: "white",
        boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "white",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "rgba(255,255,255,0.2)",
            border: "none",
            color: "white",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            cursor: "pointer",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            🐾
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: "700" }}>
              {petName}{petId ? ` - ID #${petId}` : ""}
            </div>
            <div
              style={{
                fontSize: "12px",
                background: getStatusColor(),
                color: "white",
                padding: "2px 8px",
                borderRadius: "12px",
                display: "inline-block",
                marginTop: "4px",
              }}
            >
              {getStatusText()}
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "20px",
            fontSize: "11px",
            opacity: 0.8,
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: connected ? "#10b981" : "#ef4444",
            }}
          />
          {connected ? "Connected" : "Disconnected"}
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "16px",
          background: "#f9fafb",
          scrollBehavior: "smooth",
          maxHeight: "calc(100vh - 280px)",
          minHeight: 0,
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: "#6b7280",
            }}
          >
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>💬</div>
              <div style={{ fontSize: "16px", fontWeight: "600" }}>
                Start the conversation
              </div>
              <div style={{ fontSize: "14px", marginTop: "4px" }}>
                Send a message to the admin about your adoption request
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: message.is_admin ? "flex-start" : "flex-end",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "12px 16px",
                    borderRadius: "16px",
                    background: message.is_admin
                      ? "white"
                      : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: message.is_admin ? "#374151" : "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    fontSize: "14px",
                    lineHeight: "1.4",
                  }}
                >
                  {message.text}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    marginTop: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>
                    {message.is_admin ? "Admin" : "You"} •{" "}
                    {formatTime(message.created_at)}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: "8px 16px",
            background: "#fef2f2",
            borderTop: "1px solid #fecaca",
            color: "#dc2626",
            fontSize: "12px",
          }}
        >
          {error}
        </div>
      )}

      {/* Message Input */}
      <div
        style={{
          padding: "16px",
          borderTop: "1px solid #e5e7eb",
          background: "white",
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={2}
            style={{
              flex: 1,
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            style={{
              padding: "12px 16px",
              background:
                !newMessage.trim() || sending
                  ? "#d1d5db"
                  : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor:
                !newMessage.trim() || sending ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "600",
              minWidth: "60px",
            }}
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#9ca3af",
            marginTop: "6px",
          }}
        >
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
