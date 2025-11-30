// src/pages/Register.tsx
import React, { useState } from "react";
import { registerUser } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    username: "", email: "", password: "", full_name: "", phone_number: "", state: "", city: "", address: "", pincode: ""
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const onChange = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const res = await registerUser(form);
    if (res.ok) {
      setMsg("Registered successfully. Please login.");
      setTimeout(()=>navigate("/"), 1200);
    } else setMsg(res.error ?? "Registration failed");
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", background:"#111", color:"white", padding:24 }}>
      <div
        style={{
          width:"100%",
          maxWidth:520,
          alignSelf:"flex-start",
          fontWeight:800,
          fontSize:28,
          marginBottom:16,
          display:"flex",
          alignItems:"center",
          gap:12,
        }}
      >
        <img
          src=""
          alt="PawReunite logo"
          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
        />
        <span>PawReunite</span>
      </div>
      <div style={{ width:520, maxWidth:"100%", background:"rgba(255,255,255,0.03)", padding:24, borderRadius:8 }}>
        <h2>Register</h2>
        <form onSubmit={submit}>
          <input required placeholder="username" value={form.username} onChange={e=>onChange("username", e.target.value)} style={{width:"100%", padding:8, marginTop:8}}/>
          <input required placeholder="email" value={form.email} onChange={e=>onChange("email", e.target.value)} style={{width:"100%", padding:8, marginTop:8}}/>
          <input required placeholder="password" type="password" value={form.password} onChange={e=>onChange("password", e.target.value)} style={{width:"100%", padding:8, marginTop:8}}/>
          <input required placeholder="full name" value={form.full_name} onChange={e=>onChange("full_name", e.target.value)} style={{width:"100%", padding:8, marginTop:8}}/>
          <input required placeholder="phone number" value={form.phone_number} onChange={e=>onChange("phone_number", e.target.value)} style={{width:"100%", padding:8, marginTop:8}}/>
          <input required placeholder="state" value={form.state} onChange={e=>onChange("state", e.target.value)} style={{width:"100%", padding:8, marginTop:8}}/>
          <input required placeholder="city" value={form.city} onChange={e=>onChange("city", e.target.value)} style={{width:"100%", padding:8, marginTop:8}}/>
          <input required placeholder="pincode" value={form.pincode} onChange={e=>onChange("pincode", e.target.value)} style={{width:"100%", padding:8, marginTop:8}}/>
          <textarea required placeholder="address" value={form.address} onChange={e=>onChange("address", e.target.value)} style={{width:"100%", padding:8, marginTop:8}}/>
          <div style={{ marginTop:10 }}>
            <button disabled={loading} type="submit">{loading ? "Registering..." : "Register"}</button>
          </div>
        </form>
        {msg && <div style={{ marginTop:12 }}>{msg}</div>}
      </div>
    </div>
  );
}
