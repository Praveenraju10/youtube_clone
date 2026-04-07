import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar({ onToggleSidebar }) {
  const [query, setQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="icon-btn menu-btn" onClick={onToggleSidebar}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>
        <Link to="/" className="logo">
          <svg viewBox="0 0 90 20" fill="none" width="90" height="20">
            <rect width="28" height="20" rx="4" fill="#FF0000"/>
            <polygon points="11,5 21,10 11,15" fill="white"/>
            <text x="32" y="15" fill="white" fontSize="14" fontWeight="700" fontFamily="Roboto,sans-serif">YouTube</text>
          </svg>
        </Link>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          className="search-input"
          type="text"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="search-btn">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </button>
      </form>

      <div className="navbar-right">
        {user ? (
          <>
            <Link to="/upload" className="icon-btn" title="Upload">
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            </Link>
            <div className="user-menu-wrap" ref={menuRef}>
              <button className="avatar-btn" onClick={() => setShowMenu(!showMenu)}>
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} className="user-avatar" />
                  : <div className="avatar-placeholder">{user.name[0].toUpperCase()}</div>}
              </button>
              {showMenu && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-name">{user.name}</div>
                    <div className="dropdown-email">{user.email}</div>
                  </div>
                  <Link to={`/channel/${user.id}`} className="dropdown-item" onClick={() => setShowMenu(false)}>Your Channel</Link>
                  <Link to="/history" className="dropdown-item" onClick={() => setShowMenu(false)}>History</Link>
                  <button className="dropdown-item" onClick={() => { logout(); setShowMenu(false); navigate('/'); }}>Sign Out</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/signin" className="btn btn-ghost sign-in-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
