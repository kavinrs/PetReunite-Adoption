import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useViewportStandardization } from "../hooks/useViewportStandardization";
import ChatWidget from "../components/ChatWidget";

interface AdoptionRequest {
  id: number;
  pet: {
    id: number;
    name: string;
    species: string;
    breed: string;
    photos: string;
    location_city: string;
    location_state: string;
  };
  phone: string;
  address: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export default function MyAdoptionRequests() {
  useViewportStandardization();

  const navigate = useNavigate();
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<{
    requestId: number;
    petName: string;
    status: "pending" | "approved" | "rejected";
  } | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("/api/pets/my-adoption-requests/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else if (response.status === 401) {
        navigate("/login");
      } else {
        setError("Failed to load adoption requests");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: { bg: "#fef3c7", text: "#d97706", border: "#f59e0b" },
      approved: { bg: "#d1fae5", text: "#065f46", border: "#10b981" },
      rejected: { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" },
    };

    const color = colors[status as keyof typeof colors] || colors.pending;

    return (
      <span
        style={{
          background: color.bg,
          color: color.text,
          border: `1px solid ${color.border}`,
          padding: "4px 12px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "700",
          textTransform: "uppercase",
        }}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f7fb",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          Loading your adoption requests...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f7fb",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "white",
          padding: "16px 24px",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => navigate("/user")}
            style={{
              background: "transparent",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            ← Back to Dashboard
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "18px",
              fontWeight: "700",
              color: "#0f172a",
            }}
          >
            🐾 PetReunite
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color: "#0f172a",
              margin: "0 0 8px 0",
            }}
          >
            My Adoption Requests
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#6b7280",
              margin: 0,
            }}
          >
            Track your adoption applications and chat with admins
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "24px",
            }}
          >
            {error}
          </div>
        )}

        {requests.length === 0 ? (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "60px 40px",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "24px" }}>🐾</div>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#0f172a",
                margin: "0 0 12px 0",
              }}
            >
              No Adoption Requests Yet
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "#6b7280",
                marginBottom: "32px",
              }}
            >
              When you apply for pet adoptions, they'll appear here
            </p>
            <button
              onClick={() => navigate("/user")}
              style={{
                background: "linear-gradient(135deg, #ff8a00, #ff2fab)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "16px",
              }}
            >
              Browse Pets
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "24px",
            }}
          >
            {requests.map((request) => (
              <div
                key={request.id}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "200px 1fr auto",
                    gap: "24px",
                    alignItems: "center",
                    padding: "24px",
                  }}
                >
                  {/* Pet Image */}
                  <div
                    style={{
                      width: "200px",
                      height: "150px",
                      background: `url(${request.pet.photos}) center/cover`,
                      borderRadius: "12px",
                    }}
                  />

                  {/* Request Details */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "20px",
                          fontWeight: "700",
                          color: "#0f172a",
                          margin: 0,
                        }}
                      >
                        {request.pet.name}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>

                    <p
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                        margin: "0 0 12px 0",
                      }}
                    >
                      {request.pet.species} • {request.pet.breed} •{" "}
                      {request.pet.location_city}, {request.pet.location_state}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                        fontSize: "14px",
                      }}
                    >
                      <div>
                        <span style={{ color: "#9ca3af", fontWeight: "600" }}>
                          Applied:
                        </span>{" "}
                        <span style={{ color: "#374151" }}>
                          {formatDate(request.created_at)}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "#9ca3af", fontWeight: "600" }}>
                          Updated:
                        </span>{" "}
                        <span style={{ color: "#374151" }}>
                          {formatDate(request.updated_at)}
                        </span>
                      </div>
                    </div>

                    {request.admin_notes && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "12px",
                          background: "#f9fafb",
                          borderRadius: "8px",
                          borderLeft: "3px solid #6366f1",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            fontWeight: "600",
                            marginBottom: "4px",
                          }}
                        >
                          ADMIN NOTES:
                        </div>
                        <div style={{ fontSize: "14px", color: "#374151" }}>
                          {request.admin_notes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      minWidth: "120px",
                    }}
                  >
                    <button
                      onClick={() =>
                        setSelectedChat({
                          requestId: request.id,
                          petName: request.pet.name,
                          status: request.status,
                        })
                      }
                      style={{
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        color: "white",
                        border: "none",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "14px",
                        textAlign: "center",
                      }}
                    >
                      💬 Chat
                    </button>

                    <button
                      onClick={() => navigate(`/pets/${request.pet.id}`)}
                      style={{
                        background: "transparent",
                        color: "#6b7280",
                        border: "1px solid #e5e7eb",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "14px",
                        textAlign: "center",
                      }}
                    >
                      View Pet
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Widget */}
      {selectedChat && (
        <ChatWidget
          adoptionRequestId={selectedChat.requestId}
          petName={selectedChat.petName}
          status={selectedChat.status}
          onClose={() => setSelectedChat(null)}
        />
      )}
    </div>
  );
}
