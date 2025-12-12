import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getRooms } from "../services/api";
import type { Room } from "../types";

export const RoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getRooms();
        if (!res.ok) {
          setError(String(res.error ?? "Failed to load rooms"));
          return;
        }
        setRooms(res.rooms as Room[]);
      } catch (err) {
        setError("Failed to load rooms");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div>Loading rooms...</div>;
  if (error) return <div className="error-text">{error}</div>;

  return (
    <div>
      <h2>Your Rooms</h2>
      {rooms.length === 0 && <p>No rooms yet.</p>}
      <ul className="room-list">
        {rooms.map((r) => (
          <li key={r.id}>
            <Link to={`/rooms/${r.id}`}>{r.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
