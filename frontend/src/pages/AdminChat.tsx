import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  fetchAdminChatConversations,
  acceptAdminConversation,
  closeAdminConversation,
  fetchAdminLostReports,
  fetchAdminFoundReports,
  fetchChatMessagesAdmin,
  sendChatMessageAdminWithReply,
  updateAdminConversationStatus,
  deleteAdminConversation,
  clearAdminConversationMessages,
  deleteChatMessageAdminForMe,
  deleteChatMessageAdminForEveryone,
  fetchAdminUsers,
  fetchStaffUsers,
  createChatroomInvitation,
  fetchInvitationsByConversation,
  fetchAdminChatrooms,
  createAdminChatroom,
  fetchChatroomMessages,
  fetchChatroomParticipants,
  fetchChatroomAccessRequestsAdmin,
  sendChatroomMessage,
  clearChatroomMessages,
  deleteChatroom,
  inviteUserToChatroom,
  getProfile,
  type ApiResult,
} from "../services/api";

const mockRooms = [
  { id: 1, name: "Lost Pets - Chennai" },
  { id: 2, name: "Found Pets - Bangalore" },
  { id: 3, name: "Adoption Follow-ups" },
];

export default function AdminChat() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [centerView, setCenterView] = useState<"chat" | "requests">("chat");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [selectedPet, setSelectedPet] = useState<any | null>(null);
  const [selectedPetSource, setSelectedPetSource] = useState<
    "lost" | "found" | null
  >(null);
  const [petLoading, setPetLoading] = useState(false);
  const [petError, setPetError] = useState<string | null>(null);

  const [selectedConversationId, setSelectedConversationId] =
    useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
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
  
  // Chat room management states
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showRoomPanel, setShowRoomPanel] = useState(false);
  
  // View type: "conversation" for direct chats, "chatroom" for group chats
  const [viewType, setViewType] = useState<"conversation" | "chatroom">("conversation");
  
  // Chatroom-specific message states (separate from conversation messages)
  const [chatroomMessages, setChatroomMessages] = useState<any[]>([]);
  const [chatroomMessageInput, setChatroomMessageInput] = useState("");
  const [chatroomReplyingTo, setChatroomReplyingTo] = useState<any | null>(null);
  const [chatroomLoading, setChatroomLoading] = useState(false);
  
  // Room Members structured state - ROOM-SCOPED (keyed by room ID)
  const [roomMembersData, setRoomMembersData] = useState<Record<number, {
    requestedUser: any | null;
    foundedUser: any | null;
    admins: any[];
  }>>({});
  
  // Invitation requests tracking - keyed by conversation ID
  const [invitationRequests, setInvitationRequests] = useState<Record<number, {
    requestedUser?: { user: any; status: string; requestId: number };
    foundedUser?: { user: any; status: string; requestId: number };
  }>>({});
  
  // Add action states
  const [showAddUserFromChat, setShowAddUserFromChat] = useState(false);
  const [showAddFoundUser, setShowAddFoundUser] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [foundUserSearch, setFoundUserSearch] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  
  // Current admin user unique ID for message alignment (USR000024 format)
  const [currentAdminUserId, setCurrentAdminUserId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get current room's member data (room-scoped)
  const currentRoomMembers = selectedRoomId ? roomMembersData[selectedRoomId] : null;
  const requestedUser = currentRoomMembers?.requestedUser ?? null;
  const foundedUser = currentRoomMembers?.foundedUser ?? null;
  const admins = currentRoomMembers?.admins ?? [];

  // Check URL parameters to set initial view
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get('view');
    if (viewParam === 'requests') {
      setCenterView('requests');
    }
  }, [location.search]);

  // CRITICAL: Room-scoped member rehydration
  // When a room is selected, load its participants from backend
  useEffect(() => {
    if (!selectedRoomId) return;

    // Fetch room participants and access requests from backend
    const loadRoomMembers = async () => {
      // Fetch participants (accepted users)
      const participantsRes = await fetchChatroomParticipants(selectedRoomId);
      
      // Fetch access requests (pending invitations)
      const accessRequestsRes = await fetchChatroomAccessRequestsAdmin(selectedRoomId);
      
      const participants = participantsRes.ok && Array.isArray(participantsRes.data) ? participantsRes.data : [];
      const accessRequests = accessRequestsRes.ok && Array.isArray(accessRequestsRes.data) ? accessRequestsRes.data : [];
      
      // Organize participants by role (accepted users)
      const acceptedRequestedUser = participants.find((p: any) => p.role === 'requested_user');
      const acceptedFoundedUser = participants.find((p: any) => p.role === 'founded_user');
      const admins = participants.filter((p: any) => p.role === 'admin');
      
      // Find pending invitations
      const pendingRequestedUser = accessRequests.find((r: any) => r.role === 'requested_user' && r.status === 'pending');
      const pendingFoundedUser = accessRequests.find((r: any) => r.role === 'founded_user' && r.status === 'pending');
      
      // Determine final status for each role
      const requestedUser = acceptedRequestedUser 
        ? { ...acceptedRequestedUser.user, status: 'accepted' }
        : pendingRequestedUser 
          ? { ...pendingRequestedUser.requested_user, status: 'pending' }
          : null;
          
      const foundedUser = acceptedFoundedUser
        ? { ...acceptedFoundedUser.user, status: 'accepted' }
        : pendingFoundedUser
          ? { ...pendingFoundedUser.requested_user, status: 'pending' }
          : null;
      
      setRoomMembersData((prev) => ({
        ...prev,
        [selectedRoomId]: {
          requestedUser: requestedUser,
          foundedUser: foundedUser,
          admins: admins.map((p: any) => ({ ...p.user, status: 'accepted' })),
        },
      }));
    };
    
    loadRoomMembers();

    // Reset add action panels when switching rooms
    setShowAddUserFromChat(false);
    setShowAddFoundUser(false);
    setShowAddAdmin(false);
    setFoundUserSearch("");
  }, [selectedRoomId]);

  // Load admin chat conversations (both pending requests and active chats)
  async function loadConversations(statusFilter?: string) {
    setLoading(true);
    setError(null);
    const res: ApiResult = await fetchAdminChatConversations(statusFilter);
    if (res.ok) {
      setConversations((res.data as any[]) ?? []);
    } else if (res.error) {
      setError(res.error);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadConversations();
    const id = window.setInterval(() => {
      loadConversations();
    }, 10000);
    return () => window.clearInterval(id);
  }, []);

  // Load admin chatrooms (group chats)
  async function loadChatrooms() {
    const res: ApiResult = await fetchAdminChatrooms();
    if (res.ok && Array.isArray(res.data)) {
      setChatRooms(res.data);
    }
  }

  useEffect(() => {
    loadChatrooms();
    const id = window.setInterval(() => {
      loadChatrooms();
    }, 10000);
    return () => window.clearInterval(id);
  }, []);

  // Load current admin user unique ID for message alignment
  useEffect(() => {
    async function loadCurrentUser() {
      const res = await getProfile();
      console.log("Admin getProfile response:", res);
      if (res.ok && res.data?.user_unique_id) {
        console.log("Setting currentAdminUserId to:", res.data.user_unique_id);
        setCurrentAdminUserId(res.data.user_unique_id);
      }
    }
    loadCurrentUser();
  }, []);

  // Fetch all users when "Add Found Pet User" panel is opened
  useEffect(() => {
    if (showAddFoundUser && allUsers.length === 0) {
      loadAllUsers();
    }
  }, [showAddFoundUser]);

  // Fetch staff users when "Add Admin" panel is opened
  useEffect(() => {
    if (showAddAdmin && staffUsers.length === 0) {
      loadStaffUsers();
    }
  }, [showAddAdmin]);

  async function loadAllUsers() {
    setUsersLoading(true);
    setUsersError(null);
    const res = await fetchAdminUsers();
    if (res.ok && Array.isArray(res.data)) {
      setAllUsers(res.data);
    } else if (res.error) {
      setUsersError(res.error);
    }
    setUsersLoading(false);
  }

  async function loadStaffUsers() {
    const res = await fetchStaffUsers();
    if (res.ok && Array.isArray(res.data)) {
      setStaffUsers(res.data);
    }
  }

  // When a request is selected, try to load its pet details using the
  // existing admin lost/found report APIs so we can show pet_name and
  // pet_type and navigate to the correct detail page.
  useEffect(() => {
    async function loadPet() {
      setSelectedPet(null);
      setSelectedPetSource(null);
      setPetError(null);


      const petUniqueId = selectedRequest?.pet_unique_id;
      const petKind = selectedRequest?.pet_kind;
      const petId = selectedRequest?.pet_id; // Legacy fallback
      const convoId = selectedRequest?.id;
      if (!petUniqueId && !petId && !convoId) return;

      setPetLoading(true);
      try {
        // Use pet_unique_id + pet_kind for accurate lookup (avoids confusion when lost/found have same numeric ID)
        if (petUniqueId && petKind) {
          if (petKind === "lost") {
            const lostRes = await fetchAdminLostReports("all");
            if (lostRes.ok && Array.isArray(lostRes.data)) {
              const list = lostRes.data as any[];
              const found = list.find((r) => r.pet_unique_id === petUniqueId);
              if (found) {
                setSelectedPet(found);
                setSelectedPetSource("lost");
                setPetLoading(false);
                return;
              }
            }
          } else if (petKind === "found") {
            const foundRes = await fetchAdminFoundReports("all");
            if (foundRes.ok && Array.isArray(foundRes.data)) {
              const list = foundRes.data as any[];
              const found = list.find((r) => r.pet_unique_id === petUniqueId);
              if (found) {
                setSelectedPet(found);
                setSelectedPetSource("found");
                setPetLoading(false);
                return;
              }
            }
          }
        }

        // Legacy fallback: use pet_id + pet_kind if pet_unique_id not available
        if (petId && petKind) {
          if (petKind === "lost") {
            const lostRes = await fetchAdminLostReports("all");
            if (lostRes.ok && Array.isArray(lostRes.data)) {
              const list = lostRes.data as any[];
              const found = list.find((r) => String(r.id) === String(petId));
              if (found) {
                setSelectedPet(found);
                setSelectedPetSource("lost");
                setPetLoading(false);
                return;
              }
            }
          } else if (petKind === "found") {
            const foundRes = await fetchAdminFoundReports("all");
            if (foundRes.ok && Array.isArray(foundRes.data)) {
              const list = foundRes.data as any[];
              const found = list.find((r) => String(r.id) === String(petId));
              if (found) {
                setSelectedPet(found);
                setSelectedPetSource("found");
                setPetLoading(false);
                return;
              }
            }
          }
        }

        // Last resort: try both without pet_kind (old behavior, may be inaccurate)
        if (petId && !petKind) {
          const lostRes = await fetchAdminLostReports("all");
          if (lostRes.ok && Array.isArray(lostRes.data)) {
            const list = lostRes.data as any[];
            const found = list.find((r) => String(r.id) === String(petId));
            if (found) {
              setSelectedPet(found);
              setSelectedPetSource("lost");
              setPetLoading(false);
              return;
            }
          }

          const foundRes = await fetchAdminFoundReports("all");
          if (foundRes.ok && Array.isArray(foundRes.data)) {
            const list = foundRes.data as any[];
            const found = list.find((r) => String(r.id) === String(petId));
            if (found) {
              setSelectedPet(found);
              setSelectedPetSource("found");
              setPetLoading(false);
              return;
            }
          }
        }

        setPetError("Pet details not found for this ID.");

      } finally {
        setPetLoading(false);
      }
    }

    loadPet();
  }, [selectedRequest]);

  // Load messages for the selected direct chat conversation (admin side)
  useEffect(() => {
    if (!selectedConversationId || viewType !== "conversation") {
      setChatMessages([]);
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      setChatLoading(true);
      const res = await fetchChatMessagesAdmin(selectedConversationId);
      if (!cancelled) {
        if (res.ok && Array.isArray(res.data)) {
          setChatMessages(res.data as any[]);
        } else if (res.error) {
          setChatError(res.error);
        }
      }
      setChatLoading(false);
    };

    loadMessages();
    const id = window.setInterval(loadMessages, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [selectedConversationId, viewType]);

  // Load messages for the selected chatroom (group chat)
  useEffect(() => {
    if (!selectedRoomId || viewType !== "chatroom") {
      setChatroomMessages([]);
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      setChatroomLoading(true);
      const res = await fetchChatroomMessages(selectedRoomId);
      if (!cancelled) {
        if (res.ok && Array.isArray(res.data)) {
          setChatroomMessages(res.data as any[]);
        }
      }
      setChatroomLoading(false);
    };

    loadMessages();
    const id = window.setInterval(loadMessages, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [selectedRoomId, viewType]);

  // Load invitation requests for the selected conversation
  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const loadInvitations = async () => {
      const res = await fetchInvitationsByConversation(selectedConversationId);
      if (res.ok && Array.isArray(res.data)) {
        const invitations = res.data as any[];
        const invitationData: any = {};
        
        invitations.forEach((inv: any) => {
          if (inv.role === 'requested_user' || inv.role === 'founded_user') {
            const key = inv.role === 'requested_user' ? 'requestedUser' : 'foundedUser';
            invitationData[key] = {
              user: inv.requested_user,
              status: inv.status,
              requestId: inv.id,
            };
          }
        });
        
        setInvitationRequests((prev) => ({
          ...prev,
          [selectedConversationId]: invitationData,
        }));
      }
    };

    loadInvitations();
    // Poll for status updates every 5 seconds
    const id = window.setInterval(loadInvitations, 5000);
    return () => window.clearInterval(id);
  }, [selectedConversationId]);

  const getUserDisplayName = (c: any): string => {
    // Try several possible fields that backend might use
    const direct =
      c.user_full_name ||
      c.user_username ||
      c.full_name ||
      c.username ||
      c.name;
    const nested = c.user || c.requester || c.owner;
    const nestedName =
      nested?.full_name || nested?.username || nested?.name || nested?.email;
    return String(direct || nestedName || "User");
  };

  const pendingRequests = useMemo(
    () =>
      (conversations ?? []).filter((c: any) => {
        const s = (c.status || "").toLowerCase();
        return s === "pending" || s === "requested";
      }),
    [conversations],
  );

  const directChats = useMemo(
    () =>
      (conversations ?? []).filter((c: any) => {
        const s = (c.status || "").toLowerCase();
        return s !== "pending" && s !== "requested" && s !== "closed";
      }),
    [conversations],
  );

  const handleAcceptRequest = async (id: number) => {
    setLoading(true);
    const res = await acceptAdminConversation(id);
    if (!res.ok && res.error) {
      setError(res.error);
    }
    await loadConversations();
    // Keep user in requests view to see the updated status
    setCenterView("requests");
    // Clear any selected request to show the updated list
    setSelectedRequest(null);
  };

  // Try to auto-select the first active direct chat if none is selected yet
  useEffect(() => {
    if (selectedConversationId || directChats.length === 0) return;
    const first = directChats[0];
    if (first) {
      setSelectedConversationId(first.id);
    }
  }, [selectedConversationId, directChats]);

  const handleRejectRequest = async (id: number) => {
    setLoading(true);
    const res = await closeAdminConversation(id);
    if (!res.ok && res.error) {
      setError(res.error);
    }
    await loadConversations();
    // Keep user in requests view to see the updated status
    setCenterView("requests");
    // Clear any selected request to show the updated list
    setSelectedRequest(null);
  };

  const activeConversation =
    selectedConversationId != null
      ? conversations.find((c: any) => c.id === selectedConversationId) || null
      : null;

  const activeChatroom =
    selectedRoomId != null
      ? chatRooms.find((r: any) => r.id === selectedRoomId) || null
      : null;

  useEffect(() => {
    if (!activeConversation && !activeChatroom) return;
    // Keep chat pinned to bottom on new messages to avoid "jump to top" annoyance.
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.id, activeChatroom?.id, chatMessages.length, chatroomMessages.length]);

  useEffect(() => {
    const onDocClick = () => {
      setMenuForMessageId(null);
      setOptionsMenu(null);
      setContextMenu(null);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

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
        position: "relative",
      }}
    >
      {/* Left column: header + requests + direct chats + rooms */}
      <div
        style={{
          width: 320,
          borderRight: "1px solid #e5e7eb",
          background: "#f3f4f6", // slightly darker than center column
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

        {pendingRequests.length > 0 && (
          <div
            style={{
              borderRadius: 10,
              background: "#f9fafb",
              padding: 8,
              border: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => setCenterView("requests")}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Requests
            </span>
            <span
              style={{
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 999,
                background: "#e0f2fe",
                color: "#0369a1",
                fontWeight: 600,
              }}
            >
              {pendingRequests.length}
            </span>
          </div>
        )}

        {/* Direct Chats card */}
        <div
          style={{
            borderRadius: 12,
            background: "#ffffff",
            padding: 10,
            boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <input
            type="text"
            placeholder="Search contact"
            style={{
              width: "100%",
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              fontSize: 13,
              outline: "none",
              background: "#ffffff",
              color: "#111827",
            }}
          />

          <div
            style={{
              fontSize: 12,
              color: "#9ca3af",
              marginTop: 4,
            }}
          >
            Direct Chats
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxHeight: 210,
              overflowY: "auto",
            }}
          >
            {directChats.map((c: any, idx: number) => {
              return (
                <button
                  key={c.id}
                  type="button"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr auto",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background:
                      selectedConversationId === c.id && !selectedRoomId
                        ? "#eef2ff"
                        : "#f9fafb",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onClick={() => {
                    setSelectedConversationId(c.id);
                    setSelectedRoomId(null);
                    setShowRoomPanel(false);
                    setViewType("conversation");
                    setCenterView("chat");
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
                    {getUserDisplayName(c).charAt(0)}
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
                      {getUserDisplayName(c)}
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
                      {c.topic || c.last_message_preview || "Conversation"}
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
                    <span>
                      {c.updated_at
                        ? new Date(c.updated_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
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
              );
            })}
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
            {chatRooms.length === 0 ? (
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  padding: "6px 8px",
                  fontStyle: "italic",
                  textAlign: "center",
                }}
              >
                No chat rooms yet
              </div>
            ) : (
              chatRooms.map((room: any) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => {
                    setSelectedRoomId(room.id);
                    setSelectedConversationId(null);
                    setShowRoomPanel(true);
                    setViewType("chatroom");
                    setCenterView("chat");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    padding: "8px 10px",
                    fontSize: 12,
                    textAlign: "left",
                    cursor: "pointer",
                    background: selectedRoomId === room.id ? "#eef2ff" : "#f9fafb",
                  }}
                >
                  <span style={{ fontSize: 14 }}>👥</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#0f172a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {room.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#9ca3af",
                      }}
                    >
                      {room.participant_count || room.member_count || 0} members
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Center column: active conversation or requests list */}
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
        {centerView === "requests" ? (
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
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                Requests
              </div>
              <div
                style={{
                  fontSize: 12,
                  padding: "3px 8px",
                  borderRadius: 999,
                  background: "#e0f2fe",
                  color: "#0369a1",
                  fontWeight: 600,
                }}
              >
                {pendingRequests.length} pending
              </div>
            </div>

            {loading && (
              <div style={{ fontSize: 13, color: "#6b7280" }}>Loading...</div>
            )}
            {error && (
              <div
                style={{
                  fontSize: 13,
                  color: "#b91c1c",
                  background: "#fee2e2",
                  padding: 8,
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {pendingRequests.map((c: any) => {
                const isSelected = selectedRequest && selectedRequest.id === c.id;
                return (
                  <div
                    key={c.id}
                    style={{
                      perspective: 1000,
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        minHeight: isSelected ? 170 : 80,
                        transformStyle: "preserve-3d",
                        transition: "transform 0.6s, min-height 0.3s",
                        transform: isSelected
                          ? "rotateY(180deg)"
                          : "rotateY(0deg)",
                      }}
                    >
                      {/* Front side: summary */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          padding: 10,
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 8,
                          alignItems: "center",
                          backfaceVisibility: "hidden",
                          background: "#ffffff",
                          borderRadius: 12,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#0f172a",
                              marginBottom: 2,
                            }}
                          >
                            {getUserDisplayName(c)}
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
                            {c.topic || c.last_message_preview || "Chat request"}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#9ca3af",
                              marginTop: 2,
                            }}
                          >
                            {c.created_at
                              ? new Date(c.created_at).toLocaleString()
                              : ""}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            alignItems: "flex-end",
                          }}
                        >
                          <button
                            onClick={() => setSelectedRequest(c)}
                            style={{
                              border: "1px solid #e5e7eb",
                              borderRadius: 999,
                              padding: "3px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                              background: "#ffffff",
                              color: "#0f172a",
                              cursor: "pointer",
                            }}
                          >
                            View details
                          </button>
                        </div>
                      </div>

                      {/* Back side: detailed view */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          padding: 12,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          backfaceVisibility: "hidden",
                          background: "#ffffff",
                          borderRadius: 12,
                          transform: "rotateY(180deg)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#0f172a",
                            }}
                          >
                            {getUserDisplayName(c)}
                          </div>
                          <div
                            style={{ fontSize: 11, color: "#6b7280" }}
                          >
                            {c.created_at
                              ? new Date(c.created_at).toLocaleString()
                              : ""}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 8,
                            fontSize: 12,
                            color: "#374151",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600 }}>Pet name</div>
                            <div>{selectedPet?.pet_name || c.pet_name || "-"}</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>Pet type</div>
                            <div>
                              {selectedPet?.pet_type ||
                                c.pet_type ||
                                c.pet_kind ||
                                "-"}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>Pet ID</div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span>
                                {selectedPet?.pet_unique_id ||
                                  c.pet_unique_id ||
                                  (c.pet_id != null
                                    ? `${c.pet_id}`
                                    : "-")}
                              </span>
                              {(selectedPet?.id || c.pet_id) && (
                                <button
                                  onClick={() => {
                                    const reportId =
                                      selectedPet?.id ?? c.pet_id;
                                    if (selectedPetSource === "found") {
                                      navigate(`/admin/found/${reportId}`, {
                                        state: { from: "admin-chat-requests" },
                                      });
                                    } else if (selectedPetSource === "lost") {
                                      navigate(`/admin/lost/${reportId}`, {
                                        state: { from: "admin-chat-requests" },
                                      });
                                    } else if (reportId) {
                                      navigate(`/pets/${reportId}`, {
                                        state: { from: "admin-chat-requests", requestId: c.id },
                                      });
                                    }
                                  }}
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: 999,
                                    border: "1px solid #e5e7eb",
                                    background: "#ffffff",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "#0f172a",
                                    cursor: "pointer",
                                  }}
                                >
                                  Pet details
                                </button>
                              )}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>Reason for chat</div>
                            <div
                              style={{
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                              }}
                            >
                              {c.reason_for_chat || "—"}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 8,
                            marginTop: 4,
                          }}
                        >
                          <button
                            onClick={() => setSelectedRequest(null)}
                            style={{
                              borderRadius: 999,
                              border: "1px solid #e5e7eb",
                              padding: "4px 10px",
                              background: "#ffffff",
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#374151",
                              cursor: "pointer",
                            }}
                          >
                            Back
                          </button>
                          <button
                            onClick={() => {
                              handleAcceptRequest(c.id);
                            }}
                            style={{
                              border: "none",
                              borderRadius: 999,
                              padding: "4px 12px",
                              background: "#22c55e",
                              color: "#ffffff",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(c.id)}
                            style={{
                              border: "none",
                              borderRadius: 999,
                              padding: "4px 12px",
                              background: "#fee2e2",
                              color: "#b91c1c",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {pendingRequests.length === 0 && !loading && !error && (
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  No pending requests.
                </div>
              )}
            </div>

          </div>
        ) : (
          <>
            {/* Active chat header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {(() => {
                  if (!activeConversation) return "No chat selected";
                  const name = getUserDisplayName(activeConversation);
                  const rawPetId =
                    activeConversation.pet_unique_id ??
                    (activeConversation.pet_id != null
                      ? String(activeConversation.pet_id)
                      : "");
                  const petLabel =
                    rawPetId && !rawPetId.toUpperCase().startsWith("ID #")
                      ? `ID #${rawPetId}`
                      : rawPetId;
                  return petLabel ? `${name} – ${petLabel}` : name;
                })()}
              </div>
              {activeConversation && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  {/* Create Room Button - Only show for direct chats, not chatrooms */}
                  {viewType === "conversation" && activeConversation && (
                    <button
                      type="button"
                      onClick={async () => {
                        const roomName = prompt("Enter chat room name:");
                        if (roomName && roomName.trim() && activeConversation) {
                          // Call backend API to create chatroom
                          const res = await createAdminChatroom({
                            conversation_id: activeConversation.id,
                            name: roomName.trim(),
                          });
                          
                          if (res.ok && res.data) {
                            // Add to local state
                            setChatRooms((prev) => [res.data, ...prev]);
                            // Auto-select the newly created room
                            setSelectedRoomId(res.data.id);
                            setShowRoomPanel(true);
                            setViewType("chatroom");
                            setCenterView("chat");
                            // Show success message
                            alert(`Chatroom "${roomName.trim()}" created successfully!`);
                          } else if (res.error) {
                            alert(`Failed to create chatroom: ${res.error}`);
                          }
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 14px",
                        borderRadius: 999,
                        border: "2px dashed #6366f1",
                        background: "#eef2ff",
                        cursor: "pointer",
                        fontSize: 13,
                        color: "#4f46e5",
                        fontWeight: 700,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#dbeafe";
                        e.currentTarget.style.borderColor = "#4f46e5";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#eef2ff";
                        e.currentTarget.style.borderColor = "#6366f1";
                      }}
                    >
                      <span style={{ fontSize: 16 }}>+</span>
                      <span>Create Room</span>
                    </button>
                  )}
                  
                  {(() => {
                    const rawStatus = (activeConversation.status || "").toLowerCase();
                    const selectValue =
                      rawStatus === "closed"
                        ? "closed"
                        : rawStatus === "read_only"
                          ? "read_only"
                          : "active";
                    return (
                      <select
                        value={selectValue}
                        onChange={async (e) => {
                          const next = e.target.value as
                            | "active"
                            | "read_only"
                            | "closed";
                          const res = await updateAdminConversationStatus(
                            activeConversation.id,
                            next,
                          );
                          if (res.ok) {
                            await loadConversations();
                          }
                        }}
                        style={{
                          fontSize: 12,
                          borderRadius: 999,
                          border: "1px solid #e5e7eb",
                          padding: "4px 8px",
                          background: "#ffffff",
                          color: "#111827",
                          cursor: "pointer",
                        }}
                      >
                        <option value="active">Active</option>
                        <option value="read_only">Waiting</option>
                        <option value="closed">Close</option>
                      </select>
                    );
                  })()}
                  <span>Chat with user</span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        !activeConversation ||
                        !window.confirm(
                          "Delete all messages in this chat? The conversation will remain.",
                        )
                      ) {
                        return;
                      }
                      const res = await clearAdminConversationMessages(
                        activeConversation.id,
                      );
                      if (res.ok) {
                        alert("All messages deleted successfully. Conversation still exists.");
                        // Reload messages
                        const messagesRes = await fetchChatMessagesAdmin(activeConversation.id);
                        if (messagesRes.ok && Array.isArray(messagesRes.data)) {
                          setChatMessages(messagesRes.data);
                        }
                      } else {
                        alert(`Failed to delete messages: ${res.error || "Unknown error"}`);
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

            {/* Messages list */}
            <div
              style={{
                flex: 1,
                borderRadius: 16,
                background: "#ffffff",
                padding: 16,
                marginBottom: 12,
                overflowY: "auto",
                overflowX: "hidden",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                scrollBehavior: "smooth",
                minHeight: 0,
                maxHeight: "calc(78vh - 180px)",
              }}
            >
              {/* CONVERSATION MESSAGES (Direct Chat) */}
              {viewType === "conversation" && (
                <>
                  {!activeConversation && (
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
                      Select a chat on the left to start messaging.
                    </div>
                  )}

                  {activeConversation && chatMessages.length === 0 && !chatLoading && (
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
                      No messages yet. Say hello to the user.
                    </div>
                  )}

                  {activeConversation &&
                    chatMessages.map((m: any) => {
                  const userId = activeConversation.user?.id;
                  const isAdmin =
                    !m.is_system && userId && m.sender && m.sender.id !== userId;
                  const isSystem = Boolean(m.is_system);
                  const text = (m.text || m.content || "") as string;
                  const systemColor = (() => {
                    const t = text.toLowerCase();
                    if (t.includes("active")) return "#16a34a";
                    if (t.includes("close") || t.includes("closed")) return "#dc2626";
                    if (t.includes("waiting")) return "#f59e0b";
                    return "#4b5563";
                  })();
                  const senderName = isSystem 
                    ? "" 
                    : isAdmin 
                      ? (m.sender?.full_name || m.sender?.username || "Admin")
                      : (activeConversation.user?.full_name || activeConversation.user?.username || "User");
                  const messageTime = m.created_at 
                    ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : "";
                  
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isSystem
                          ? "center"
                          : isAdmin
                            ? "flex-end"
                            : "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      
                      <div
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          paddingRight: !isSystem && isAdmin ? 32 : 0,
                        }}
                      >
                        <div
                          style={{
                            position: "relative",
                            maxWidth: isSystem ? "80%" : "65%",
                            minWidth: "fit-content",
                            padding: isSystem ? "6px 12px" : "10px 14px",
                            borderRadius: isSystem ? 999 : 20,
                            fontSize: isSystem ? 12 : 15,
                            lineHeight: 1.5,
                            background: isSystem
                              ? "#e5e7eb"
                              : isAdmin
                                ? "#6366f1"
                                : "#e5e7eb",
                            color: isSystem ? systemColor : isAdmin ? "#ffffff" : "#1f2937",
                            wordBreak: "break-word",
                            whiteSpace: "normal",
                            overflowWrap: "break-word",
                            display: "inline-block",
                          }}
                          onMouseEnter={() => {
                            if (!isSystem) setHoveredMessageId(Number(m.id));
                          }}
                          onMouseLeave={() => {
                            if (!isSystem) setHoveredMessageId(null);
                          }}
                          onContextMenu={(e) => {
                            if (isSystem) return;
                            e.preventDefault();
                            setContextMenu({
                              messageId: Number(m.id),
                              x: e.clientX,
                              y: e.clientY,
                            });
                          }}
                        >
                        {m.reply_to && !isSystem && (
                          <div
                            style={{
                              marginBottom: 6,
                              padding: "6px 8px",
                              borderRadius: 12,
                              background: isAdmin ? "rgba(255,255,255,0.18)" : "#f3f4f6",
                              borderLeft: `3px solid ${isAdmin ? "#ffffff" : "#0ea5e9"}`,
                              fontSize: 11,
                              opacity: 0.95,
                            }}
                          >
                            <div style={{ fontWeight: 700, marginBottom: 2 }}>
                              {m.reply_to?.sender?.full_name || m.reply_to?.sender?.username || "Reply"}
                            </div>
                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {m.reply_to?.text ?? ""}
                            </div>
                          </div>
                        )}
                        {m.text ?? ""}

                        {!isSystem && hoveredMessageId === Number(m.id) && (
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
                                    if (!activeConversation) return;
                                    await deleteChatMessageAdminForMe(
                                      activeConversation.id,
                                      Number(m.id),
                                    );
                                    setMenuForMessageId(null);
                                    setOptionsMenu(null);
                                    const res = await fetchChatMessagesAdmin(
                                      activeConversation.id,
                                    );
                                    if (res.ok) {
                                      setChatMessages(
                                        (res.data?.messages ?? res.data) as any[],
                                      );
                                    }
                                  },
                                },
                                {
                                  label: "Delete for everyone",
                                  onClick: async () => {
                                    if (!activeConversation) return;
                                    await deleteChatMessageAdminForEveryone(
                                      activeConversation.id,
                                      Number(m.id),
                                    );
                                    setMenuForMessageId(null);
                                    setOptionsMenu(null);
                                    const res = await fetchChatMessagesAdmin(
                                      activeConversation.id,
                                    );
                                    if (res.ok) {
                                      setChatMessages(
                                        (res.data?.messages ?? res.data) as any[],
                                      );
                                    }
                                  },
                                },
                              ];

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
                    </div>
                  );
                })}
                </>
              )}

              {/* CHATROOM MESSAGES (Group Chat) */}
              {viewType === "chatroom" && (
                <>
                  {!activeChatroom && (
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
                      Select a chatroom on the left to start messaging.
                    </div>
                  )}

                  {activeChatroom && chatroomMessages.length === 0 && !chatroomLoading && (
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
                      No messages yet in this chatroom.
                    </div>
                  )}

                  {activeChatroom &&
                    chatroomMessages.map((m: any) => {
                      const isSystem = Boolean(m.is_system);
                      const text = (m.text || m.content || "") as string;
                      // Compare using stable user_unique_id (USR000024 format)
                      const isOwnMessage = m.sender?.user_unique_id === currentAdminUserId;
                      
                      // Debug logging
                      if (!isSystem) {
                        console.log("Admin chatroom message:", {
                          text,
                          senderUniqueId: m.sender?.user_unique_id,
                          currentAdminUserId,
                          isOwnMessage,
                          comparison: `${m.sender?.user_unique_id} === ${currentAdminUserId} = ${m.sender?.user_unique_id === currentAdminUserId}`,
                          sender: m.sender,
                          fullMessage: m
                        });
                      }
                      
                      const senderName = isSystem 
                        ? "" 
                        : (m.sender?.full_name || m.sender?.username || "User");
                      
                      const messageTime = m.created_at 
                        ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : "";
                      
                      return (
                        <div
                          key={m.id}
                          data-own={isOwnMessage ? "true" : "false"}
                          data-align={isSystem ? "center" : isOwnMessage ? "end" : "start"}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isSystem ? "center" : isOwnMessage ? "flex-end" : "flex-start",
                            marginBottom: 8,
                            width: "100%",
                          }}
                        >
                          {!isSystem && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "#64748b",
                                marginBottom: 4,
                                paddingLeft: isOwnMessage ? 0 : 8,
                                paddingRight: isOwnMessage ? 8 : 0,
                              }}
                            >
                              {senderName} {isOwnMessage ? "👈 YOU" : ""}
                            </div>
                          )}
                          
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
                                maxWidth: isSystem ? "80%" : "65%",
                                minWidth: "fit-content",
                                padding: isSystem ? "6px 12px" : "10px 14px",
                                borderRadius: isSystem ? 999 : 18,
                                fontSize: isSystem ? 12 : 14,
                                lineHeight: 1.5,
                                background: isSystem
                                  ? "#e5e7eb"
                                  : isOwnMessage
                                    ? "#6366f1"
                                    : "#ffffff",
                                color: isSystem ? "#4b5563" : isOwnMessage ? "#ffffff" : "#111827",
                                border: isSystem ? "none" : isOwnMessage ? "3px solid #6366f1" : "1px solid #e5e7eb",
                                boxShadow: isSystem ? "none" : isOwnMessage ? "0 2px 8px rgba(99,102,241,0.25)" : "0 2px 8px rgba(0,0,0,0.08)",
                                wordBreak: "break-word",
                                whiteSpace: "normal",
                                overflowWrap: "break-word",
                                display: "inline-block",
                              }}
                              onMouseEnter={() => {
                                if (!isSystem) setHoveredMessageId(Number(m.id));
                              }}
                              onMouseLeave={() => setHoveredMessageId(null)}
                            >
                              {m.reply_to && (
                                <div
                                  style={{
                                    fontSize: 12,
                                    padding: "6px 8px",
                                    marginBottom: 6,
                                    borderRadius: 8,
                                    background: isOwnMessage
                                      ? "rgba(255,255,255,0.2)"
                                      : "rgba(0,0,0,0.05)",
                                    borderLeft: `3px solid ${isOwnMessage ? "#ffffff" : "#6366f1"}`,
                                  }}
                                >
                                  <div style={{ fontWeight: 600, marginBottom: 2 }}>
                                    {m.reply_to.sender?.full_name || m.reply_to.sender?.username || "User"}
                                  </div>
                                  <div style={{ opacity: 0.8 }}>
                                    {(m.reply_to.text || m.reply_to.content || "").substring(0, 50)}
                                    {(m.reply_to.text || m.reply_to.content || "").length > 50 ? "..." : ""}
                                  </div>
                                </div>
                              )}
                              {text}
                            </div>

                            {!isSystem && hoveredMessageId === m.id && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuForMessageId(m.id);
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setOptionsMenu({
                                    message: m,
                                    x: rect.left,
                                    y: rect.bottom + 4,
                                    items: [
                                      {
                                        label: "Reply",
                                        onClick: () => {
                                          setChatroomReplyingTo(m);
                                          setMenuForMessageId(null);
                                          setOptionsMenu(null);
                                        },
                                      },
                                    ],
                                  });
                                }}
                                style={{
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
                              >
                                ⋮
                              </button>
                            )}
                          </div>
                          
                          {!isSystem && (
                            <div
                              style={{
                                fontSize: 10,
                                color: "#9ca3af",
                                marginTop: 2,
                                paddingLeft: isOwnMessage ? 0 : 8,
                                paddingRight: isOwnMessage ? 8 : 0,
                              }}
                            >
                              {messageTime}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom admin chat input - CONVERSATION */}
            {viewType === "conversation" && activeConversation && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!activeConversation || !chatInput.trim()) return;
                const text = chatInput.trim();
                setChatInput("");
                setChatError(null);
                const res = await sendChatMessageAdminWithReply(
                  activeConversation.id,
                  text,
                  replyingTo?.id ? Number(replyingTo.id) : undefined,
                );
                setReplyingTo(null);
                if (res.ok) {
                  setChatMessages((prev) => [
                    ...prev,
                    {
                      id: res.data?.id ?? `local-${Date.now()}`,
                      text,
                      is_system: false,
                      reply_to: replyingTo
                        ? {
                            id: replyingTo.id,
                            text: replyingTo.text ?? "",
                            sender: replyingTo.sender ?? null,
                          }
                        : null,
                      sender: activeConversation.admin || null,
                    },
                  ]);
                } else if (res.error) {
                  setChatError(res.error);
                }
              }}
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
              {replyingTo && (
                <div
                  style={{
                    flex: 1,
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
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>
                      Replying to {replyingTo?.sender?.full_name || replyingTo?.sender?.username || "message"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#475569",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 260,
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
              
              {/* Gallery/File Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx"
                multiple
                style={{ display: "none" }}
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    // Handle file upload here
                    console.log("Selected files:", files);
                    // TODO: Implement file upload logic
                    alert(`Selected ${files.length} file(s). File upload feature coming soon!`);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6b7280",
                  fontSize: 20,
                  lineHeight: 1,
                }}
                aria-label="Attach file"
                title="Attach image or file"
              >
                📎
              </button>
              
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message here..."
                style={{
                  flex: replyingTo ? 2 : 1,
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "#111827",
                  background: "#ffffff",
                }}
              />
              <button
                type="submit"
                style={{
                  border: "none",
                  borderRadius: 999,
                  padding: "6px 14px",
                  background: "#4f46e5",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: activeConversation ? "pointer" : "not-allowed",
                  opacity: activeConversation ? 1 : 0.5,
                }}
              >
                Send
              </button>
              </form>
            )}

            {/* Bottom admin chat input - CHATROOM */}
            {viewType === "chatroom" && activeChatroom && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  console.log("Chatroom form submitted", { activeChatroom, chatroomMessageInput, selectedRoomId });
                  
                  if (!activeChatroom || !chatroomMessageInput.trim() || !selectedRoomId) {
                    console.log("Validation failed", { activeChatroom: !!activeChatroom, hasInput: !!chatroomMessageInput.trim(), selectedRoomId });
                    return;
                  }
                  
                  const text = chatroomMessageInput.trim();
                  setChatroomMessageInput("");
                  
                  const payload: any = { text };
                  if (chatroomReplyingTo) {
                    payload.reply_to_message_id = chatroomReplyingTo.id;
                  }
                  
                  console.log("Sending chatroom message", { selectedRoomId, payload, currentAdminUserId });
                  const res = await sendChatroomMessage(selectedRoomId, payload);
                  console.log("Chatroom message response", res);
                  if (res.ok && res.data) {
                    console.log("Message created with sender ID:", res.data.sender?.id, "Expected:", currentAdminUserId);
                  }
                  
                  setChatroomReplyingTo(null);
                  if (res.ok) {
                    // Reload messages
                    const messagesRes = await fetchChatroomMessages(selectedRoomId);
                    if (messagesRes.ok && Array.isArray(messagesRes.data)) {
                      setChatroomMessages(messagesRes.data);
                    }
                  } else {
                    console.error("Failed to send chatroom message", res.error);
                    alert(`Failed to send message: ${res.error || "Unknown error"}`);
                    // Restore the message input
                    setChatroomMessageInput(text);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  borderTop: "1px solid #e5e7eb",
                  background: "#ffffff",
                }}
              >
                {chatroomReplyingTo && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      left: 0,
                      right: 0,
                      padding: "8px 16px",
                      background: "#f3f4f6",
                      borderTop: "1px solid #e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        Replying to {chatroomReplyingTo.sender?.full_name || chatroomReplyingTo.sender?.username || "User"}
                      </div>
                      <div style={{ color: "#64748b" }}>
                        {(chatroomReplyingTo.text || chatroomReplyingTo.content || "").substring(0, 50)}
                        {(chatroomReplyingTo.text || chatroomReplyingTo.content || "").length > 50 ? "..." : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChatroomReplyingTo(null)}
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
                
                <button
                  type="button"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6b7280",
                    fontSize: 20,
                    lineHeight: 1,
                  }}
                  aria-label="Emoji"
                >
                  😊
                </button>
                
                <input
                  value={chatroomMessageInput}
                  onChange={(e) => setChatroomMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Type a message here..."
                  style={{
                    flex: chatroomReplyingTo ? 2 : 1,
                    border: "none",
                    outline: "none",
                    fontSize: 13,
                    color: "#111827",
                    background: "#ffffff",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    border: "none",
                    borderRadius: 999,
                    padding: "6px 14px",
                    background: "#4f46e5",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: activeChatroom ? "pointer" : "not-allowed",
                    opacity: activeChatroom ? 1 : 0.5,
                  }}
                >
                  Send
                </button>
              </form>
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
                    if (!activeConversation) return;
                    const mid = contextMenu.messageId;
                    setContextMenu(null);
                    await deleteChatMessageAdminForMe(activeConversation.id, mid);
                    const res = await fetchChatMessagesAdmin(activeConversation.id);
                    if (res.ok) {
                      setChatMessages((res.data?.messages ?? res.data) as any[]);
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

            {chatError && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#b91c1c",
                }}
              >
                {chatError}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Right Panel - Room Management (Only visible when in a chat room) */}
      {showRoomPanel && selectedRoomId && (
        <div
          style={{
            width: 280,
            borderLeft: "1px solid #e5e7eb",
            background: "#f9fafb",
            display: "flex",
            flexDirection: "column",
            padding: 16,
            boxSizing: "border-box",
            gap: 16,
            overflowY: "auto",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#0f172a",
                marginBottom: 4,
              }}
            >
              Room Members
            </div>
            <div style={{ 
              fontSize: 12, 
              color: "#64748b",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span>Manage who can access this room</span>
              {selectedRoomId && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (!selectedRoomId) {
                        console.error("No room selected");
                        return;
                      }
                      
                      const currentRoom = chatRooms.find((r: any) => r.id === selectedRoomId);
                      const roomName = currentRoom?.name || "this chatroom";
                      
                      console.log("Attempting to delete chatroom:", selectedRoomId, roomName);
                      
                      if (!window.confirm(`Are you sure you want to DELETE "${roomName}"? This will permanently delete the chatroom, all messages, and all participants. This action cannot be undone.`)) {
                        console.log("Delete cancelled by user");
                        return;
                      }
                      
                      console.log("Calling deleteChatroom API...");
                      const res = await deleteChatroom(selectedRoomId);
                      console.log("Delete response:", res);
                      
                      if (res.ok) {
                        alert(`Chatroom "${roomName}" deleted successfully.`);
                        // Clear selection and reload chatrooms
                        setSelectedRoomId(null);
                        setChatroomMessages([]);
                        setRoomMembersData((prev) => {
                          const newData = { ...prev };
                          delete newData[selectedRoomId];
                          return newData;
                        });
                        // Reload chatrooms list
                        console.log("Reloading chatrooms list...");
                        const chatroomsRes = await fetchAdminChatrooms();
                        console.log("Chatrooms reload response:", chatroomsRes);
                        if (chatroomsRes.ok && Array.isArray(chatroomsRes.data)) {
                          setChatRooms(chatroomsRes.data);
                        }
                      } else {
                        console.error("Delete failed:", res.error, res);
                        alert(`Failed to delete chatroom: ${res.error || "Unknown error"}`);
                      }
                    } catch (error) {
                      console.error("Exception during delete:", error);
                      alert(`Error deleting chatroom: ${error}`);
                    }
                  }}
                  style={{
                    border: "1px solid #dc2626",
                    background: "#ffffff",
                    color: "#dc2626",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "6px 12px",
                    borderRadius: 6,
                  }}
                >
                  Delete Room
                </button>
              )}
            </div>
          </div>
          
          {/* STRUCTURED SECTIONS - ALWAYS VISIBLE AT TOP */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* 1️⃣ REQUESTED USER SECTION */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 6,
                }}
              >
                Requested User
              </div>
              {(() => {
                // Check if we have a requested user (from chatroom or conversation)
                const user = requestedUser || (selectedConversationId ? invitationRequests[selectedConversationId]?.requestedUser?.user : null);
                const status = requestedUser?.status || (selectedConversationId ? invitationRequests[selectedConversationId]?.requestedUser?.status : null);
                
                if (user) {
                  const statusColors = {
                    pending: { bg: "#fef3c7", text: "#92400e", label: "Pending" },
                    accepted: { bg: "#d1fae5", text: "#065f46", label: "Accepted" },
                    rejected: { bg: "#fee2e2", text: "#991b1b", label: "Rejected" },
                  };
                  const statusStyle = statusColors[status as keyof typeof statusColors] || statusColors.pending;
                  
                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: 10,
                        borderRadius: 12,
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg,#10b981,#059669)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {(user.full_name || user.username || "U").charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {user.full_name || user.username || "Unknown"}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 999,
                            background: statusStyle.bg,
                            color: statusStyle.text,
                            fontWeight: 600,
                            display: "inline-block",
                            marginTop: 2,
                          }}
                        >
                          {statusStyle.label}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      fontStyle: "italic",
                      padding: "8px 10px",
                      background: "#f9fafb",
                      borderRadius: 8,
                      border: "1px dashed #e5e7eb",
                    }}
                  >
                    No user added yet
                  </div>
                );
              })()}
            </div>

            {/* 2️⃣ FOUNDED USER SECTION */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 6,
                }}
              >
                Founded User
              </div>
              {(() => {
                // Check if we have a founded user (from chatroom or conversation)
                const user = foundedUser || (selectedConversationId ? invitationRequests[selectedConversationId]?.foundedUser?.user : null);
                const status = foundedUser?.status || (selectedConversationId ? invitationRequests[selectedConversationId]?.foundedUser?.status : null);
                
                if (user) {
                  const statusColors = {
                    pending: { bg: "#fef3c7", text: "#92400e", label: "Pending" },
                    accepted: { bg: "#d1fae5", text: "#065f46", label: "Accepted" },
                    rejected: { bg: "#fee2e2", text: "#991b1b", label: "Rejected" },
                  };
                  const statusStyle = statusColors[status as keyof typeof statusColors] || statusColors.pending;
                  
                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: 10,
                        borderRadius: 12,
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg,#f59e0b,#d97706)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {(user.full_name || user.username || "U").charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {user.full_name || user.username || "Unknown"}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 999,
                            background: statusStyle.bg,
                            color: statusStyle.text,
                            fontWeight: 600,
                            display: "inline-block",
                            marginTop: 2,
                          }}
                        >
                          {statusStyle.label}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      fontStyle: "italic",
                      padding: "8px 10px",
                      background: "#f9fafb",
                      borderRadius: 8,
                      border: "1px dashed #e5e7eb",
                    }}
                  >
                    No user added yet
                  </div>
                );
              })()}
            </div>

            {/* 3️⃣ ADMINS SECTION */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 6,
                }}
              >
                Admins
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: 10,
                      borderRadius: 12,
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {(admin.full_name || admin.username || admin.name || "A").charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {admin.full_name || admin.username || admin.name || "Admin"}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 999,
                          background: "#dbeafe",
                          color: "#1e40af",
                          fontWeight: 600,
                          display: "inline-block",
                          marginTop: 2,
                        }}
                      >
                        Admin
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* ADD ACTION BUTTONS - BELOW SECTIONS */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              paddingTop: 12,
              marginTop: 12,
              borderTop: "2px solid #e5e7eb",
            }}
          >
            {/* Add User from Chat Button */}
            <div>
              <button
                type="button"
                onClick={() => setShowAddUserFromChat(!showAddUserFromChat)}
                disabled={selectedConversationId ? !!invitationRequests[selectedConversationId]?.requestedUser : false}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: (selectedConversationId && invitationRequests[selectedConversationId]?.requestedUser) ? "#f3f4f6" : "#ffffff",
                  cursor: (selectedConversationId && invitationRequests[selectedConversationId]?.requestedUser) ? "not-allowed" : "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: (selectedConversationId && invitationRequests[selectedConversationId]?.requestedUser) ? "#9ca3af" : "#0f172a",
                  opacity: (selectedConversationId && invitationRequests[selectedConversationId]?.requestedUser) ? 0.6 : 1,
                }}
              >
                <span>➕</span>
                <span>Add User from Chat</span>
              </button>
              
              {/* Show user with (+) button when clicked */}
              {showAddUserFromChat && selectedConversationId && !invitationRequests[selectedConversationId]?.requestedUser && activeConversation && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 10,
                    borderRadius: 10,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {getUserDisplayName(activeConversation)}
                      </div>
                      <div style={{ fontSize: 10, color: "#6b7280" }}>
                        Chat requester
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!activeConversation) return;
                        
                        const userId = activeConversation.user?.id || activeConversation.user_id;
                        
                        if (!userId) {
                          alert("User ID not found");
                          return;
                        }
                        
                        // If we're in a chatroom context, invite to existing chatroom
                        if (selectedRoomId) {
                          const res = await inviteUserToChatroom(selectedRoomId, userId, 'requested_user');
                          
                          if (res.ok) {
                            alert(`Invitation sent to ${getUserDisplayName(activeConversation)}! They will receive a notification.`);
                            setShowAddUserFromChat(false);
                            
                            // Reload participants
                            const participantsRes = await fetchChatroomParticipants(selectedRoomId);
                            if (participantsRes.ok && Array.isArray(participantsRes.data)) {
                              const participants = participantsRes.data;
                              const requestedUser = participants.find((p: any) => p.role === 'requested_user');
                              const foundedUser = participants.find((p: any) => p.role === 'founded_user');
                              const admins = participants.filter((p: any) => p.role === 'admin');
                              
                              setRoomMembersData((prev) => ({
                                ...prev,
                                [selectedRoomId]: {
                                  requestedUser: requestedUser || null,
                                  foundedUser: foundedUser || null,
                                  admins: admins,
                                },
                              }));
                            }
                          } else {
                            alert(res.error || "Failed to send invitation");
                          }
                        } else {
                          // No chatroom context - create chatroom creation request
                          const petUniqueId = activeConversation.pet_unique_id;
                          const petKind = activeConversation.pet_kind;
                          const conversationId = activeConversation.id;
                          
                          if (!petUniqueId || !petKind) {
                            alert("Pet information not found. Please ensure this conversation has pet context.");
                            return;
                          }
                          
                          const res = await createChatroomInvitation({
                            user_id: userId,
                            pet_unique_id: petUniqueId,
                            pet_kind: petKind,
                            conversation_id: conversationId,
                          });
                          
                          if (res.ok) {
                            setInvitationRequests((prev) => ({
                              ...prev,
                              [conversationId]: {
                                ...prev[conversationId],
                                requestedUser: {
                                  user: activeConversation.user || { 
                                    id: userId, 
                                    username: getUserDisplayName(activeConversation),
                                    full_name: getUserDisplayName(activeConversation)
                                  },
                                  status: 'pending',
                                  requestId: res.data?.id || 0,
                                },
                              },
                            }));
                            
                            alert(`Chatroom invitation sent to ${getUserDisplayName(activeConversation)}! They will receive a notification.`);
                            setShowAddUserFromChat(false);
                          } else {
                            alert(res.error || "Failed to send chatroom invitation");
                          }
                        }
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: "none",
                        background: "#10b981",
                        color: "white",
                        cursor: "pointer",
                        fontSize: 16,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Send Chatroom Invitation"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Add Found Pet User Button */}
            <div>
              <button
                type="button"
                onClick={() => setShowAddFoundUser(!showAddFoundUser)}
                disabled={selectedConversationId ? !!invitationRequests[selectedConversationId]?.foundedUser : false}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: (selectedConversationId && invitationRequests[selectedConversationId]?.foundedUser) ? "#f3f4f6" : "#ffffff",
                  cursor: (selectedConversationId && invitationRequests[selectedConversationId]?.foundedUser) ? "not-allowed" : "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: (selectedConversationId && invitationRequests[selectedConversationId]?.foundedUser) ? "#9ca3af" : "#0f172a",
                  opacity: (selectedConversationId && invitationRequests[selectedConversationId]?.foundedUser) ? 0.6 : 1,
                }}
              >
                <span>➕</span>
                <span>Add Found Pet User</span>
              </button>
              
              {/* Show search panel when clicked */}
              {showAddFoundUser && !foundedUser && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 10,
                    borderRadius: 10,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={foundUserSearch}
                    onChange={(e) => setFoundUserSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      fontSize: 12,
                      outline: "none",
                      marginBottom: 8,
                      background: "#ffffff",
                      color: "#111827",
                    }}
                  />
                  
                  {/* Loading state */}
                  {usersLoading && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        textAlign: "center",
                        padding: 8,
                      }}
                    >
                      Loading users...
                    </div>
                  )}
                  
                  {/* Error state */}
                  {usersError && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#dc2626",
                        background: "#fee2e2",
                        padding: 8,
                        borderRadius: 6,
                        marginBottom: 8,
                      }}
                    >
                      {usersError}
                    </div>
                  )}
                  
                  {/* Real user search results */}
                  {!usersLoading && !usersError && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        maxHeight: 200,
                        overflowY: "auto",
                      }}
                    >
                      {(() => {
                        // Filter users based on search and exclusions
                        const searchLower = foundUserSearch.toLowerCase();
                        const currentInvitations = selectedConversationId ? invitationRequests[selectedConversationId] : null;
                        const filteredUsers = allUsers.filter((user) => {
                          const actualUserId = user.user_id || user.id;
                          // Exclude if already has invitation as Requested User
                          if (currentInvitations?.requestedUser && actualUserId === currentInvitations.requestedUser.user.id) {
                            return false;
                          }
                          // Exclude if already has invitation as Founded User
                          if (currentInvitations?.foundedUser && actualUserId === currentInvitations.foundedUser.user.id) {
                            return false;
                          }
                          // Exclude if already in Admins
                          if (admins.some((admin) => admin.id === actualUserId)) {
                            return false;
                          }
                          // Filter by search term (name, username, email)
                          if (searchLower) {
                            const name = (user.full_name || user.name || "").toLowerCase();
                            const username = (user.username || "").toLowerCase();
                            const email = (user.email || "").toLowerCase();
                            return (
                              name.includes(searchLower) ||
                              username.includes(searchLower) ||
                              email.includes(searchLower)
                            );
                          }
                          return true;
                        });

                        if (filteredUsers.length === 0) {
                          return (
                            <div
                              style={{
                                fontSize: 11,
                                color: "#9ca3af",
                                textAlign: "center",
                                padding: 8,
                                fontStyle: "italic",
                              }}
                            >
                              {foundUserSearch
                                ? "No users found matching your search"
                                : "No users available"}
                            </div>
                          );
                        }

                        return filteredUsers.map((user) => {
                          const displayName =
                            user.full_name || user.name || user.username || "Unknown User";
                          const displayEmail = user.email || "";
                          
                          return (
                            <div
                              key={user.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 8,
                                padding: "6px 8px",
                                borderRadius: 8,
                                background: "#ffffff",
                                border: "1px solid #e5e7eb",
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "#0f172a",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {displayName}
                                </div>
                                {displayEmail && (
                                  <div
                                    style={{
                                      fontSize: 9,
                                      color: "#6b7280",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {displayEmail}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  // Use user_id (actual User model ID) instead of id (UserProfile ID)
                                  const actualUserId = user.user_id || user.id;
                                  
                                  // If we're in a chatroom context, invite to existing chatroom
                                  if (selectedRoomId) {
                                    const res = await inviteUserToChatroom(selectedRoomId, actualUserId, 'founded_user');
                                    
                                    if (res.ok) {
                                      alert(`Invitation sent to ${displayName}! They will receive a notification.`);
                                      setShowAddFoundUser(false);
                                      
                                      // Reload participants
                                      const participantsRes = await fetchChatroomParticipants(selectedRoomId);
                                      if (participantsRes.ok && Array.isArray(participantsRes.data)) {
                                        const participants = participantsRes.data;
                                        const requestedUser = participants.find((p: any) => p.role === 'requested_user');
                                        const foundedUser = participants.find((p: any) => p.role === 'founded_user');
                                        const admins = participants.filter((p: any) => p.role === 'admin');
                                        
                                        setRoomMembersData((prev) => ({
                                          ...prev,
                                          [selectedRoomId]: {
                                            requestedUser: requestedUser || null,
                                            foundedUser: foundedUser || null,
                                            admins: admins,
                                          },
                                        }));
                                      }
                                    } else {
                                      alert(res.error || "Failed to send invitation");
                                    }
                                  } else {
                                    // No chatroom context - create chatroom creation request
                                    if (!activeConversation) {
                                      alert("No active conversation selected");
                                      return;
                                    }
                                    
                                    const petUniqueId = activeConversation.pet_unique_id;
                                    const petKind = activeConversation.pet_kind;
                                    const conversationId = activeConversation.id;
                                    
                                    if (!petUniqueId || !petKind) {
                                      alert("Pet information not found. Please ensure this conversation has pet context.");
                                      return;
                                    }
                                    
                                    const res = await createChatroomInvitation({
                                      user_id: actualUserId,
                                      pet_unique_id: petUniqueId,
                                      pet_kind: petKind,
                                      conversation_id: conversationId,
                                      role: "founded_user",
                                    });
                                    
                                    if (res.ok) {
                                      setInvitationRequests((prev) => ({
                                        ...prev,
                                        [conversationId]: {
                                          ...prev[conversationId],
                                          foundedUser: {
                                            user: {
                                              id: actualUserId,
                                              username: user.username || displayName,
                                              full_name: displayName,
                                            email: displayEmail,
                                          },
                                          status: 'pending',
                                          requestId: res.data?.id || 0,
                                        },
                                      },
                                    }));
                                    
                                    alert(`Chatroom invitation sent to ${displayName}! They will receive a notification.`);
                                    setShowAddFoundUser(false);
                                    setFoundUserSearch("");
                                    } else {
                                      alert(res.error || "Failed to send chatroom invitation");
                                    }
                                  }
                                }}
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: "50%",
                                  border: "none",
                                  background: "#f59e0b",
                                  color: "white",
                                  cursor: "pointer",
                                  fontSize: 14,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                                title="Send Chatroom Invitation"
                              >
                                +
                              </button>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Add Admin Button */}
            <div>
              <button
                type="button"
                onClick={() => setShowAddAdmin(!showAddAdmin)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                <span>➕</span>
                <span>Add Admin</span>
              </button>
              
              {/* Show available admins when clicked */}
              {showAddAdmin && selectedRoomId && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 10,
                    borderRadius: 10,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {staffUsers.length === 0 ? (
                      <div style={{ fontSize: 11, color: "#6b7280", textAlign: "center", padding: 8 }}>
                        Loading staff users...
                      </div>
                    ) : (
                      staffUsers
                        .filter((staff) => !admins.find((a) => a.user?.id === staff.id))
                        .map((staff) => (
                          <div
                            key={staff.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                              padding: "6px 8px",
                              borderRadius: 8,
                              background: "#ffffff",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "#0f172a",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {staff.full_name || staff.username}
                              </div>
                              <div style={{ fontSize: 10, color: "#6b7280" }}>
                                {staff.email}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!selectedRoomId) return;
                                
                                // Call API to invite user to chatroom
                                const res = await inviteUserToChatroom(selectedRoomId, staff.id, 'admin');
                                
                                if (res.ok) {
                                  alert(`Invitation sent to ${staff.full_name || staff.username}!`);
                                  // Reload participants to show the new admin
                                  const participantsRes = await fetchChatroomParticipants(selectedRoomId);
                                  if (participantsRes.ok && Array.isArray(participantsRes.data)) {
                                    const participants = participantsRes.data;
                                    const requestedUser = participants.find((p: any) => p.role === 'requested_user');
                                    const foundedUser = participants.find((p: any) => p.role === 'founded_user');
                                    const admins = participants.filter((p: any) => p.role === 'admin');
                                    
                                    setRoomMembersData((prev) => ({
                                      ...prev,
                                      [selectedRoomId]: {
                                        requestedUser: requestedUser || null,
                                        foundedUser: foundedUser || null,
                                        admins: admins,
                                      },
                                    }));
                                  }
                                  setShowAddAdmin(false);
                                } else {
                                  alert(res.error || "Failed to invite admin");
                                }
                              }}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                border: "none",
                                background: "#6366f1",
                                color: "white",
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="Invite as Admin"
                            >
                              +
                            </button>
                          </div>
                        ))
                    )}
                    {staffUsers.length > 0 && staffUsers.filter((staff) => !admins.find((a) => a.user?.id === staff.id)).length === 0 && (
                      <div
                        style={{
                          fontSize: 10,
                          color: "#9ca3af",
                          textAlign: "center",
                          padding: 4,
                          fontStyle: "italic",
                        }}
                      >
                        All staff users already added
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
