import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";

export default function Navbar() {
  const {
    user,
    isAuthenticated,
    isAdmin,
    logout,
  } = useAuth();

  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link className="brand" to="/">
          BlueCart
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>

          <NavLink to="/products">
            Products
          </NavLink>

          {isAdmin && (
            <NavLink to="/admin">
              Admin
            </NavLink>
          )}
        </nav>

        <div className="nav-actions">
          {isAuthenticated && (
            <span className="welcome">
              Hi, {user?.name || "there"}
            </span>
          )}

          <Link className="cart-link" to="/cart">
            Cart <b>{itemCount}</b>
          </Link>

          {isAuthenticated ? (
            <button
              type="button"
              className="btn btn-text"
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            <>
              <Link className="btn btn-text" to="/login">
                Login
              </Link>

              <Link className="btn btn-primary" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}