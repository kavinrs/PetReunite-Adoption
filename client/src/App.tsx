import React from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatRoomView from "./components/ChatRoomView";
import AdminRoomCreate from "./components/AdminRoomCreate";
import { RoomsPage } from "./pages/RoomsPage";

function App() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Pet Adoption &amp; Rescue Chat</h1>
        <nav>
          <Link to="/rooms">Rooms</Link>
          <Link to="/admin/create-room">Create Room</Link>
          {!isAuthenticated && <Link to="/login">Login</Link>}
          {!isAuthenticated && <Link to="/register">Register</Link>}
          {isAuthenticated && (
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:roomId" element={<ChatRoomView />} />
          <Route path="/admin/create-room" element={<AdminRoomCreate />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
