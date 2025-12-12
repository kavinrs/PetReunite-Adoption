import axios from "axios";

import type { ApiResponse, Message, Room, RoomMember, User } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function register(email: string, password: string) {
  const res = await api.post<ApiResponse<{ user: User; tokens: unknown }>>(
    "/auth/register",
    { email, password }
  );
  return res.data;
}

export async function login(usernameOrEmail: string, password: string) {
  const payload: Record<string, string> = { password };
  if (usernameOrEmail.includes("@")) {
    payload.email = usernameOrEmail;
  } else {
    payload.username = usernameOrEmail;
  }
  const res = await api.post<ApiResponse<{ tokens: any; user: User }>>(
    "/auth/login",
    payload
  );
  return res.data;
}

export async function getRooms() {
  const res = await api.get<ApiResponse<{ rooms: Room[] }>>("/rooms/");
  return res.data;
}

export async function createRoom(title: string, metadata?: Record<string, unknown>) {
  const res = await api.post<ApiResponse<{ room: Room }>>("/rooms/", {
    title,
    metadata,
  });
  return res.data;
}

export async function getRoomDetail(roomId: string) {
  const res = await api.get<
    ApiResponse<{ room: Room; members: RoomMember[] }>
  >(`/rooms/${roomId}/`);
  return res.data;
}

export async function lookupUserByEmail(email: string) {
  const res = await api.get<ApiResponse<{ user: User }>>(
    "/users/by-email",
    { params: { email } }
  );
  return res.data;
}

export async function addMember(roomId: string, userId: string) {
  const res = await api.post<ApiResponse<{ member: RoomMember }>>(
    `/rooms/${roomId}/members/`,
    { user_id: userId }
  );
  return res.data;
}

export async function removeMember(roomId: string, userId: string) {
  const res = await api.delete<ApiResponse>(
    `/rooms/${roomId}/members/${userId}/`
  );
  return res.data;
}

export async function getRoomMessages(
  roomId: string,
  limit = 50,
  before?: string
) {
  const res = await api.get<ApiResponse<{ messages: Message[] }>>(
    `/messages/room/${roomId}/`,
    {
      params: {
        limit,
        before,
      },
    }
  );
  return res.data;
}

export async function createMessage(
  roomId: string,
  content: string,
  content_type: Message["content_type"] = "text",
  attachments?: Record<string, unknown>
) {
  const res = await api.post<ApiResponse<{ message: Message }>>(
    `/messages/room/${roomId}/`,
    {
      content,
      content_type,
      attachments,
    }
  );
  return res.data;
}

export async function deleteMessage(messageId: string) {
  const res = await api.delete<ApiResponse>(`/messages/${messageId}/`);
  return res.data;
}
