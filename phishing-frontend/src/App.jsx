import { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import About from "./pages/About";
import HowTo from "./pages/HowTo";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import api, { setAuthToken } from "./api/axiosInstance";



function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [view, setView] = useState("landing"); // kept for backwards compat with landing scroll
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (token) {
        setAuthToken(token);
        setAuthenticated(true);
      }
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {}
  }, []);

  const handleLogin = (userObj) => {
    if (userObj) {
      setUser(userObj);
      try { localStorage.setItem("user", JSON.stringify(userObj)); } catch (e) {}
    }
    setAuthenticated(true);
    navigate("/home");
  };

  const handleRegister = (userObj) => {
    if (userObj) {
      setUser(userObj);
      try { localStorage.setItem("user", JSON.stringify(userObj)); } catch (e) {}
    }
    setAuthenticated(true);
    navigate("/home");
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (e) {}
    setAuthToken(null);
    setAuthenticated(false);
    setUser(null);
    setView("landing");
    navigate("/");
  };

  const goToLandingSection = (id) => {
    setView("landing");
    navigate("/");
    // wait for landing to render
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  // Close mobile navbar after navigation
  const closeNavbar = () => {
    try {
      const el = document.querySelector('.navbar-collapse');
      if (!el) return;
      // Use Bootstrap Collapse API if available
      const bs = window.bootstrap?.Collapse.getInstance(el) ?? (window.bootstrap ? new window.bootstrap.Collapse(el, { toggle: false }) : null);
      if (bs) bs.hide(); else el.classList.remove('show');
    } catch (e) {
      // ignore
    }
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm border-bottom">
        <div className="container">
          <Link className="navbar-brand mb-0 h1" to="/" onClick={() => setView("landing") }>
            PhishDetect
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-lg-center">
              {!authenticated && (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/about" onClick={closeNavbar}>About</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/how" onClick={closeNavbar}>How to Identify</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/contact" onClick={closeNavbar}>Contact</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login" onClick={closeNavbar}>Login</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/register" onClick={closeNavbar}>Register</Link>
                  </li>
                </>
              )}

              {authenticated && (
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle" href="#" id="accountDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    {user?.username || "Account"}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdown">
                    <li><Link className="dropdown-item" to="/profile" onClick={closeNavbar}>Profile</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                  </ul>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

          <div className="container my-4 app-content">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/how" element={<HowTo />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/register" element={<Register onRegister={handleRegister} />} />
              <Route path="/profile" element={authenticated ? <Profile /> : <Navigate to="/login" />} />
              <Route path="/home" element={authenticated ? <Home user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
            </Routes>
          </div>
    </div>
  );
}

export default App;
