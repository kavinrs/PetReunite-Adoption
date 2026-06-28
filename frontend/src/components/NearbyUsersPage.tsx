
import React, { useEffect, useState } from "react";
import { fetchNearbyUsers, getProfile, updateProfile, sendDirectChatRequest } from "../services/api";

interface NearbyUser {
  user_unique_id: string;
  user_id: number;
  full_name: string;
  username: string;
  city: string;
  state: string;
  profile_photo: string | null;
  distance_km: number;
  role: string;
}

interface NearbyUsersData {
  count: number;
  radius_km: number;
  your_location: {
    city: string;
    state: string;
    latitude: number;
    longitude: number;
  };
  nearby_users: NearbyUser[];
}

export default function NearbyUsersPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<NearbyUsersData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [profile, setProfile] = useState<any>(null);
  const [showLocationSetup, setShowLocationSetup] = useState(false);
  const [locationForm, setLocationForm] = useState({
    searchLocation: "",
  });
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  
  
  const [searchLocation, setSearchLocation] = useState<{lat: number, lon: number, label: string} | null>(null);
  const [showSearchLocationInput, setShowSearchLocationInput] = useState(false);
  
  
  const [showChatRequestModal, setShowChatRequestModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [chatReason, setChatReason] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  const loadProfile = async () => {
    const res = await getProfile();
    if (res.ok) {
      setProfile(res.data);
      return res.data;
    }
    return null;
  };

  const loadNearbyUsers = async (customLat?: number, customLon?: number) => {
    setLoading(true);
    setError(null);
    const res = await fetchNearbyUsers(radiusKm, customLat, customLon);
    if (res.ok) {
      setData(res.data);
      setError(null);
    } else {
      setError(res.error || "Failed to load nearby users");
      setData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const profileData = await loadProfile();
      if (profileData && profileData.latitude && profileData.longitude) {
        loadNearbyUsers();
      } else {
        setLoading(false);
        setShowLocationSetup(true);
      }
    };
    init();
  }, []);

  const handleRadiusChange = (newRadius: number) => {
    setRadiusKm(newRadius);
  };

  const handleSearch = () => {
    
    if (searchLocation) {
      loadNearbyUsers(searchLocation.lat, searchLocation.lon);
    } else {
      loadNearbyUsers();
    }
  };

  const handleSearchFromCurrentLocation = () => {
    if (navigator.geolocation) {
      setGeocoding(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          setSearchLocation({ lat, lon, label: "Current GPS Location" });
          setGeocoding(false);
          setShowSearchLocationInput(false);
          
          
          loadNearbyUsers(lat, lon);
        },
        (error) => {
          setGeocoding(false);
          alert("Error getting location: " + error.message);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  const handleSearchFromCustomLocation = async () => {
    const locationName = locationForm.searchLocation.trim();

    if (!locationName) {
      setGeocodeError("Please enter a city or location name");
      return;
    }

    setGeocoding(true);
    setGeocodeError(null);

    const coords = await geocodeLocation(locationName);
    
    setGeocoding(false);

    if (!coords) {
      setGeocodeError("Location not found. Please try a different city name or be more specific (e.g., 'Chennai, Tamil Nadu, India')");
      return;
    }

    setSearchLocation({ lat: coords.lat, lon: coords.lon, label: locationName });
    setShowSearchLocationInput(false);
    setLocationForm({ searchLocation: "" });
    setGeocodeError(null);
    
    
    loadNearbyUsers(coords.lat, coords.lon);
  };

  const handleResetToProfileLocation = () => {
    setSearchLocation(null);
    setShowSearchLocationInput(false);
    loadNearbyUsers();
  };

  const handleRequestChat = (user: NearbyUser) => {
    setSelectedUser(user);
    setShowChatRequestModal(true);
    setChatReason("");
  };

  const handleCloseChatRequestModal = () => {
    setShowChatRequestModal(false);
    setSelectedUser(null);
    setChatReason("");
  };

  const handleSendChatRequest = async () => {
    if (!selectedUser || !chatReason.trim()) {
      alert("Please enter a reason for your chat request");
      return;
    }

    if (chatReason.length > 500) {
      alert("Reason must be 500 characters or less");
      return;
    }

    setSendingRequest(true);

    console.log("Sending chat request to:", selectedUser.user_id, selectedUser.full_name);
    const result = await sendDirectChatRequest(selectedUser.user_id, chatReason.trim());
    console.log("Chat request result:", result);
    
    setSendingRequest(false);

    if (result.ok) {
      alert(`Chat request sent to ${selectedUser.full_name}! They will be notified.`);
      handleCloseChatRequestModal();
    } else {
      console.error("Failed to send chat request:", result.error);
      alert(result.error || "Failed to send chat request");
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setUpdatingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          
          const res = await updateProfile({
            latitude: lat,
            longitude: lon,
          });
          setUpdatingLocation(false);

          if (res.ok) {
            setProfile(res.data);
            setShowLocationSetup(false);
            loadNearbyUsers();
          } else {
            alert("Failed to update location: " + (res.error || "Unknown error"));
          }
        },
        (error) => {
          setUpdatingLocation(false);
          alert("Error getting location: " + error.message);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  const geocodeLocation = async (locationName: string): Promise<{lat: number, lon: number} | null> => {
    try {
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'PetReunite-App/1.0'
          }
        }
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }
      
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  const handleUpdateLocation = async () => {
    const locationName = locationForm.searchLocation.trim();

    if (!locationName) {
      setGeocodeError("Please enter a city or location name");
      return;
    }

    setGeocoding(true);
    setGeocodeError(null);

    
    const coords = await geocodeLocation(locationName);
    
    setGeocoding(false);

    if (!coords) {
      setGeocodeError("Location not found. Please try a different city name or be more specific (e.g., 'Chennai, Tamil Nadu, India')");
      return;
    }

    setUpdatingLocation(true);
    const res = await updateProfile({
      latitude: coords.lat,
      longitude: coords.lon,
    });
    setUpdatingLocation(false);

    if (res.ok) {
      setProfile(res.data);
      setShowLocationSetup(false);
      loadNearbyUsers();
    } else {
      alert("Failed to update location: " + (res.error || "Unknown error"));
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "owner":
        return "#3b82f6";
      case "finder":
        return "#10b981";
      case "staff":
        return "#8b5cf6";
      case "admin":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role.toLowerCase()) {
      case "owner":
        return "Pet Owner";
      case "finder":
        return "Pet Finder";
      case "staff":
        return "Shelter Staff";
      case "admin":
        return "Admin";
      default:
        return role;
    }
  };

  if (showLocationSetup) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "40px auto",
          padding: 32,
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📍</div>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
            Set Your Location
          </h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            To find nearby users, we need to know your city or location
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <button
            onClick={handleGetCurrentLocation}
            disabled={updatingLocation}
            style={{
              width: "100%",
              padding: 16,
              background: updatingLocation ? "#94a3b8" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: updatingLocation ? "not-allowed" : "pointer",
              marginBottom: 16,
            }}
          >
            {updatingLocation ? "Getting Location..." : "📍 Use My Current Location"}
          </button>

          <div style={{ textAlign: "center", margin: "16px 0", color: "#94a3b8" }}>
            or search by location
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
                color: "#334155",
              }}
            >
              City or Location Name
            </label>
            <input
              type="text"
              value={locationForm.searchLocation}
              onChange={(e) => {
                setLocationForm({ searchLocation: e.target.value });
                setGeocodeError(null);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateLocation();
                }
              }}
              placeholder="e.g., Chennai, Tamil Nadu or Mumbai, India"
              style={{
                width: "100%",
                padding: 12,
                border: geocodeError ? "2px solid #ef4444" : "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
            {geocodeError && (
              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  background: "#fef2f2",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#dc2626",
                }}
              >
                ⚠️ {geocodeError}
              </div>
            )}
          </div>

          <button
            onClick={handleUpdateLocation}
            disabled={updatingLocation || geocoding}
            style={{
              width: "100%",
              padding: 16,
              background: (updatingLocation || geocoding) ? "#94a3b8" : "#10b981",
              color: "#ffffff",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: (updatingLocation || geocoding) ? "not-allowed" : "pointer",
            }}
          >
            {geocoding ? "🔍 Finding Location..." : updatingLocation ? "Saving..." : "Save Location & Continue"}
          </button>
        </div>

        <div
          style={{
            padding: 16,
            background: "#f0f9ff",
            borderRadius: 8,
            fontSize: 13,
            color: "#0369a1",
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>💡 Tips:</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Be specific: Include city and state/country (e.g., "Chennai, Tamil Nadu")</li>
            <li>Or use "Use My Current Location" for instant GPS detection</li>
            <li>You can update your location anytime from the Nearby Users page</li>
          </ul>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
          fontSize: 18,
          color: "#64748b",
        }}
      >
        Loading nearby users...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "40px auto",
          padding: 32,
          background: "#fef2f2",
          borderRadius: 16,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: "#dc2626", marginBottom: 8 }}>
          {error}
        </h3>
        <button
          onClick={() => setShowLocationSetup(true)}
          style={{
            marginTop: 16,
            padding: "12px 24px",
            background: "#3b82f6",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Update Location
        </button>
      </div>
    );
  }

  return (
    <>
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
      {}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: 16,
          padding: 32,
          marginBottom: 32,
          color: "#ffffff",
        }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          📍 Nearby Users
        </h1>
        <p style={{ fontSize: 16, opacity: 0.9 }}>
          Find pet lovers and helpers near you
        </p>
      </div>

      {}
      {profile && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ marginBottom: searchLocation ? 16 : 0 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Your Profile Location
            </h3>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 12 }}>
              {profile.city}, {profile.state}
            </p>
            <button
              onClick={() => setShowLocationSetup(true)}
              style={{
                padding: "8px 16px",
                background: "#f1f5f9",
                color: "#475569",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Update Profile Location
            </button>
          </div>

          {searchLocation && (
            <div style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid #e2e8f0",
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#10b981" }}>
                🔍 Searching From
              </h3>
              <p style={{ color: "#64748b", fontSize: 14, marginBottom: 12 }}>
                {searchLocation.label}
              </p>
              <button
                onClick={handleResetToProfileLocation}
                style={{
                  padding: "8px 16px",
                  background: "#fef3c7",
                  color: "#f59e0b",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ← Reset to Profile Location
              </button>
            </div>
          )}
        </div>
      )}

      {}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
                color: "#334155",
              }}
            >
              Search Radius
            </label>
            <select
              value={radiusKm}
              onChange={(e) => handleRadiusChange(Number(e.target.value))}
              style={{
                width: "100%",
                padding: 12,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={15}>15 km</option>
              <option value={20}>20 km</option>
              <option value={30}>30 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: "12px 32px",
              background: loading ? "#94a3b8" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 20,
            }}
          >
            {loading ? "Searching..." : "🔍 Search"}
          </button>
        </div>

        {}
        {!showSearchLocationInput && (
          <button
            onClick={() => setShowSearchLocationInput(true)}
            style={{
              padding: "10px 16px",
              background: "#f0f9ff",
              color: "#0369a1",
              border: "1px solid #bae6fd",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
            }}
          >
            📍 Search from a different location
          </button>
        )}

        {showSearchLocationInput && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: "#f8fafc",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
            }}
          >
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#334155" }}>
              Search from a different location (temporary)
            </h4>

            <button
              onClick={handleSearchFromCurrentLocation}
              disabled={geocoding}
              style={{
                width: "100%",
                padding: 12,
                background: geocoding ? "#94a3b8" : "#10b981",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: geocoding ? "not-allowed" : "pointer",
                marginBottom: 12,
              }}
            >
              {geocoding ? "Getting Location..." : "📍 Use Current GPS Location"}
            </button>

            <div style={{ textAlign: "center", margin: "12px 0", color: "#94a3b8", fontSize: 13 }}>
              or
            </div>

            <input
              type="text"
              value={locationForm.searchLocation}
              onChange={(e) => {
                setLocationForm({ searchLocation: e.target.value });
                setGeocodeError(null);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearchFromCustomLocation();
                }
              }}
              placeholder="e.g., Mumbai, India"
              style={{
                width: "100%",
                padding: 10,
                border: geocodeError ? "2px solid #ef4444" : "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 13,
                boxSizing: "border-box",
                marginBottom: 8,
                outline: "none",
              }}
            />

            {geocodeError && (
              <div
                style={{
                  marginBottom: 8,
                  padding: 8,
                  background: "#fef2f2",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#dc2626",
                }}
              >
                ⚠️ {geocodeError}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleSearchFromCustomLocation}
                disabled={geocoding}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  background: geocoding ? "#94a3b8" : "#3b82f6",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: geocoding ? "not-allowed" : "pointer",
                }}
              >
                {geocoding ? "Finding..." : "Search Here"}
              </button>
              <button
                onClick={() => {
                  setShowSearchLocationInput(false);
                  setLocationForm({ searchLocation: "" });
                  setGeocodeError(null);
                }}
                style={{
                  padding: "10px 16px",
                  background: "#f1f5f9",
                  color: "#64748b",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>

            <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>
              💡 This won't update your profile location
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: 16, color: "#64748b", fontSize: 14 }}>
        Found {data?.count || 0} user(s) within {data?.radius_km || radiusKm} km
      </div>

      {/* Users Grid */}
      {data && data.nearby_users.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 24,
          }}
        >
          {data.nearby_users.map((user) => (
            <div
              key={user.user_unique_id}
              style={{
                background: "#ffffff",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              }}
            >
              {/* Profile Photo */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: user.profile_photo
                    ? `url(${user.profile_photo})`
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  color: "#ffffff",
                }}
              >
                {!user.profile_photo && "👤"}
              </div>

              {/* User Info */}
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  textAlign: "center",
                  marginBottom: 4,
                  color: "#0f172a",
                }}
              >
                {user.full_name || user.username}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                @{user.username}
              </p>

              {/* Role Badge */}
              <div
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  background: `${getRoleColor(user.role)}15`,
                  color: getRoleColor(user.role),
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 12,
                  width: "100%",
                  textAlign: "center",
                }}
              >
                {getRoleLabel(user.role)}
              </div>

              {/* Location */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                  fontSize: 14,
                  color: "#64748b",
                }}
              >
                <span>📍</span>
                <span>
                  {user.city}, {user.state}
                </span>
              </div>

              {/* Distance */}
              {user.distance_km > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: 12,
                    background: "#f8fafc",
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#3b82f6",
                    marginBottom: 12,
                  }}
                >
                  <span>🚶</span>
                  <span>{user.distance_km} km away</span>
                </div>
              )}

              {/* Request to Chat Button */}
              <button
                onClick={() => handleRequestChat(user)}
                style={{
                  width: "100%",
                  padding: 12,
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                💬 Request to Chat
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            background: "#ffffff",
            borderRadius: 16,
            color: "#64748b",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            No users found nearby
          </h3>
          <p style={{ fontSize: 14 }}>
            Try increasing the search radius or check back later
          </p>
        </div>
      )}
    </div>

    {/* Chat Request Modal */}
    {showChatRequestModal && selectedUser && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20,
        }}
        onClick={handleCloseChatRequestModal}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: 32,
            maxWidth: 500,
            width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
            💬 Request to Chat
          </h2>
          
          <div
            style={{
              padding: 16,
              background: "#f8fafc",
              borderRadius: 12,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: selectedUser.profile_photo
                  ? `url(${selectedUser.profile_photo})`
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                color: "#ffffff",
              }}
            >
              {!selectedUser.profile_photo && "👤"}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {selectedUser.full_name}
              </div>
              <div style={{ color: "#64748b", fontSize: 14 }}>
                @{selectedUser.username}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 8,
                color: "#334155",
              }}
            >
              Why do you want to chat? <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <textarea
              value={chatReason}
              onChange={(e) => setChatReason(e.target.value)}
              placeholder="e.g., I saw you have a similar pet breed and would love to exchange tips..."
              maxLength={500}
              rows={4}
              style={{
                width: "100%",
                padding: 12,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
            <div
              style={{
                fontSize: 12,
                color: "#94a3b8",
                marginTop: 4,
                textAlign: "right",
              }}
            >
              {chatReason.length}/500 characters
            </div>
          </div>

          <div
            style={{
              padding: 12,
              background: "#f0f9ff",
              borderRadius: 8,
              fontSize: 13,
              color: "#0369a1",
              marginBottom: 24,
            }}
          >
            💡 {selectedUser.full_name} will receive a notification and can accept or decline your request.
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleCloseChatRequestModal}
              disabled={sendingRequest}
              style={{
                flex: 1,
                padding: 14,
                background: "#f1f5f9",
                color: "#475569",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: sendingRequest ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSendChatRequest}
              disabled={!chatReason.trim() || sendingRequest}
              style={{
                flex: 1,
                padding: 14,
                background:
                  !chatReason.trim() || sendingRequest
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor:
                  !chatReason.trim() || sendingRequest ? "not-allowed" : "pointer",
              }}
            >
              {sendingRequest ? "Sending..." : "Send Request"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
