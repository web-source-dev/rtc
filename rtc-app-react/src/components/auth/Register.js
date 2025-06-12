import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';

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
    <div className="d-flex flex-column justify-content-center align-items-center vh-100" style={{ backgroundColor: '#323248' }}>
      <div className="card shadow-lg rounded-4 p-4 mx-auto" style={{ maxWidth: '500px', backgroundColor: '#252536', color: '#e0e0e0', border: '1px solid #454564' }}>
        <div className="card-body">
          <div className="text-center mb-4">
            <h1 className="display-6 fw-bold text-primary mb-0">Register</h1>
            <p className="text-muted">Create your account</p>
          </div>
          
          {(localError || authError) && (
            <div className="alert alert-danger" role="alert">
              {localError || authError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-control border-0" 
                style={{ backgroundColor: '#323248', color: '#e0e0e0' }}
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            
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
            
            <div className="mb-3">
              <label htmlFor="role" className="form-label">Role</label>
              <select
                className="form-select border-0"
                style={{ backgroundColor: '#323248', color: '#e0e0e0' }}
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isSubmitting}
                required
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
              <small className="form-text text-muted">
                Students can join classes. Instructors can create and host classes.
              </small>
            </div>
            
            <div className="mb-3">
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
            
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input 
                type="password" 
                className="form-control border-0" 
                style={{ backgroundColor: '#323248', color: '#e0e0e0' }}
                id="confirmPassword" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                )}
                Register
              </button>
            </div>
          </form>
          
          <div className="text-center mt-3">
            <p className="mb-0">
              Already have an account? <Link to="/login" style={{ color: '#3949AB' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 