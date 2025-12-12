import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { createMessage, getRoomDetail, getRoomMessages } from "../services/api";
import { connectToRoom, sendChatMessage } from "../services/ws";
import type { Message, Room } from "../types";

const ChatRoomView: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [roomRes, msgRes] = await Promise.all([
          getRoomDetail(roomId),
          getRoomMessages(roomId, 50),
        ]);

        if (!roomRes.ok) {
          setError(String(roomRes.error ?? "Failed to load room"));
          return;
        }
        if (!msgRes.ok) {
          setError(String(msgRes.error ?? "Failed to load messages"));
          return;
        }

        setRoom(roomRes.room as Room);
        setMessages(msgRes.messages as Message[]);
      } catch (err) {
        setError("Failed to load room or messages");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const socket = connectToRoom(roomId, token);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "message_created" && data.message) {
          setMessages((prev) => [...prev, data.message as Message]);
        }
        if (data.event === "message_deleted" && data.message_id) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === data.message_id ? { ...m, is_deleted: true } : m
            )
          );
        }
      } catch {
        // ignore malformed messages
      }
    };

    socket.onclose = () => {
      // For now, do nothing special; UI will keep working with REST fallback.
    };

    return () => {
      socket.close();
    };
  }, [roomId, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !roomId) return;

    const socket = socketRef.current;
    const token = localStorage.getItem("token");

    if (socket && socket.readyState === WebSocket.OPEN && token) {
      sendChatMessage(socket, input.trim());
      setInput("");
    } else {
      // Fallback to REST
      try {
        const res = await createMessage(roomId, input.trim());
        if (res.ok && res.message) {
          setMessages((prev) => [...prev, res.message as Message]);
          setInput("");
        }
      } catch {
        // ignore for now; could show error
      }
    }
  };

  if (loading) return <div>Loading room...</div>;
  if (error) return <div className="error-text">{error}</div>;
  if (!room) return <div>Room not found.</div>;

  return (
    <div className="chat-room">
      <h2>{room.title}</h2>
      <div className="chat-messages">
        {messages.map((m) => (
          <div key={m.id} className="chat-message">
            <div className="chat-message-meta">
              <span className="chat-sender">
                {m.sender ? m.sender.username || m.sender.email : "System"}
              </span>
              <span className="chat-timestamp">
                {new Date(m.created_at).toLocaleTimeString()}
              </span>
            </div>
            <div className="chat-message-body">
              {m.is_deleted ? "Message removed by admin" : m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatRoomView;
