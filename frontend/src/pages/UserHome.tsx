// src/pages/UserHome.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  getProfile,
  clearTokens,
  fetchPublicLostPets,
  fetchPublicFoundPets,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";

type Tab = "owner" | "rescuer" | "adopter";

export default function UserHome() {
  // Apply viewport standardization to ensure consistent 100% scaling
  useViewportStandardization();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("owner");
  const [allPets, setAllPets] = useState<any[]>([]);
  const [filteredPets, setFilteredPets] = useState<any[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("All Species");
  const [selectedAge, setSelectedAge] = useState("All Ages");
  const [sortBy, setSortBy] = useState("Most Recent");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    let mounted = true;
    async function loadPets() {
      setPetsLoading(true);
      try {
        const [lostRes, foundRes] = await Promise.all([
          fetchPublicLostPets(),
          fetchPublicFoundPets(),
        ]);

        if (!mounted) return;

        let combinedPets = [];
        if (lostRes.ok) {
          const lostPets = lostRes.data.map((pet: any, index: number) => ({
            ...pet,
            petCategory: "lost",
            displayName: pet.pet_name || `${pet.pet_type}`,
            location: `${pet.city}, ${pet.state}`,
            photo: pet.photo
              ? `/${pet.photo}`
              : getSamplePetImage(pet.pet_type, index),
          }));
          combinedPets.push(...lostPets);
        }
        if (foundRes.ok) {
          const foundPets = foundRes.data.map((pet: any, index: number) => ({
            ...pet,
            petCategory: "found",
            displayName: `Found ${pet.pet_type}`,
            location: `${pet.found_city}, ${pet.state}`,
            photo: pet.photo
              ? `/${pet.photo}`
              : getSamplePetImage(pet.pet_type, index + 10),
          }));
          combinedPets.push(...foundPets);
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

    // Age filter
    if (selectedAge !== "All Ages") {
      filtered = filtered.filter((pet) => {
        const age = pet.age || pet.estimated_age || "";
        if (selectedAge === "Baby" && age.includes("months")) return true;
        if (
          selectedAge === "Adult" &&
          age.includes("year") &&
          !age.includes("5")
        )
          return true;
        if (selectedAge === "Senior" && age.includes("5")) return true;
        return false;
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
  }, [allPets, searchQuery, selectedSpecies, selectedAge, sortBy]);

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

  if (loading) return <div style={{ padding: 40 }}>Loading home...</div>;

  const displayName =
    profile?.full_name ??
    profile?.username ??
    profile?.user?.username ??
    "User";
  const avatarUrl = profile?.profile_photo || "/profile-avatar.svg";
  const email = profile?.user?.email ?? profile?.email ?? "";

  const tabItems: { id: Tab; label: string }[] = [
    { id: "owner", label: "Pet Owner" },
    { id: "rescuer", label: "Pet Rescuer" },
    { id: "adopter", label: "Pet Adopter" },
  ];

  const sidebarLinks = [
    {
      label: "Dashboard",
      icon: "🗂",
      onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
      accent: true,
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
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#f6f7fb",
        fontFamily: "'Inter', sans-serif",
        color: "#0f172a",
      }}
    >
      <aside
        style={{
          width: sidebarOpen ? 380 : 0,
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          borderRight: "1px solid rgba(15,23,42,0.12)",
          padding: sidebarOpen ? 36 : 0,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 36,
          boxShadow: "6px 0 25px rgba(15,23,42,0.08)",
          transition: "all 0.3s ease",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ff8a00, #ff2fab)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 25px rgba(255,138,0,0.35)",
            }}
          >
            <span style={{ fontSize: 28, filter: "brightness(0) invert(1)" }}>
              🐾
            </span>
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 28, color: "#0f172a" }}>
              PawReunite
            </div>
            <div
              style={{
                fontSize: 14,
                color: "rgba(15,23,42,0.6)",
                fontWeight: 500,
              }}
            >
              Pet Rescue Platform
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sidebarLinks.map((link) => (
            <button
              key={link.label}
              onClick={link.onClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                fontWeight: link.accent ? 800 : 700,
                padding: "20px 24px",
                borderRadius: 24,
                cursor: "pointer",
                border: link.accent ? "none" : "2px solid rgba(15,23,42,0.1)",
                background: link.accent
                  ? "linear-gradient(135deg,#ff8a00,#ff2fab)"
                  : "rgba(15,23,42,0.03)",
                color: link.accent ? "white" : "#0f172a",
                fontSize: 18,
                textAlign: "left",
                boxShadow: link.accent
                  ? "0 15px 35px rgba(255,138,0,0.4)"
                  : "0 4px 12px rgba(15,23,42,0.1)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!link.accent) {
                  e.currentTarget.style.background = "rgba(15,23,42,0.08)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 18px rgba(15,23,42,0.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (!link.accent) {
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
                  fontSize: 24,
                  minWidth: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {link.icon}
              </span>
              {link.label}
            </button>
          ))}
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "36px 44px",
          boxSizing: "border-box",
          gap: 28,
          transition: "all 0.3s ease",
        }}
      >
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: "fixed",
            top: 20,
            left: sidebarOpen ? 360 : 20,
            zIndex: 1000,
            background: "linear-gradient(135deg, #ff8a00, #ff2fab)",
            border: "none",
            borderRadius: "50%",
            width: 56,
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 8px 20px rgba(255,138,0,0.35)",
            transition: "all 0.3s ease",
            color: "white",
            fontSize: 20,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow =
              "0 12px 25px rgba(255,138,0,0.45)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(255,138,0,0.35)";
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
            <div style={{ fontSize: 30, fontWeight: 800 }}>Dashboard</div>
            <div style={{ color: "rgba(15,23,42,0.6)", marginTop: 4 }}>
              Manage your pet rescue activities
            </div>
          </div>

          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "white",
                borderRadius: 24,
                padding: "12px 20px",
                boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
                border: "2px solid rgba(15,23,42,0.08)",
                cursor: "pointer",
                minWidth: 300,
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
                  width: 56,
                  height: 56,
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
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                  style={{ fontWeight: 800, color: "#0f172a", fontSize: 18 }}
                >
                  {displayName}
                </span>
                <span
                  style={{
                    fontSize: 15,
                    color: "rgba(15,23,42,0.6)",
                    fontWeight: 500,
                  }}
                >
                  {email}
                </span>
              </div>
              <span style={{ fontSize: 20, color: "rgba(15,23,42,0.5)" }}>
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
                  width: 280,
                  background: "white",
                  borderRadius: 20,
                  boxShadow: "0 20px 50px rgba(15,23,42,0.25)",
                  padding: 20,
                  color: "#0f172a",
                  zIndex: 10,
                  border: "1px solid rgba(15,23,42,0.08)",
                }}
              >
                <div style={{ marginBottom: 16, textAlign: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>
                    {displayName}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "rgba(15,23,42,0.6)",
                      marginTop: 2,
                    }}
                  >
                    {email}
                  </div>
                </div>
                <div
                  style={{
                    height: 1,
                    background: "rgba(15,23,42,0.12)",
                    marginBottom: 16,
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
                    borderRadius: 16,
                    padding: "16px 16px",
                    cursor: "pointer",
                    fontWeight: 700,
                    marginBottom: 12,
                    fontSize: 16,
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
                    borderRadius: 16,
                    padding: "16px 16px",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: "#b91c1c",
                    fontSize: 16,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(248,113,113,0.25)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(248,113,113,0.15)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Find Your Perfect Pet Section */}
        <div
          style={{
            background: "white",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 24px 60px rgba(15,23,42,0.08)",
            border: "1px solid rgba(15,23,42,0.05)",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#0f172a",
                marginBottom: 8,
              }}
            >
              Discover Pets Looking for Loving Homes
            </div>
            <div style={{ color: "rgba(15,23,42,0.6)", fontSize: 16 }}>
              Discover pets ready for adoption and help lost pets find their way
              home
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{ marginBottom: 32 }}>
            {/* Search Bar */}
            <div style={{ marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Search by name or breed..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  borderRadius: 16,
                  border: "1px solid rgba(15,23,42,0.15)",
                  fontSize: 16,
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
                marginBottom: 20,
              }}
            >
              {/* Age Filter Buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                {["All Ages", "Baby", "Adult", "Senior"].map((age) => (
                  <button
                    key={age}
                    onClick={() => setSelectedAge(age)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 25,
                      border:
                        selectedAge === age
                          ? "2px solid #ff8a00"
                          : "1px solid rgba(15,23,42,0.15)",
                      background:
                        selectedAge === age ? "rgba(255,138,0,0.1)" : "white",
                      color:
                        selectedAge === age ? "#ff8a00" : "rgba(15,23,42,0.8)",
                      cursor: "pointer",
                      fontWeight: selectedAge === age ? 700 : 500,
                      fontSize: 14,
                    }}
                  >
                    {age}
                  </button>
                ))}
              </div>

              {/* Species Dropdown */}
              <select
                value={selectedSpecies}
                onChange={(e) => setSelectedSpecies(e.target.value)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(15,23,42,0.15)",
                  background: "white",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <option value="All Species">All Species</option>
                <option value="Dog">Dogs</option>
                <option value="Cat">Cats</option>
                <option value="Rabbit">Rabbits</option>
                <option value="Bird">Birds</option>
              </select>

              {/* Sort Dropdown */}
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 14, color: "rgba(15,23,42,0.6)" }}>
                  Sort by:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(15,23,42,0.15)",
                    background: "white",
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  <option value="Most Recent">Most Recent</option>
                  <option value="Alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div style={{ fontSize: 18, fontWeight: 600, color: "#0f172a" }}>
              {filteredPets.length} Pet{filteredPets.length !== 1 ? "s" : ""}{" "}
              Available
            </div>
          </div>

          {/* Pet Grid */}
          {petsLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: 60,
                color: "rgba(15,23,42,0.6)",
              }}
            >
              Loading pets...
            </div>
          ) : filteredPets.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 24,
              }}
            >
              {filteredPets.map((pet) => (
                <div
                  key={`${pet.petCategory}-${pet.id}`}
                  style={{
                    border: `2px solid ${pet.petCategory === "lost" ? "rgba(220,38,38,0.3)" : "rgba(34,197,94,0.3)"}`,
                    borderRadius: 20,
                    padding: 20,
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
                      padding: "6px 14px",
                      borderRadius: 20,
                      background:
                        pet.petCategory === "lost" ? "#dc2626" : "#16a34a",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    {pet.petCategory === "lost" ? "🚨 Lost" : "🐾 Adoption"}
                  </div>

                  {/* Pet Image */}
                  {pet.photo && (
                    <div
                      style={{
                        marginBottom: 16,
                        borderRadius: 16,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={pet.photo}
                        alt={pet.displayName}
                        style={{
                          width: "100%",
                          height: 220,
                          objectFit: "contain",
                          objectPosition: "center",
                          backgroundColor: "rgba(0, 0, 0, 0.05)",
                        }}
                      />
                    </div>
                  )}

                  {/* Pet Info */}
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 20,
                      color: "#111827",
                      marginBottom: 8,
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
                      fontSize: 15,
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
                        fontSize: 15,
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
                        fontSize: 15,
                      }}
                    >
                      <span>🎨</span> {pet.color}
                    </div>
                  )}

                  <div
                    style={{
                      color: "#4b5563",
                      fontSize: 15,
                      lineHeight: 1.5,
                      marginBottom: 16,
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
                      marginBottom: 16,
                      fontWeight: 600,
                    }}
                  >
                    {pet.petCategory === "lost" ? "Reported" : "Found"}:{" "}
                    {new Date(pet.created_at).toLocaleDateString()}
                  </div>

                  <button
                    onClick={() => {
                      if (pet.petCategory === "lost") {
                        navigate("/user/report-found");
                      } else {
                        // Handle contact functionality for found pets
                        console.log("Contact about pet:", pet.displayName);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 12,
                      border: "none",
                      background:
                        pet.petCategory === "lost"
                          ? "linear-gradient(135deg, #dc2626, #ef4444)"
                          : "linear-gradient(135deg, #16a34a, #22c55e)",
                      color: "white",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    {pet.petCategory === "lost"
                      ? "Help Find This Pet"
                      : "Contact About This Pet"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: 60,
                color: "rgba(15,23,42,0.6)",
              }}
            >
              No pets found matching your criteria
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
