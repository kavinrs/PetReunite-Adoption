import React, { useState } from "react";
import { createChatroomInvitation } from "../services/api";
import Toast from "./Toast";

interface ChatroomInvitationButtonProps {
  userId: number;
  petUniqueId: string;
  petKind: "lost" | "found";
  conversationId?: number;
  userName?: string;
  style?: React.CSSProperties;
}

export default function ChatroomInvitationButton({
  userId,
  petUniqueId,
  petKind,
  conversationId,
  userName,
  style,
}: ChatroomInvitationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  async function handleSendInvitation() {
    if (!confirm(`Send chatroom invitation to ${userName || "this user"}?`)) {
      return;
    }

    setLoading(true);
    const res = await createChatroomInvitation({
      user_id: userId,
      pet_unique_id: petUniqueId,
      pet_kind: petKind,
      conversation_id: conversationId,
    });

    if (res.ok) {
      setSent(true);
      setToast({
        isVisible: true,
        type: "success",
        title: "Invitation Sent",
        message: "Chatroom invitation sent successfully! The user will receive a notification."
      });
      setTimeout(() => setSent(false), 3000);
    } else {
      setToast({
        isVisible: true,
        type: "error",
        title: "Error",
        message: res.error || "Failed to send chatroom invitation"
      });
    }
    setLoading(false);
  }

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={() => setToast(null)}
        />
      )}
      <button
        onClick={handleSendInvitation}
        disabled={loading || sent}
        style={{
          width: "100%",
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          background: sent ? "#10b981" : loading ? "#9ca3af" : "#3b82f6",
          color: "white",
          fontSize: 14,
          fontWeight: 600,
          cursor: loading || sent ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "all 0.2s",
          ...style,
      }}
    >
      {loading ? "Sending..." : sent ? "✓ Invitation Sent" : "📨 Send Chatroom Invitation"}
    </button>
    </>
  );
}
