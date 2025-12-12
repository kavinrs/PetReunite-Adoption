import type { Message } from "../types";

const WS_BASE = import.meta.env.VITE_WS_BASE || "ws://localhost:8000/ws/chat";

export function connectToRoom(roomId: string, token: string): WebSocket {
  const url = `${WS_BASE}/${roomId}/?token=${encodeURIComponent(token)}`;
  return new WebSocket(url);
}

export function sendChatMessage(
  socket: WebSocket,
  content: string,
  content_type: Message["content_type"] = "text",
  attachments?: Record<string, unknown>
) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "send_message",
        content,
        content_type,
        attachments,
      })
    );
  }
}
