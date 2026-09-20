
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const savedUser =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user");

  let user = null;

  try {
    user = savedUser ? JSON.parse(savedUser) : null;
  } catch {
    user = null;
  }

  const isLoggedIn = Boolean(token && user);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/login");
    window.location.reload();
  };

  return (
    <nav>
      {/* Website logo */}
      <div>
        <Link to="/" className="navbar-brand">
          🎟️ Event Manager
        </Link>
      </div>

      {/* Navigation links */}
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/events">Events</Link>

        {isLoggedIn ? (
          <>
            <Link to="/my-events">My Events</Link>

            {user.role === "admin" && (
              <Link to="/admin">Admin</Link>
            )}

            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;