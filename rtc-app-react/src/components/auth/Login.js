import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }
    
    setLocalError('');
    setIsSubmitting(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100" style={{ backgroundColor: '#323248' }}>
      <div className="card shadow-lg rounded-4 p-4 mx-auto" style={{ maxWidth: '500px', backgroundColor: '#252536', color: '#e0e0e0', border: '1px solid #454564' }}>
        <div className="card-body">
          <div className="text-center mb-4">
            <h1 className="display-6 fw-bold text-primary mb-0">Login</h1>
            <p className="text-muted">Sign in to your account</p>
          </div>
          
          {(localError || authError) && (
            <div className="alert alert-danger" role="alert">
              {localError || authError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input 
                type="email" 
                className="form-control border-0" 
                style={{ backgroundColor: '#323248', color: '#e0e0e0' }}
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="form-label">Password</label>
              <input 
                type="password" 
                className="form-control border-0" 
                style={{ backgroundColor: '#323248', color: '#e0e0e0' }}
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div className="d-grid">
              <button 
                type="submit" 
                className="btn btn-lg"
                style={{ backgroundColor: '#3949AB', color: '#ffffff' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                ) : (
                  <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
                )}
                Login
              </button>
            </div>
          </form>
          
          <div className="text-center mt-3">
            <p className="mb-0">
              Don't have an account? <Link to="/register" style={{ color: '#3949AB' }}>Register now</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 