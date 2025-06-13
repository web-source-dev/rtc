import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faSpinner, faUser, faEnvelope, faLock, faUserTie, faGraduationCap, faChalkboardTeacher } from '@fortawesome/free-solid-svg-icons';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, error: authError } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      setLocalError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    
    setLocalError('');
    setIsSubmitting(true);
    
    try {
      await register(name, email, password, role);
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      setLocalError(error.message || 'Registration failed. Please try again later.');
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
             maxWidth: '700px', 
             width: '100%',
             backgroundColor: 'rgba(37, 37, 54, 0.95)', 
             color: '#e0e0e0', 
             border: '1px solid rgba(69, 69, 100, 0.5)',
             backdropFilter: 'blur(10px)'
           }}>
        <div className="card-body p-4">
          <div className="text-center mb-5">
            <h1 className="display-6 fw-bold mb-2" style={{ color: '#3949AB' }}>Create Account</h1>
            <p className="text-light">Join our learning community</p>
          </div>
          
          {(localError || authError) && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div>{localError || authError}</div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="needs-validation">
            <div className="mb-4">
              <label htmlFor="name" className="form-label d-flex align-items-center">
                <FontAwesomeIcon icon={faUser} className="me-2" style={{ color: '#3949AB' }} />
                Full Name
              </label>
              <input 
                type="text" 
                className="form-control form-control-lg border-0" 
                style={{ 
                  backgroundColor: 'rgba(165, 165, 165, 0.5)', 
                  color: '#e0e0e0',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  transition: 'all 0.3s ease'
                }}
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                required
                placeholder="Enter your full name"
              />
            </div>
            
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
                  color: '#e0e0e0',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  transition: 'all 0.3s ease'
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
              <label className="form-label d-flex align-items-center">
                <FontAwesomeIcon icon={faUserTie} className="me-2" style={{ color: '#3949AB' }} />
                Select Your Role
              </label>
              <div className="d-flex gap-3">
                <div 
                  className={`flex-grow-1 p-3 rounded-3 cursor-pointer ${role === 'student' ? 'border border-primary' : 'border border-secondary'}`}
                  style={{ 
                    backgroundColor: role === 'student' ? 'rgba(57, 73, 171, 0.1)' : 'rgba(50, 50, 72, 0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setRole('student')}
                >
                  <div className="text-center">
                    <FontAwesomeIcon 
                      icon={faGraduationCap} 
                      className="mb-2" 
                      style={{ 
                        fontSize: '2rem',
                        color: role === 'student' ? '#3949AB' : '#e0e0e0'
                      }} 
                    />
                    <h5 className="mb-1" style={{ color: role === 'student' ? '#3949AB' : '#e0e0e0' }}>Student</h5>
                    <small className="text-light">Join classes and learn</small>
                  </div>
                </div>
                
                <div 
                  className={`flex-grow-1 p-3 rounded-3 cursor-pointer ${role === 'instructor' ? 'border border-primary' : 'border border-secondary'}`}
                  style={{ 
                    backgroundColor: role === 'instructor' ? 'rgba(57, 73, 171, 0.1)' : 'rgba(50, 50, 72, 0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setRole('instructor')}
                >
                  <div className="text-center">
                    <FontAwesomeIcon 
                      icon={faChalkboardTeacher} 
                      className="mb-2" 
                      style={{ 
                        fontSize: '2rem',
                        color: role === 'instructor' ? '#3949AB' : '#e0e0e0'
                      }} 
                    />
                    <h5 className="mb-1" style={{ color: role === 'instructor' ? '#3949AB' : '#e0e0e0' }}>Instructor</h5>
                    <small className="text-light">Create and host classes</small>
                  </div>
                </div>
              </div>
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
                  color: '#e0e0e0',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  transition: 'all 0.3s ease'
                }}
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
                placeholder="Create a password"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label d-flex align-items-center">
                <FontAwesomeIcon icon={faLock} className="me-2" style={{ color: '#3949AB' }} />
                Confirm Password
              </label>
              <input 
                type="password" 
                className="form-control form-control-lg border-0" 
                style={{ 
                  backgroundColor: 'rgba(165, 165, 165, 0.5)', 
                  color: '#e0e0e0',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  transition: 'all 0.3s ease'
                }}
                id="confirmPassword" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                required
                placeholder="Confirm your password"
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
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px rgba(57, 73, 171, 0.2)'
                }}
                disabled={isSubmitting}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2c3a8c'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3949AB'}
              >
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="text-center">
            <p className="mb-0 text-light">
              Already have an account?{' '}
              <Link to="/login" style={{ 
                color: '#3949AB', 
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 