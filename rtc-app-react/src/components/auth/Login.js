import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faSpinner, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';

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
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100" 
         style={{ 
           background: 'linear-gradient(135deg, #323248 0%, #252536 100%)',
           padding: '2rem 1rem'
         }}>
      <div className="card shadow-lg rounded-4 p-4 mx-auto" 
           style={{ 
             maxWidth: '600px', 
             width: '100%',
             backgroundColor: 'rgba(37, 37, 54, 0.95)', 
             color: '#e0e0e0', 
             border: '1px solid rgba(69, 69, 100, 0.5)',
             backdropFilter: 'blur(10px)'
           }}>
        <div className="card-body p-4">
          <div className="text-center mb-5">
            <h1 className="display-6 fw-bold mb-2" style={{ color: '#3949AB' }}>Welcome Back</h1>
            <p className="text-light">Sign in to continue to your account</p>
          </div>
          
          {(localError || authError) && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div>{localError || authError}</div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="needs-validation">
            <div className="mb-4">
              <label htmlFor="email" className="form-label d-flex align-items-center">
                <FontAwesomeIcon icon={faEnvelope} className="me-2" style={{ color: '#3949AB' }} />
                Email Address
              </label>
              <input 
                type="email" 
                className="form-control form-control-lg border-0" 
                style={{ 
                  backgroundColor: 'rgba(165, 165, 165, 0.5)', 
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem'
                }}
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="form-label d-flex align-items-center">
                <FontAwesomeIcon icon={faLock} className="me-2" style={{ color: '#3949AB' }} />
                Password
              </label>
              <input 
                type="password" 
                className="form-control form-control-lg border-0" 
                style={{ 
                  backgroundColor: 'rgba(165, 165, 165, 0.5)', 
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem'
                }}
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
                placeholder="Enter your password"
                placeholderTextColor="#fff"
              />
            </div>
            
            <div className="d-grid gap-2 mb-4">
              <button 
                type="submit" 
                className="btn btn-lg"
                style={{ 
                  backgroundColor: '#3949AB', 
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  transition: 'all 0.3s ease'
                }}
                disabled={isSubmitting}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2c3a8c'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3949AB'}
              >
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="text-center">
            <p className="mb-0 text-light">
              Don't have an account?{' '}
              <Link to="/register" style={{ 
                color: '#3949AB', 
                textDecoration: 'none',
                fontWeight: '500'
              }}>
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 