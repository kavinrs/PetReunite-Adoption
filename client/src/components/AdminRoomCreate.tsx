import React, { useState } from "react";

import { addMember, createRoom, lookupUserByEmail } from "../services/api";
import type { Room } from "../types";

const AdminRoomCreate: React.FC = () => {
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await createRoom(title);
      if (!res.ok || !res.room) {
        setError(String(res.error ?? "Failed to create room"));
        return;
      }
      setRoom(res.room as Room);
      setMessage("Room created. You can now add members.");
    } catch {
      setError("Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) {
      setError("Create a room first");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const lookup = await lookupUserByEmail(email);
      if (!lookup.ok || !lookup.user) {
        setError(String(lookup.error ?? "User not found"));
        return;
      }

      const user = lookup.user as any;
      const addRes = await addMember(room.id, user.id as string);
      if (!addRes.ok) {
        setError(String(addRes.error ?? "Failed to add member"));
        return;
      }
      setMessage("Member added to room.");
    } catch {
      setError("Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-room-create">
      <h2>Admin: Create Room &amp; Add Members</h2>

      <form onSubmit={handleCreateRoom} className="admin-form">
        <label>
          Room title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Room"}
        </button>
      </form>

      {room && (
        <div className="admin-room-info">
          <p>
            Created room: <strong>{room.title}</strong> (id: {room.id})
          </p>
        </div>
      )}

      <form onSubmit={handleAddMember} className="admin-form">
        <label>
          Add member by email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading || !room}>
          {loading ? "Adding..." : "Add Member"}
        </button>
      </form>

      {message && <div className="success-text">{message}</div>}
      {error && <div className="error-text">{error}</div>}
    </div>
  );
};

export default AdminRoomCreate;
