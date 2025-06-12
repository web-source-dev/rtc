import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }
  
  if (location.pathname.includes('/room/')) {
    return null;
  }
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: '#252536', borderBottom: '1px solid #454564' }}>
      <div className="container-fluid">
        <Link to="/" className="navbar-brand text-primary fw-bold">
          Student Monitoring
        </Link>
        
        <div className="d-flex align-items-center">
          {isAuthenticated ? (
            <div className="d-flex align-items-center">
              <span className="text-light me-3">
                <FontAwesomeIcon icon={faUser} className="me-2" />
                {user?.name}
              </span>
              <button 
                className="btn btn-outline-danger btn-sm"
                onClick={handleLogout}
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="me-1" />
                Logout
              </button>
            </div>
          ) : (
            <div>
              <Link to="/login" className="btn btn-outline-primary btn-sm me-2">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 