import { useState } from "react";
import api, { setAuthToken } from "../api/axiosInstance";
import './Login.css';

export default function Login({ onLogin, goToRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      const res = await api.post("/api/login", params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const token = res.data.token || res.data.access_token || res.data.accessToken || res.data.access;
      if (!token) throw new Error("No token returned from server");
      localStorage.setItem("token", token);
      setAuthToken(token);
      const returnedUsername = res.data.user?.username || res.data.username || username;
      const userObj = { username: returnedUsername };
      try { localStorage.setItem("user", JSON.stringify(userObj)); } catch (e) {}
      setLoading(false);
      onLogin && onLogin(userObj);
    } catch (err) {
      setLoading(false);
      const message = err.response?.data?.message || err.message || "Login failed";
      alert(message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-overlay">
        <div className="login-card card p-5 shadow-lg">
          <h1 className="h3 mb-4 text-center text-primary">Welcome Back</h1>
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="d-flex gap-2 justify-content-center">
              <button type="submit" className="btn btn-primary flex-grow-1" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
              <button type="button" className="btn btn-outline-secondary flex-grow-1" onClick={goToRegister}>Register</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
