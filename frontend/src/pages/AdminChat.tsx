import React from "react";

const mockDirectChats = [
  {
    id: 1,
    name: "Jonathan",
    preview: "User has a question about adoption…",
    time: "10:00 AM",
    unread: 1,
  },
  {
    id: 2,
    name: "Elizabeth Jan",
    preview: "Update on lost pet report…",
    time: "09:40 AM",
    unread: 0,
  },
  {
    id: 3,
    name: "Kevin",
    preview: "Thanks for the quick help!",
    time: "Yesterday",
    unread: 2,
  },
];

const mockRooms = [
  { id: 1, name: "Lost Pets - Chennai" },
  { id: 2, name: "Found Pets - Bangalore" },
  { id: 3, name: "Adoption Follow-ups" },
];

export default function AdminChat() {
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
        {/* Left column: direct chats + chat rooms */}
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
            <input
              type="text"
              placeholder="Search contact"
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                fontSize: 13,
                outline: "none",
              }}
            />

            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              Direct Chats
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                maxHeight: 260,
                overflowY: "auto",
              }}
            >
              {mockDirectChats.map((c, idx) => (
                <button
                  key={c.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr auto",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: idx === 0 ? "#eef2ff" : "#ffffff",
                    cursor: "pointer",
                    textAlign: "left",
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
                    {c.name.charAt(0)}
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
                      {c.name}
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
                      {c.preview}
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
                    <span>{c.time}</span>
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
              gap: 8,
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

        {/* Center column: active conversation */}
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
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Kevin
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>UI / UX Designer</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                🔍
              </button>
              <button
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                📞
              </button>
              <button
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                ⋮
              </button>
            </div>
          </div>

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
              gap: 12,
            }}
          >
            <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
              Yesterday 10:44 AM
            </div>
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "70%",
                padding: "8px 12px",
                borderRadius: 16,
                background: "#f3f4ff",
                fontSize: 13,
                color: "#0f172a",
              }}
            >
              User message preview. This is where the user text will appear.
            </div>
            <div
              style={{
                alignSelf: "flex-end",
                maxWidth: "70%",
                padding: "8px 12px",
                borderRadius: 16,
                background: "#4f46e5",
                fontSize: 13,
                color: "#ffffff",
              }}
            >
              Admin reply bubble example to match the modern UI.
            </div>
          </div>

          <div
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
              type="text"
              placeholder="Type a message here…"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 13,
              }}
            />
            <span style={{ cursor: "pointer" }}>😊</span>
            <span style={{ cursor: "pointer" }}>📎</span>
            <button
              style={{
                border: "none",
                borderRadius: 999,
                padding: "6px 14px",
                background: "#4f46e5",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
  );
}
