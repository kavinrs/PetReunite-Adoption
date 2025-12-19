// src/pages/UserHome.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getProfile,
  clearTokens,
  fetchPublicLostPets,
  fetchPublicFoundPets,
  fetchAvailablePets,
  fetchMyActivity,
  updateMyLostReport,
  updateMyFoundReport,
  fetchChatConversations,
  fetchNotifications,
} from "../services/api";
import RoomsPage from "../chat/RoomsPage";
import { useNavigate, useLocation } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";

type Tab = "owner" | "rescuer" | "adopter";
type UserPageTab = "home" | "activity" | "chat";

// Helper function to get status badge styling
const getStatusBadge = (status: string) => {
  const st = (status || "").toLowerCase();
  switch (st) {
    case 'pending':
    case 'requested':
      return { color: '#f59e0b', bg: '#fef3c7', text: 'Pending Review', icon: '⏳' };
    case 'approved':
    case 'accepted':
    case 'active':
      return { color: '#10b981', bg: '#d1fae5', text: 'Approved', icon: '✓' };
    case 'rejected':
      return { color: '#ef4444', bg: '#fee2e2', text: 'Rejected', icon: '✗' };
    case 'investigating':
      return { color: '#3b82f6', bg: '#dbeafe', text: 'Under Investigation', icon: '🔍' };
    case 'matched':
      return { color: '#8b5cf6', bg: '#ede9fe', text: 'Matched', icon: '🤝' };
    case 'resolved':
      return { color: '#6b7280', bg: '#f3f4f6', text: 'Resolved', icon: '✓' };
    case 'closed':
      return { color: '#6b7280', bg: '#f3f4f6', text: 'Closed', icon: '🔒' };
    case 'read_only':
      return { color: '#f59e0b', bg: '#fef3c7', text: 'Waiting', icon: '⏸' };
    default:
      return { color: '#6b7280', bg: '#f3f4f6', text: status || 'Unknown', icon: '•' };
  }
};

export default function UserHome() {
  // Apply viewport standardization to ensure consistent 100% scaling
  useViewportStandardization();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("owner");
  const [pageTab, setPageTab] = useState<UserPageTab>("home");
  const [allPets, setAllPets] = useState<any[]>([]);
  const [filteredPets, setFilteredPets] = useState<any[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("All Species");
  const [selectedCategory, setSelectedCategory] = useState("All pets");
  const [sortBy, setSortBy] = useState("Most Recent");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedDismissedUserNotificationsRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [activity, setActivity] = useState<{ lost: any[]; found: any[]; adoptions: any[] }>({ lost: [], found: [], adoptions: [] });
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState<string | null>(null);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [chatRequests, setChatRequests] = useState<any[]>([]);
  const [chatRequestsLoading, setChatRequestsLoading] = useState(false);
  const [userHasNotification, setUserHasNotification] = useState(false);
  const [userNotificationOpen, setUserNotificationOpen] = useState(false);
  const [dismissedUserNotifications, setDismissedUserNotifications] = useState<string[]>([]);
  const [chatNotifications, setChatNotifications] = useState<any[]>([]);

  // Function to get sample pet images
  const getSamplePetImage = (petType: string, index: number): string => {
    const dogImages = [
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&h=300&fit=crop",
    ];

    const catImages = [
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1606214174585-fe31582cd309?w=400&h=300&fit=crop",
    ];

    const rabbitImages = [
      "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1606244864456-8bee63fce472?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1612195583950-b8fd34c87093?w=400&h=300&fit=crop",
    ];

    const birdImages = [
      "https://images.unsplash.com/photo-1544830162-6d4dc7be6b99?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1605460375648-278bcbd579a6?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?w=400&h=300&fit=crop",
    ];

    const horseImages = [
      "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop",
    ];

    const cowImages = [
      "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1568393691622-d7c340b99571?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1563281577-a7be47e20db9?w=400&h=300&fit=crop",
    ];

    const type = petType.toLowerCase();
    let images = dogImages; // default

    if (type.includes("cat")) images = catImages;
    else if (type.includes("rabbit")) images = rabbitImages;
    else if (
      type.includes("bird") ||
      type.includes("parrot") ||
      type.includes("cockatiel") ||
      type.includes("macaw")
    )
      images = birdImages;
    else if (type.includes("horse")) images = horseImages;
    else if (type.includes("cow")) images = cowImages;

    return images[index % images.length];
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const res = await getProfile();
      if (!mounted) return;
      if (res.ok) setProfile(res.data);
      else {
        clearTokens();
        navigate("/", { replace: true });
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Honour router state and path for switching views (activity/chat)
  useEffect(() => {
    const state = (location.state || {}) as any;
    if (state && state.tab === "activity") {
      setPageTab("activity");
      return;
    }

    if (location.pathname.startsWith("/user/chat")) {
      setPageTab("chat");
    }
  }, [location.pathname, location.state]);

  useEffect(() => {
    const username =
      profile?.username ?? profile?.user?.username ?? null;
    if (!username) return;

    const key = `user_dismissed_notifications_${username}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setDismissedUserNotifications(parsed as string[]);
        }
      }
      hasLoadedDismissedUserNotificationsRef.current = true;
    } catch {
      // ignore parse errors and start fresh
    }
  }, [profile?.username, profile?.user?.username]);

  useEffect(() => {
    let mounted = true;
    async function loadActivity() {
      setActivityLoading(true);
      const res = await fetchMyActivity();
      if (!mounted) return;
      if (res.ok) setActivity(res.data);
      setActivityLoading(false);
    }
    async function loadChatRequests() {
      setChatRequestsLoading(true);
      const res = await fetchChatConversations();
      if (!mounted) return;
      if (res.ok) {
        // Filter for pending/requested conversations
        const pending = (res.data as any[]).filter((c: any) => {
          const status = (c.status || "").toLowerCase();
          return status === "pending" || status === "requested";
        });
        setChatRequests(pending);
      }
      setChatRequestsLoading(false);
    }
    async function loadNotifications() {
      const res = await fetchNotifications();
      if (!mounted) return;
      if (res.ok) {
        // Filter for chat-related notifications
        const chatNotifs = (res.data ?? []).filter((n: any) => 
          n.notification_type && n.notification_type.startsWith('chat_')
        );
        setChatNotifications(chatNotifs);
      }
    }
    // Always load activity so notifications work from any tab
    loadActivity();
    loadChatRequests();
    loadNotifications();
    const id = window.setInterval(() => {
      loadActivity();
      loadChatRequests();
      loadNotifications();
    }, 15000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadPets() {
      setPetsLoading(true);
      try {
        const [lostRes, foundRes, adoptionRes] = await Promise.all([
          fetchPublicLostPets(),
          fetchPublicFoundPets(),
          fetchAvailablePets(),
        ]);

        if (!mounted) return;

        const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "/api";
        const origin = /^https?:/.test(apiBase)
          ? new URL(apiBase).origin
          : "http://localhost:8000";

        const resolvePhoto = (raw: any, fallback: string): string => {
          if (!raw) return fallback;
          const s = String(raw);
          if (s.startsWith("http")) return s;
          if (s.startsWith("/")) return origin + s;
          return origin + "/media/" + s;
        };

        let combinedPets: any[] = [];
        if (lostRes.ok) {
          const lostPets = lostRes.data.map((pet: any, index: number) => {
            const raw = pet.photo_url || pet.photo;
            return {
              ...pet,
              petCategory: "lost",
              displayName: pet.pet_name || `${pet.pet_type}`,
              location: `${pet.city}, ${pet.state}`,
              photo: resolvePhoto(
                raw,
                getSamplePetImage(pet.pet_type, index),
              ),
            };
          });
          combinedPets.push(...lostPets);
        }

        if (foundRes.ok) {
          const foundPets = foundRes.data.map((pet: any, index: number) => {
            const raw = pet.photo_url || pet.photo;
            return {
              ...pet,
              petCategory: "found",
              displayName: pet.pet_type || "Found pet",
              location: `${pet.found_city}, ${pet.state}`,
              photo: resolvePhoto(
                raw,
                getSamplePetImage(pet.pet_type || "Dog", index + 50),
              ),
            };
          });
          combinedPets.push(...foundPets);
        }

        if (adoptionRes.ok) {
          const adoptionPets = adoptionRes.data.map((pet: any, index: number) => {
            const raw = pet.photos;
            return {
              ...pet,
              petCategory: "adoption",
              displayName: pet.name,
              location: `${pet.location_city}, ${pet.location_state}`,
              photo: resolvePhoto(
                raw,
                getSamplePetImage(pet.species, index + 100),
              ),
            };
          });
          combinedPets.push(...adoptionPets);
        }

        setAllPets(combinedPets);
        setFilteredPets(combinedPets);
      } catch (error) {
        console.error("Error loading pets:", error);
      } finally {
        if (mounted) setPetsLoading(false);
      }
    }

    if (profile) {
      loadPets();
    }

    return () => {
      mounted = false;
    };
  }, [profile]);

  // Filter pets based on search and filters
  useEffect(() => {
    let filtered = allPets;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (pet) =>
          pet.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.breed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Species filter
    if (selectedSpecies !== "All Species") {
      filtered = filtered.filter(
        (pet) => pet.pet_type.toLowerCase() === selectedSpecies.toLowerCase(),
      );
    }

    // Category filter
    if (selectedCategory !== "All pets") {
      filtered = filtered.filter((pet) => {
        if (selectedCategory === "Lost pet") {
          return pet.petCategory === "lost";
        }
        if (selectedCategory === "Found pet") {
          return pet.petCategory === "found";
        }
        if (selectedCategory === "Adoption pet") {
          return pet.petCategory === "adoption";
        }
        return true;
      });
    }

    // Sort
    if (sortBy === "Most Recent") {
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    setFilteredPets(filtered);
  }, [allPets, searchQuery, selectedSpecies, selectedCategory, sortBy]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    if (menuOpen) {
      window.addEventListener("mousedown", handleClickOutside);
    } else {
      window.removeEventListener("mousedown", handleClickOutside);
    }
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    function handleClickOutsideNotif(e: MouseEvent) {
      const node = notifRef.current;
      if (!node) return;
      if (node.contains(e.target as Node)) return;
      setUserNotificationOpen(false);
    }
    if (userNotificationOpen) {
      window.addEventListener("mousedown", handleClickOutsideNotif);
    } else {
      window.removeEventListener("mousedown", handleClickOutsideNotif);
    }
    return () => window.removeEventListener("mousedown", handleClickOutsideNotif);
  }, [userNotificationOpen]);

  const displayName =
    profile?.full_name ??
    profile?.username ??
    profile?.user?.username ??
    "User";
  const avatarUrl = profile?.profile_photo || "/profile-avatar.svg";
  const email = profile?.user?.email ?? profile?.email ?? "";

  const userNotificationFeed = useMemo(() => {
    const items: { id: string; title: string; from: string; createdAt: string | null; tab: "lost" | "found" | "adoption" | "chat"; rowId?: number; status?: string }[] = [];
    const pushItem = (id: string, title: string, createdAt: string | null, tab: "lost" | "found" | "adoption" | "chat", rowId?: number, status?: string) => {
      items.push({ id, title, from: "Admin", createdAt, tab, rowId, status });
    };
    // Show ALL requests regardless of status - requests should never disappear
    for (const r of (activity.lost ?? []) as any[]) {
      pushItem(`lost-${r.id}`, "Lost Report", r.updated_at || r.created_at || null, "lost", r.id, r.status);
    }
    for (const r of (activity.found ?? []) as any[]) {
      pushItem(`found-${r.id}`, "Found Report", r.updated_at || r.created_at || null, "found", r.id, r.status);
    }
    for (const a of (activity.adoptions ?? []) as any[]) {
      pushItem(`adoption-${a.id}`, "Adoption Request", a.updated_at || a.created_at || null, "adoption", a.id, a.status);
    }
    // Add chat notifications
    for (const n of (chatNotifications ?? []) as any[]) {
      let title = "Chat Notification";
      if (n.notification_type === "chat_accepted") {
        title = "Chat Request Accepted";
      } else if (n.notification_type === "chat_rejected") {
        title = "Chat Request Closed";
      } else if (n.notification_type === "chat_message") {
        title = "New Chat Message";
      } else if (n.notification_type === "chat_room_created") {
        title = "Chat Room Created";
      } else if (n.notification_type === "chat_status_changed") {
        title = "Chat Status Changed";
      }
      pushItem(`chat-notif-${n.id}`, title, n.created_at || null, "chat");
    }
    items.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    return items;
  }, [activity.lost, activity.found, activity.adoptions, chatNotifications]);

  useEffect(() => {
    if (!hasLoadedDismissedUserNotificationsRef.current) return;
    const unread = userNotificationFeed.filter((n) => !dismissedUserNotifications.includes(n.id));
    setUserHasNotification(unread.length > 0);
    // Persist dismissed notifications per user so they don't return after logout/login
    const username =
      profile?.username ?? profile?.user?.username ?? null;
    if (username) {
      const key = `user_dismissed_notifications_${username}`;
      try {
        localStorage.setItem(key, JSON.stringify(dismissedUserNotifications));
      } catch {
        // ignore storage errors
      }
    }
  }, [userNotificationFeed, dismissedUserNotifications]);

  function handleUserNotificationClick() {
    setUserNotificationOpen((open) => !open);
    setUserHasNotification(false);
  }

  function handleUserNotificationItemClick(item: { id: string; tab: "lost" | "found" | "adoption" | "chat"; rowId?: number }) {
    // Mark this notification as read
    setDismissedUserNotifications((prev) =>
      prev.includes(item.id) ? prev : [...prev, item.id],
    );

    // Hide the dropdown so the focus moves to the details view
    setUserNotificationOpen(false);

    // Handle chat notifications differently
    if (item.tab === "chat") {
      setPageTab("chat");
      return;
    }

    // Always switch the main section to My Activity for other notifications
    setPageTab("activity");

    // Deep-link to the appropriate detail page for this notification
    if (item.tab === "lost" && item.rowId) {
      navigate(`/user/lost/${item.rowId}`);
    } else if (item.tab === "found" && item.rowId) {
      navigate(`/user/found/${item.rowId}`);
    } else if (item.tab === "adoption") {
      navigate("/user/adoption-requests");
    }
  }

  // Derived activity lists respecting species + sort filters
  const activityLostFiltered = useMemo(() => {
    let items = (activity.lost ?? []) as any[];
    if (selectedSpecies !== "All Species") {
      const sp = selectedSpecies.toLowerCase();
      items = items.filter((r) => (r.pet_type || "").toLowerCase() === sp);
    }
    if (sortBy === "Most Recent") {
      items = [...items].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    return items;
  }, [activity.lost, selectedSpecies, sortBy]);

  const activityFoundFiltered = useMemo(() => {
    let items = (activity.found ?? []) as any[];
    if (selectedSpecies !== "All Species") {
      const sp = selectedSpecies.toLowerCase();
      items = items.filter((r) => (r.pet_type || "").toLowerCase() === sp);
    }
    if (sortBy === "Most Recent") {
      items = [...items].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    return items;
  }, [activity.found, selectedSpecies, sortBy]);

  const activityAdoptionsFiltered = useMemo(() => {
    let items = (activity.adoptions ?? []) as any[];
    if (selectedSpecies !== "All Species") {
      const sp = selectedSpecies.toLowerCase();
      items = items.filter(
        (a) => (a.pet?.species || "").toLowerCase() === sp,
      );
    }
    if (sortBy === "Most Recent") {
      items = [...items].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    return items;
  }, [activity.adoptions, selectedSpecies, sortBy]);

  if (loading) return <div style={{ padding: 40 }}>Loading home...</div>;

  const tabItems: { id: Tab; label: string }[] = [
    { id: "owner", label: "Pet Owner" },
    { id: "rescuer", label: "Pet Rescuer" },
    { id: "adopter", label: "Pet Adopter" },
  ];

  const sidebarLinks = [
    {
      label: "Home",
      icon: "🗂",
      onClick: () => {
        setPageTab("home");
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    },
    {
      label: "Report Lost Pet",
      icon: "⚠️",
      onClick: () => navigate("/user/report-lost"),
    },
    {
      label: "Report Found Pet",
      icon: "🐾",
      onClick: () => navigate("/user/report-found"),
    },
    {
      label: "Volunteer",
      icon: "🤝",
      onClick: () => navigate("/user/volunteer"),
    },
    {
      label: "My Activity",
      icon: "📜",
      onClick: () => setPageTab("activity"),
    },
    {
      label: "Chatroom Requests",
      icon: "📬",
      onClick: () => navigate("/user/chatroom-requests"),
    },
    {
      label: "My Chatrooms",
      icon: "💬",
      onClick: () => navigate("/user/my-chatrooms"),
    },
    {
      label: "Chat",
      icon: "💭",
      onClick: () => {
        // Stay on the same route and just switch the in-page tab
        setPageTab("chat");
      },
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f7fb",
        fontFamily: "'Inter', sans-serif",
        color: "#0f172a",
        display: "flex",
        justifyContent: "flex-start",
        padding: "0",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          minHeight: "100vh",
        }}
      >
        <aside
          style={{
            width: sidebarOpen ? 280 : 0,
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            borderRight: "1px solid rgba(15,23,42,0.12)",
            padding: sidebarOpen ? 24 : 0,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            boxShadow: "6px 0 25px rgba(15,23,42,0.08)",
            transition: "all 0.3s ease",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ff8a00, #ff2fab)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 25px rgba(255,138,0,0.35)",
              }}
            >
              <span style={{ fontSize: 20, filter: "brightness(0) invert(1)" }}>
                🐾
              </span>
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 20, color: "#0f172a" }}>
                PetReunite
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(15,23,42,0.6)",
                  fontWeight: 500,
                }}
              >
                Pet Rescue Platform
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sidebarLinks.map((link) => {
              const isActive =
                (link.label === "Home" && pageTab === "home") ||
                (link.label === "My Activity" && pageTab === "activity") ||
                (link.label === "Chat" && pageTab === "chat");
              return (
              <button
                key={link.label}
                onClick={link.onClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  fontWeight: isActive ? 800 : 700,
                  padding: "12px 16px",
                  borderRadius: 16,
                  cursor: "pointer",
                  border: isActive ? "none" : "2px solid rgba(15,23,42,0.1)",
                  background: isActive
                    ? "linear-gradient(135deg,#ff8a00,#ff2fab)"
                    : "rgba(15,23,42,0.03)",
                  color: isActive ? "white" : "#0f172a",
                  fontSize: 14,
                  textAlign: "left",
                  boxShadow: isActive
                    ? "0 15px 35px rgba(255,138,0,0.4)"
                    : "0 4px 12px rgba(15,23,42,0.1)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(15,23,42,0.08)";
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 18px rgba(15,23,42,0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(15,23,42,0.03)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(15,23,42,0.1)";
                  }
                }}
              >
                <span
                  role="img"
                  aria-label={link.label}
                  style={{
                    fontSize: 16,
                    minWidth: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {link.icon}
                </span>
                {link.label}
              </button>
            );})}
          </div>
        </aside>

        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "24px 32px",
            boxSizing: "border-box",
            gap: 20,
            transition: "all 0.3s ease",
            width: "100%",
          }}
        >
          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              position: "fixed",
              top: 20,
              left: sidebarOpen ? 260 : 20,
              zIndex: 1000,
              background: "linear-gradient(135deg, #ff8a00, #ff2fab)",
              border: "none",
              borderRadius: "50%",
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(255,138,0,0.35)",
              transition: "all 0.3s ease",
              color: "white",
              fontSize: 16,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow =
                "0 12px 25px rgba(255,138,0,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 8px 20px rgba(255,138,0,0.35)";
            }}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              {pageTab !== "chat" && (
                <>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>
                    {pageTab === "activity" ? "My Activity" : "Home"}
                  </div>
                  <div style={{ color: "rgba(15,23,42,0.6)", marginTop: 4 }}>
                    {pageTab === "activity"
                      ? "Your reports and adoption history"
                      : "Manage your pet rescue activities"}
                  </div>
                </>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div ref={notifRef} style={{ position: "relative" }}>
                <button
                  onClick={handleUserNotificationClick}
                  aria-label="Notifications"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "white",
                    border: "2px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <span style={{ fontSize: 18 }}>🔔</span>
                  {userHasNotification && (
                    <span
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#ef4444",
                      }}
                    />
                  )}
                </button>
                {userNotificationOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "120%",
                      // Move the dropdown further to the right so it stays clear
                      // of the Species filter area below it
                      right: -80,
                      width: 340,
                      background: "white",
                      borderRadius: 12,
                      boxShadow: "0 16px 40px rgba(15,23,42,0.2)",
                      border: "1px solid rgba(15,23,42,0.08)",
                      // Ensure notifications float above species filter and other controls
                      zIndex: 1000,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>Notifications</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Latest activity</div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        maxHeight: 320,
                        overflowY: "auto",
                        paddingRight: 4,
                        // Slightly nicer scrolling on supported browsers
                        scrollbarWidth: "thin",
                      }}
                    >
                      {userNotificationFeed.filter((n) => !dismissedUserNotifications.includes(n.id)).length === 0 ? (
                        <div style={{ padding: 12, fontSize: 13, color: "#64748b" }}>No new notifications</div>
                      ) : (
                        userNotificationFeed
                          .filter((n) => !dismissedUserNotifications.includes(n.id))
                          .map((n) => (
                            <button
                              key={n.id}
                              onClick={() => handleUserNotificationItemClick(n)}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr auto",
                                gap: 8,
                                width: "100%",
                                textAlign: "left",
                                background: "transparent",
                                border: "none",
                                padding: "10px 12px",
                                cursor: "pointer",
                                borderBottom: "1px solid #f1f5f9",
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{n.title}</div>
                                  {n.status && (() => {
                                    const badge = getStatusBadge(n.status);
                                    return (
                                      <span
                                        style={{
                                          padding: "2px 6px",
                                          borderRadius: 999,
                                          background: badge.bg,
                                          color: badge.color,
                                          fontSize: 10,
                                          fontWeight: 700,
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 3,
                                        }}
                                      >
                                        <span>{badge.icon}</span>
                                        <span>{badge.text}</span>
                                      </span>
                                    );
                                  })()}
                                </div>
                                <div style={{ fontSize: 12, color: "#64748b" }}>From Admin</div>
                                <div style={{ fontSize: 11, color: "#9ca3af" }}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                              </div>
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  background: "white",
                  borderRadius: 16,
                  padding: "8px 16px",
                  boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
                  border: "2px solid rgba(15,23,42,0.08)",
                  cursor: "pointer",
                  minWidth: 240,
                  textAlign: "left",
                  transition: "all 0.2s ease",
                }}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 16px 40px rgba(15,23,42,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 30px rgba(15,23,42,0.12)";
                }}
              >
                <div
                  style={{
                    borderRadius: "50%",
                    width: 40,
                    height: 40,
                    overflow: "hidden",
                    background: "linear-gradient(135deg,#6d5dfc,#58c4ff)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 6px 15px rgba(109,93,252,0.3)",
                  }}
                >
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    lineHeight: 1.3,
                  }}
                >
                  <span
                    style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}
                  >
                    {displayName}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "rgba(15,23,42,0.6)",
                      fontWeight: 500,
                    }}
                  >
                    {email}
                  </span>
                </div>
                <span style={{ fontSize: 16, color: "rgba(15,23,42,0.5)" }}>
                  {menuOpen ? "▴" : "▾"}
                </span>
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  style={{
                    position: "absolute",
                    top: "120%",
                    right: 0,
                    width: 180,
                    background: "white",
                    borderRadius: 8,
                    boxShadow: "0 12px 30px rgba(15,23,42,0.2)",
                    padding: 12,
                    color: "#0f172a",
                    zIndex: 10,
                    border: "1px solid rgba(15,23,42,0.08)",
                  }}
                >
                  <div style={{ marginBottom: 10, textAlign: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>
                      {displayName}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(15,23,42,0.6)",
                        marginTop: 1,
                      }}
                    >
                      {email}
                    </div>
                  </div>
                  <div
                    style={{
                      height: 1,
                      background: "rgba(15,23,42,0.12)",
                      marginBottom: 8,
                    }}
                  />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/user/profile");
                    }}
                    style={{
                      width: "100%",
                      border: "2px solid rgba(99,102,241,0.3)",
                      background: "rgba(99,102,241,0.1)",
                      color: "#312e81",
                      borderRadius: 12,
                      padding: "10px 12px",
                      cursor: "pointer",
                      fontWeight: 700,
                      marginBottom: 6,
                      fontSize: 12,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(99,102,241,0.2)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(99,102,241,0.1)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    👤 View Profile
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      clearTokens();
                      navigate("/", { replace: true });
                    }}
                    style={{
                      width: "100%",
                      border: "2px solid rgba(248,113,113,0.4)",
                      background: "rgba(248,113,113,0.15)",
                      borderRadius: 12,
                      padding: "10px 12px",
                      cursor: "pointer",
                      fontWeight: 700,
                      color: "#b91c1c",
                      fontSize: 12,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(248,113,113,0.25)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(248,113,113,0.15)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>

          {/* Find Your Perfect Pet Section (hide on chat tab) */}
          {pageTab !== "chat" && (
            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: 20,
                boxShadow: "0 24px 60px rgba(15,23,42,0.08)",
                border: "1px solid rgba(15,23,42,0.05)",
                overflow: "visible",
                position: "relative",
              }}
            >
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: 6,
                }}
              >
                Discover Pets Looking for Loving Homes
              </div>
              <div style={{ color: "rgba(15,23,42,0.6)", fontSize: 14 }}>
                Discover pets ready for adoption and help lost pets find their
                way home
              </div>
            </div>

            {/* Search and Filters */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                marginBottom: 12,
              }}
            >
                {/* Search Bar */}
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="text"
                    placeholder="Search by name or breed..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid rgba(15,23,42,0.15)",
                      fontSize: 12,
                      color: "#0f172a",
                      background: "rgba(15,23,42,0.02)",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Filter Row */}
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    flexWrap: "wrap",
                    alignItems: "center",
                    marginBottom: 16,
                    position: "relative",
                    zIndex: 1000,
                    overflow: "visible",
                  }}
                >
                  {/* Category Filter Buttons */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {["All pets", "Lost pet", "Found pet", "Adoption pet"].map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 20,
                          border:
                            selectedCategory === category
                              ? "2px solid #ff8a00"
                              : "1px solid rgba(15,23,42,0.15)",
                          background:
                            selectedCategory === category
                              ? "rgba(255,138,0,0.1)"
                              : "white",
                          color:
                            selectedCategory === category
                              ? "#ff8a00"
                              : "rgba(15,23,42,0.8)",
                          cursor: "pointer",
                          fontWeight: selectedCategory === category ? 700 : 500,
                          fontSize: 12,
                        }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  {/* Species Dropdown */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "rgba(15,23,42,0.6)" }}>
                      Species:
                    </span>
                    <div style={{ position: "relative", zIndex: 1001 }}>
                      <select
                        value={selectedSpecies}
                        onChange={(e) => setSelectedSpecies(e.target.value)}
                        style={{
                          padding: "12px 16px",
                          borderRadius: 12,
                          border: "1px solid rgba(15,23,42,0.25)",
                          background: "#ffffff",
                          fontSize: 12,
                          cursor: "pointer",
                          minWidth: "140px",
                          position: "relative",
                          zIndex: 1002,
                          color: "#0f172a",
                          fontWeight: 600,
                        }}
                      >
                        <option value="All Species">All Species</option>
                        <option value="Dog">Dogs</option>
                        <option value="Cat">Cats</option>
                        <option value="Rabbit">Rabbits</option>
                        <option value="Bird">Birds</option>
                      </select>
                    </div>
                  </div>

                  {/* Sort Dropdown */}
                  <div
                    style={{
                      marginLeft: "auto",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      position: "relative",
                      zIndex: 1001,
                    }}
                  >
                    <span style={{ fontSize: 12, color: "rgba(15,23,42,0.6)" }}>
                      Sort by:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(15,23,42,0.25)",
                        background: "#ffffff",
                        fontSize: 12,
                        cursor: "pointer",
                        minWidth: "120px",
                        position: "relative",
                        zIndex: 1002,
                        color: "#0f172a",
                        fontWeight: 600,
                      }}
                    >
                      <option value="Most Recent">Most Recent</option>
                      <option value="Alphabetical">Alphabetical</option>
                    </select>
                  </div>
                </div>

                {/* Results Count (only show on Dashboard view, not My Activity) */}
                {pageTab !== "activity" && (
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
                    {filteredPets.length} Pet
                    {filteredPets.length !== 1 ? "s" : ""} Available
                  </div>
                )}
              </div>

            {/* Main content: Activity or Dashboard cards (chat rendered separately) */}
            {pageTab === "activity" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {activityLoading && <div style={{ padding: 12 }}>Loading activity…</div>}
                {!activityLoading && (
                  <>
                    {/* Lost reports section (respect category filter) */}
                    {(selectedCategory === "All pets" ||
                      selectedCategory === "Lost pet") && (
                      <>
                        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>
                          Lost Pet Reports
                        </div>
                        {activityLostFiltered.length === 0 ? (
                          <div style={{ padding: 12, color: "#64748b" }}>
                            No lost reports yet.
                          </div>
                        ) : (
                          activityLostFiltered.map((r: any) => (
                        <div key={`lost-${r.id}`} style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 16, padding: 16, display: "grid", gridTemplateColumns: "100px 1fr auto", gap: 16 }}>
                          {(() => {
                            const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "/api";
                            const origin = /^https?:/.test(apiBase) ? new URL(apiBase).origin : "http://localhost:8000";
                            const raw = r.photo_url || r.photo;
                            const src = raw ? (String(raw).startsWith("http") ? String(raw) : (String(raw).startsWith("/") ? origin + String(raw) : origin + "/media/" + String(raw))) : null;
                            return src ? (
                              <img src={src} alt={r.pet_name || r.pet_type || "Pet"} style={{ width: 100, height: 100, borderRadius: 12, objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: 100, height: 100, borderRadius: 12, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>🐾</div>
                            );
                          })()}
                          <div>
                            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  background: "#fee2e2",
                                  color: "#b91c1c",
                                  fontSize: 12,
                                  fontWeight: 800,
                                }}
                              >
                                LOST
                              </span>
                              {(() => {
                                const badge = getStatusBadge(r.status);
                                return (
                                  <span
                                    style={{
                                      padding: "2px 10px",
                                      borderRadius: 999,
                                      background: badge.bg,
                                      color: badge.color,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <span>{badge.icon}</span>
                                    <span>{badge.text}</span>
                                  </span>
                                );
                              })()}
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 800 }}>{r.pet_name || r.pet_type || "Pet"}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{r.city}{r.state ? ", " + r.state : ""}</div>
                          <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>Last seen: {r.city}{r.state ? ", " + r.state : ""}</div>
                          {activityExpanded === `lost-${r.id}` && (
                            <div style={{ fontSize: 12, color: "#374151", marginTop: 6 }}>
                              {r.pet_name && (
                                <div>
                                  <strong>Pet name:</strong> {r.pet_name}
                                </div>
                              )}
                              <div>
                                <strong>Pet type:</strong> {r.pet_type}
                              </div>
                              {r.breed && (
                                <div>
                                  <strong>Breed:</strong> {r.breed}
                                </div>
                              )}
                              {r.color && (
                                <div>
                                  <strong>Color:</strong> {r.color}
                                </div>
                              )}
                              {r.weight && (
                                <div>
                                  <strong>Weight:</strong> {r.weight}
                                </div>
                              )}
                              {r.vaccinated && (
                                <div>
                                  <strong>Vaccinated:</strong> {r.vaccinated}
                                </div>
                              )}
                              {r.age && (
                                <div>
                                  <strong>Age:</strong> {r.age}
                                </div>
                              )}
                              {r.pincode && (
                                <div>
                                  <strong>Pincode:</strong> {r.pincode}
                                </div>
                              )}
                              {r.location_url && (
                                <div>
                                  <strong>Location:</strong>{" "}
                                  <a
                                    href={String(r.location_url).startsWith("http")
                                      ? String(r.location_url)
                                      : `https://www.google.com/maps?q=${encodeURIComponent(String(r.location_url))}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: "#2563eb" }}
                                  >
                                    Open in Google Maps
                                  </a>
                                </div>
                              )}
                              <div>
                                <strong>Description:</strong> {r.description || "No additional details"}
                              </div>
                            </div>
                          )}
                        </div>
                        <div style={{ alignSelf: "center", color: "#64748b", fontSize: 12 }}>
                          {new Date(r.created_at).toLocaleString()}
                          {r.lost_time && (
                            <div style={{ marginTop: 4 }}>
                              Lost time: {new Date(r.lost_time).toLocaleString()}
                            </div>
                          )}
                          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                            <button
                              onClick={() =>
                                navigate(`/user/lost/${r.id}?mode=view`)
                              }
                              style={{
                                padding: "6px 12px",
                                borderRadius: 999,
                                border: "1px solid #4b5563",
                                background: "#111827",
                                color: "#f9fafb",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: 12,
                              }}
                            >
                              View Details
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/user/lost/${r.id}?mode=edit`)
                              }
                              style={{
                                padding: "6px 12px",
                                borderRadius: 999,
                                border: "1px solid #1d4ed8",
                                background: "#2563eb",
                                color: "white",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: 12,
                              }}
                            >
                              Update
                            </button>
                          </div>
                        </div>
                        </div>
                      ))
                        )}
                      </>
                    )}

                    {/* Found reports section (respect category filter) */}
                    {(selectedCategory === "All pets" ||
                      selectedCategory === "Found pet") && (
                      <>
                        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>
                          Found Pet Reports
                        </div>
                        {activityFoundFiltered.length === 0 ? (
                          <div style={{ padding: 12, color: "#64748b" }}>
                            No found reports yet.
                          </div>
                        ) : (
                          activityFoundFiltered.map((r: any) => (
                        <div key={`found-${r.id}`} style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 16, padding: 16, display: "grid", gridTemplateColumns: "100px 1fr auto", gap: 16 }}>
                          {(() => {
                            const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "/api";
                            const origin = /^https?:/.test(apiBase) ? new URL(apiBase).origin : "http://localhost:8000";
                            const raw = r.photo_url || r.photo;
                            const src = raw ? (String(raw).startsWith("http") ? String(raw) : (String(raw).startsWith("/") ? origin + String(raw) : origin + "/media/" + String(raw))) : null;
                            return src ? (
                              <img src={src} alt={r.pet_type || r.pet_name || "Pet"} style={{ width: 100, height: 100, borderRadius: 12, objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: 100, height: 100, borderRadius: 12, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>🐾</div>
                            );
                          })()}
                          <div>
                            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                              <span style={{ padding: "2px 8px", borderRadius: 999, background: "#dbeafe", color: "#1d4ed8", fontSize: 12, fontWeight: 800 }}>FOUND</span>
                              {(() => {
                                const badge = getStatusBadge(r.status);
                                return (
                                  <span
                                    style={{
                                      padding: "2px 10px",
                                      borderRadius: 999,
                                      background: badge.bg,
                                      color: badge.color,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <span>{badge.icon}</span>
                                    <span>{badge.text}</span>
                                  </span>
                                );
                              })()}
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 800 }}>{r.pet_type || r.pet_name || "Pet"}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{r.found_city}{r.state ? ", " + r.state : ""}</div>
                          <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>Last seen: {r.found_city}{r.state ? ", " + r.state : ""}</div>
                          {activityExpanded === `found-${r.id}` && (
                            <div style={{ fontSize: 12, color: "#374151", marginTop: 6 }}>
                              <div>
                                <strong>Pet type:</strong> {r.pet_type}
                              </div>
                              {r.breed && (
                                <div>
                                  <strong>Breed:</strong> {r.breed}
                                </div>
                              )}
                              {r.color && (
                                <div>
                                  <strong>Color:</strong> {r.color}
                                </div>
                              )}
                              {r.estimated_age && (
                                <div>
                                  <strong>Estimated age:</strong> {r.estimated_age}
                                </div>
                              )}
                              {r.weight && (
                                <div>
                                  <strong>Weight:</strong> {r.weight}
                                </div>
                              )}
                              {r.pincode && (
                                <div>
                                  <strong>Pincode:</strong> {r.pincode}
                                </div>
                              )}
                              <div>
                                <strong>Description:</strong> {r.description || "No additional details"}
                              </div>
                            </div>
                          )}
                        </div>
                        <div style={{ alignSelf: "center", color: "#64748b", fontSize: 12 }}>
                          {new Date(r.created_at).toLocaleString()}
                          {r.found_time && (
                            <div style={{ marginTop: 4 }}>
                              Found time: {new Date(r.found_time).toLocaleString()}
                            </div>
                          )}
                          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                            <button
                              onClick={() =>
                                navigate(`/user/found/${r.id}`, {
                                  state: { report: r },
                                })
                              }
                              style={{
                                padding: "6px 12px",
                                borderRadius: 999,
                                border: "1px solid #4b5563",
                                background: "#111827",
                                color: "#f9fafb",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: 12,
                              }}
                            >
                              View Details
                            </button>
                            <button
                              onClick={async () => {
                                const current = r.description || "";
                                const next = window.prompt(
                                  "Update description for this found pet report",
                                  current,
                                );
                                if (next == null || next === current) return;
                                setUpdatingReportId(`found-${r.id}`);
                                try {
                                  const res = await updateMyFoundReport(r.id, {
                                    description: next,
                                  });
                                  if (res.ok) {
                                    const refreshed = await fetchMyActivity();
                                    if (refreshed.ok) setActivity(refreshed.data);
                                  } else {
                                    alert(res.error || "Failed to update report");
                                  }
                                } finally {
                                  setUpdatingReportId(null);
                                }
                              }}
                              disabled={updatingReportId === `found-${r.id}`}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 999,
                                border: "1px solid #1d4ed8",
                                background:
                                  updatingReportId === `found-${r.id}`
                                    ? "#bfdbfe"
                                    : "#2563eb",
                                color: "white",
                                cursor:
                                  updatingReportId === `found-${r.id}`
                                    ? "not-allowed"
                                    : "pointer",
                                fontWeight: 600,
                                fontSize: 12,
                              }}
                            >
                              {updatingReportId === `found-${r.id}`
                                ? "Saving..."
                                : "Update"}
                            </button>
                          </div>
                        </div>
                        </div>
                      ))
                        )}
                      </>
                    )}

                    {/* Adoption section (respect category filter) */}
                    {(selectedCategory === "All pets" ||
                      selectedCategory === "Adoption pet") && (
                      <>
                        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>
                          Adoption Requests
                        </div>
                        {activityAdoptionsFiltered.length === 0 ? (
                          <div style={{ padding: 12, color: "#64748b" }}>
                            No adoption requests yet.
                          </div>
                        ) : (
                          activityAdoptionsFiltered.map((a: any) => (
                        <div key={`adopt-${a.id}`} style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 16, padding: 16, display: "grid", gridTemplateColumns: "100px 1fr auto", gap: 16 }}>
                          {(() => {
                            const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "/api";
                            const origin = /^https?:/.test(apiBase) ? new URL(apiBase).origin : "http://localhost:8000";
                            const raw = a.pet?.photos;
                            const src = raw ? (String(raw).startsWith("http") ? String(raw) : (String(raw).startsWith("/") ? origin + String(raw) : origin + "/media/" + String(raw))) : null;
                            return src ? (
                              <img src={src} alt={a.pet?.name || "Pet"} style={{ width: 100, height: 100, borderRadius: 12, objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: 100, height: 100, borderRadius: 12, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>🐾</div>
                            );
                          })()}
                          <div>
                            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                              <span style={{ padding: "2px 8px", borderRadius: 999, background: "#ede9fe", color: "#6d28d9", fontSize: 12, fontWeight: 800 }}>ADOPTION</span>
                              {(() => {
                                const badge = getStatusBadge(a.status);
                                return (
                                  <span
                                    style={{
                                      padding: "2px 10px",
                                      borderRadius: 999,
                                      background: badge.bg,
                                      color: badge.color,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <span>{badge.icon}</span>
                                    <span>{badge.text}</span>
                                  </span>
                                );
                              })()}
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 800 }}>{a.pet?.name || "Pet"}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{a.pet?.location_city}{a.pet?.location_state ? ", " + a.pet?.location_state : ""}</div>
                          {activityExpanded === `adopt-${a.id}` && (
                            <div style={{ fontSize: 12, color: "#374151", marginTop: 6 }}>{a.pet?.description || "No additional details"}</div>
                          )}
                        </div>
                        <div style={{ alignSelf: "center", color: "#64748b", fontSize: 12 }}>
                          {new Date(a.created_at).toLocaleString()}
                          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                            <button onClick={() => setActivityExpanded(activityExpanded === `adopt-${a.id}` ? null : `adopt-${a.id}`)} style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer" }}>View Details</button>
                            <button onClick={() => navigate("/user/profile")} style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid #e5e7eb", background: "#eef2ff", cursor: "pointer" }}>Update</button>
                          </div>
                        </div>
                        </div>
                      ))
                        )}
                      </>
                    )}
                    
                    {/* My Chat Requests section */}
                    <div style={{ fontSize: 18, fontWeight: 800, marginTop: 16 }}>
                      My Chat Requests
                    </div>
                    {chatRequestsLoading ? (
                      <div style={{ padding: 12, color: "#64748b" }}>
                        Loading chat requests...
                      </div>
                    ) : chatRequests.length === 0 ? (
                      <div style={{ padding: 12, color: "#64748b" }}>
                        No pending chat requests.
                      </div>
                    ) : (
                      chatRequests.map((req: any) => {
                        const isExpanded = activityExpanded === `chat-req-${req.id}`;
                        return (
                          <div
                            key={`chat-req-${req.id}`}
                            style={{
                              background: "white",
                              border: "1px solid #f1f5f9",
                              borderRadius: 16,
                              padding: 16,
                              display: "flex",
                              flexDirection: "column",
                              gap: 12,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                              <div
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: "50%",
                                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontWeight: 700,
                                  fontSize: 20,
                                }}
                              >
                                💬
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                                  <span
                                    style={{
                                      padding: "2px 8px",
                                      borderRadius: 999,
                                      background: "#fef3c7",
                                      color: "#92400e",
                                      fontSize: 12,
                                      fontWeight: 800,
                                    }}
                                  >
                                    PENDING
                                  </span>
                                  {req.pet_kind && (
                                    <span
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background: req.pet_kind === "found" ? "#dbeafe" : "#fee2e2",
                                        color: req.pet_kind === "found" ? "#1e40af" : "#991b1b",
                                        fontSize: 12,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {req.pet_kind.toUpperCase()} PET
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 800 }}>
                                  Chat Request - {req.pet_name || req.pet_unique_id || `Pet #${req.pet_id}`}
                                </div>
                                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                                  {req.topic || "Waiting for admin approval"}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-end",
                                  gap: 8,
                                }}
                              >
                                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                                  {req.created_at
                                    ? new Date(req.created_at).toLocaleString()
                                    : ""}
                                </div>
                                <button
                                  onClick={() => {
                                    setActivityExpanded(isExpanded ? null : `chat-req-${req.id}`);
                                  }}
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: 999,
                                    border: "1px solid #e5e7eb",
                                    background: "#eef2ff",
                                    color: "#4f46e5",
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontWeight: 600,
                                  }}
                                >
                                  {isExpanded ? "Hide Details" : "View Request"}
                                </button>
                              </div>
                            </div>
                            
                            {/* Expanded Details */}
                            {isExpanded && (
                              <div
                                style={{
                                  marginTop: 8,
                                  padding: 12,
                                  background: "#f9fafb",
                                  borderRadius: 12,
                                  fontSize: 12,
                                  color: "#374151",
                                }}
                              >
                                <div style={{ fontWeight: 700, marginBottom: 8, color: "#0f172a" }}>
                                  Request Details
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  {req.pet_unique_id && (
                                    <div>
                                      <strong>Pet ID:</strong> {req.pet_unique_id}
                                    </div>
                                  )}
                                  {req.pet_name && (
                                    <div>
                                      <strong>Pet Name:</strong> {req.pet_name}
                                    </div>
                                  )}
                                  {req.pet_kind && (
                                    <div>
                                      <strong>Pet Type:</strong> {req.pet_kind === "found" ? "Found Pet" : "Lost Pet"}
                                    </div>
                                  )}
                                  {req.status && (
                                    <div>
                                      <strong>Status:</strong> {req.status}
                                    </div>
                                  )}
                                  {req.created_at && (
                                    <div>
                                      <strong>Requested On:</strong> {new Date(req.created_at).toLocaleString()}
                                    </div>
                                  )}
                                  {req.updated_at && (
                                    <div>
                                      <strong>Last Updated:</strong> {new Date(req.updated_at).toLocaleString()}
                                    </div>
                                  )}
                                  {req.last_message_preview && (
                                    <div>
                                      <strong>Your Message:</strong>
                                      <div
                                        style={{
                                          marginTop: 4,
                                          padding: 8,
                                          background: "#ffffff",
                                          borderRadius: 8,
                                          fontStyle: "italic",
                                        }}
                                      >
                                        "{req.last_message_preview}"
                                      </div>
                                    </div>
                                  )}
                                  {req.topic && (
                                    <div>
                                      <strong>Topic:</strong> {req.topic}
                                    </div>
                                  )}
                                </div>
                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
                                  <button
                                    onClick={() => setPageTab("chat")}
                                    style={{
                                      padding: "8px 16px",
                                      borderRadius: 999,
                                      border: "none",
                                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                      color: "white",
                                      cursor: "pointer",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      width: "100%",
                                    }}
                                  >
                                    Go to Chat
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </>
                )}
              </div>
            ) : petsLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: "rgba(15,23,42,0.6)",
                }}
              >
                Loading pets...
              </div>
            ) : filteredPets.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 16,
                  width: "100%",
                }}
              >
                {filteredPets.map((pet) => (
                  <div
                    key={`${pet.petCategory}-${pet.id}`}
                    style={{
                      border: `2px solid ${pet.petCategory === "lost" ? "rgba(220,38,38,0.3)" : "rgba(34,197,94,0.3)"}`,
                      borderRadius: 12,
                      padding: 16,
                      background:
                        pet.petCategory === "lost"
                          ? "rgba(254,242,242,0.8)"
                          : "rgba(240,253,244,0.8)",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = `0 12px 30px ${pet.petCategory === "lost" ? "rgba(220,38,38,0.15)" : "rgba(34,197,94,0.15)"}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Category Badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        padding: "4px 10px",
                        borderRadius: 12,
                        background:
                          pet.petCategory === "lost"
                            ? "#dc2626"
                            : pet.petCategory === "found"
                              ? "#1d4ed8"
                              : "#16a34a",
                        color: "white",
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      }}
                    >
                      {pet.petCategory === "lost"
                        ? "🚨 Lost"
                        : pet.petCategory === "found"
                          ? "FOUND"
                          : "🐾 Adoption"}
                    </div>

                    {/* Pet Image */}
                    {pet.photo && (
                      <div
                        style={{
                          marginBottom: 12,
                          borderRadius: 12,
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={pet.photo}
                          alt={pet.displayName}
                          style={{
                            width: "100%",
                            height: 200,
                            objectFit: "cover",
                            objectPosition: "center top",
                          }}
                        />
                      </div>
                    )}

                    {/* Pet Info */}
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: 12,
                        color: "#111827",
                        marginBottom: 6,
                        textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}
                    >
                      {pet.displayName}
                    </div>

                    <div
                      style={{
                        color: "rgba(15,23,42,0.9)",
                        marginBottom: 4,
                        fontSize: 16,
                      }}
                    >
                      <strong>{pet.breed || "Mixed Breed"}</strong>
                    </div>

                    <div
                      style={{
                        color: "#374151",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    >
                      <span>📍</span> {pet.location}
                    </div>

                    {(pet.age || pet.estimated_age) && (
                      <div
                        style={{
                          color: "#374151",
                          marginBottom: 8,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        <span>🎂</span> {pet.age || pet.estimated_age}
                      </div>
                    )}

                    {pet.color && (
                      <div
                        style={{
                          color: "#374151",
                          marginBottom: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        <span>🎨</span> {pet.color}
                      </div>
                    )}

                    <div
                      style={{
                        color: "#4b5563",
                        fontSize: 13,
                        lineHeight: 1.5,
                        marginBottom: 12,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        fontWeight: 500,
                      }}
                    >
                      {pet.description}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                        marginBottom: 12,
                        fontWeight: 600,
                      }}
                    >
                      {pet.petCategory === "lost"
                        ? "Reported"
                        : pet.petCategory === "found"
                          ? "Found"
                          : "Listed"}
                      : {new Date(pet.created_at).toLocaleDateString()}
                    </div>

                    <button
                      onClick={() => {
                        if (pet.petCategory === "lost") {
                          navigate(`/user/lost/${pet.id}?mode=view`, {
                            state: { from: "home" },
                          });
                        } else if (pet.petCategory === "found") {
                          navigate(`/user/found/${pet.id}`, {
                            state: { report: pet, from: "home" },
                          });
                        } else if (pet.petCategory === "adoption") {
                          navigate(`/pets/${pet.id}`);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 8,
                        border: "none",
                        background:
                          pet.petCategory === "lost"
                            ? "linear-gradient(135deg, #dc2626, #ef4444)"
                            : pet.petCategory === "found"
                              ? "linear-gradient(135deg, #1d4ed8, #3b82f6)"
                              : "linear-gradient(135deg, #8b5cf6, #a855f7)",
                        color: "white",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      View pet details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: "rgba(15,23,42,0.6)",
                }}
              >
                No pets found matching your criteria
              </div>
            )}
          </div>
          )}

          {/* Standalone Chat page content */}
          {pageTab === "chat" && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                paddingTop: 8,
              }}
            >
              <RoomsPage embedded />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
