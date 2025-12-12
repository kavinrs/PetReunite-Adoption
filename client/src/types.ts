export interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: "admin" | "user";
}

export interface Room {
  id: string;
  title: string;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  id: string;
  room: string;
  user: User;
  added_by?: string | null;
  role: "participant" | "admin";
  joined_at: string;
}

export interface Message {
  id: string;
  room: string;
  sender: User | null;
  content: string | null;
  content_type: "text" | "image" | "file" | "system";
  attachments?: Record<string, unknown> | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  error?: string | Record<string, unknown>;
  [key: string]: unknown;
}
