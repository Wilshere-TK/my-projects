import { useState } from "react";
import api, { setAuthToken } from "../api/axiosInstance";
import './Register.css';

export default function Register({ onRegister, goToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/register", { username, password });
      const token = res.data.token || res.data.access_token || res.data.accessToken || res.data.access;
      if (token) {
        localStorage.setItem("token", token);
        setAuthToken(token);
        const returnedUsername = res.data.user?.username || res.data.username || username;
        const userObj = { username: returnedUsername };
        try { localStorage.setItem("user", JSON.stringify(userObj)); } catch (e) {}
        onRegister && onRegister(userObj);
      } else {
        alert("Registration successful. Please log in.");
        goToLogin && goToLogin();
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      const message = err.response?.data?.message || err.message || "Registration failed";
      alert(message);
    }
  };

  return (
    <div className="register-page">
      <div className="overlay">
        <div className="register-card">
          <h1>Register</h1>
          <form onSubmit={submit}>
            <div className="mb-3">
              <label>Username</label>
              <input className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label>Password</label>
              <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Registering..." : "Register"}</button>
            <button type="button" className="btn btn-link" onClick={goToLogin}>Log in</button>
          </form>
        </div>
      </div>
    </div>
  );
}
