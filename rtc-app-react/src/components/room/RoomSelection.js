import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSignOutAlt, faUserGraduate, faChalkboardTeacher, faDoorOpen, faChartLine, faLock, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import { SocketContext } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const RoomSelection = () => {
  const [displayName, setDisplayName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState('');
  const [currentRoomPassword, setCurrentRoomPassword] = useState('');
  
  const { createRoom, roomId: contextRoomId } = useContext(SocketContext);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const isInstructor = user?.role === 'instructor';
  const isStudent = user?.role === 'student';
  
  useEffect(() => {
    if (contextRoomId) {
      setCurrentRoomId(contextRoomId);
      setShowRoomInfo(true);
      
      navigate('/setup');
    }
  }, [contextRoomId, navigate]);
  
  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    } else {
      const savedName = localStorage.getItem('displayName');
      if (savedName) {
        setDisplayName(savedName);
      }
    }
  }, [user]);
  
  const handleCreateRoom = () => {
    if (!isInstructor) {
      alert('Only instructors can create classes');
      return;
    }
    
    createRoom({
      password: isPasswordProtected ? roomPassword : '',
      displayName: displayName || user?.name || 'Anonymous'
    });
  };
  
  const handleJoinRoom = () => {
    if (!roomId) {
      alert('Please enter a room ID');
      return;
    }
    
    navigate(`/join/${roomId}`);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const copyToClipboard = (text, setButtonText) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setButtonText('Copied!');
        setTimeout(() => {
          setButtonText('Copy');
        }, 2000);
      })
      .catch(err => {
        console.error('Could not copy: ', err);
        alert('Failed to copy to clipboard');
      });
  };
  
  const [copyRoomIdText, setCopyRoomIdText] = useState('Copy');
  const [copyPasswordText, setCopyPasswordText] = useState('Copy');
  
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
            <h1 className="display-6 fw-bold mb-2" style={{ color: '#3949AB' }}>Student Monitoring</h1>
            <p className="text-light">Live Online Classes Platform</p>
            {user && (
              <div className="mt-3">
                <span className="badge bg-success px-3 py-2">
                  <FontAwesomeIcon icon={faUserGraduate} className="me-2" />
                  {user.name}
                </span>
                {isInstructor && (
                  <span className="badge bg-primary ms-2 px-3 py-2">
                    <FontAwesomeIcon icon={faChalkboardTeacher} className="me-2" />
                    Instructor
                  </span>
                )}
                {isStudent && (
                  <span className="badge bg-info ms-2 px-3 py-2">
                    <FontAwesomeIcon icon={faUserGraduate} className="me-2" />
                    Student
                  </span>
                )}
                <button 
                  className="btn btn-sm btn-outline-danger ms-2 px-3 py-2"
                  onClick={handleLogout}
                  style={{ transition: 'all 0.3s ease' }}
                  onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.1)'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
          
          {isInstructor && (
            <>
              <div className="d-grid gap-3 mb-4">
                <button 
                  className="btn btn-lg"
                  style={{ 
                    backgroundColor: '#3949AB', 
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={handleCreateRoom}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#2c3a8c'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#3949AB'}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Create New Class
                </button>

                <Link 
                  to="/instructor/dashboard"
                  className="btn btn-lg"
                  style={{ 
                    backgroundColor: 'rgba(50, 50, 72, 0.5)', 
                    color: '#e0e0e0', 
                    borderColor: '#3949AB',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(50, 50, 72, 0.8)'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(50, 50, 72, 0.5)'}
                >
                  <FontAwesomeIcon icon={faChartLine} className="me-2" />
                  View Class Analytics
                </Link>
              </div>
              
              <div className="mb-4">
                <label htmlFor="room-password-input" className="form-label d-flex align-items-center">
                  <FontAwesomeIcon icon={faLock} className="me-2" style={{ color: '#3949AB' }} />
                  Class Password (optional)
                </label>
                <input 
                  type="password" 
                  className="form-control form-control-lg border-0" 
                  style={{ 
                    backgroundColor: 'rgba(165, 165, 165, 0.5)', 
                    color: '#e0e0e0',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem'
                  }}
                  id="room-password-input" 
                  placeholder="Enter class password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  disabled={!isPasswordProtected}
                />
              </div>
              
              <div className="form-check form-switch mb-4">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="password-protect"
                  checked={isPasswordProtected}
                  onChange={(e) => setIsPasswordProtected(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="password-protect">
                  Password Protect Class
                </label>
              </div>
              </>
          )}
          
          {(isStudent || !user) && (
            <div className="mb-4">
              <label htmlFor="room-id-input" className="form-label d-flex align-items-center">
                <FontAwesomeIcon icon={faDoorOpen} className="me-2" style={{ color: '#3949AB' }} />
                Class ID
              </label>
              <div className="input-group">
                <input 
                  type="text" 
                  className="form-control form-control-lg border-0" 
                  style={{ 
                    backgroundColor: 'rgba(165, 165, 165, 0.5)', 
                    color: '#e0e0e0',
                    borderRadius: '8px 0 0 8px',
                    padding: '0.75rem 1rem'
                  }}
                  id="room-id-input" 
                  placeholder="Enter class code"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
                <button 
                  className="btn btn-lg"
                  style={{ 
                    backgroundColor: '#3949AB', 
                    color: '#ffffff',
                    borderRadius: '0 8px 8px 0',
                    padding: '0.75rem 1.5rem',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={handleJoinRoom}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#2c3a8c'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#3949AB'}
                >
                  <FontAwesomeIcon icon={faDoorOpen} className="me-2" />
                  Join
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showRoomInfo && isInstructor && (
        <div className="mt-4 card p-4 text-center" 
             style={{ 
               maxWidth: '600px',
               backgroundColor: 'rgba(37, 37, 54, 0.95)', 
               color: '#e0e0e0', 
               border: '1px solid rgba(69, 69, 100, 0.5)',
               backdropFilter: 'blur(10px)'
             }}>
          <h5 className="card-title mb-4" style={{ color: '#3949AB' }}>Share this class info</h5>
          <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
            <span className="fs-5 fw-bold">{currentRoomId}</span>
            <button 
              className="btn btn-sm"
              style={{ 
                borderColor: '#3949AB', 
                color: '#3949AB',
                transition: 'all 0.3s ease'
              }}
              onClick={() => copyToClipboard(currentRoomId, setCopyRoomIdText)}
              onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(57, 73, 171, 0.1)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <FontAwesomeIcon icon={copyRoomIdText === 'Copied!' ? faCheck : faCopy} className="me-2" />
              {copyRoomIdText}
            </button>
          </div>
          {currentRoomPassword && (
            <div className="mt-3">
              <p className="mb-2 text-muted">Password:</p>
              <div className="d-flex align-items-center justify-content-center gap-2">
                <span className="fw-bold">{currentRoomPassword}</span>
                <button 
                  className="btn btn-sm"
                  style={{ 
                    borderColor: '#3949AB', 
                    color: '#3949AB',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => copyToClipboard(currentRoomPassword, setCopyPasswordText)}
                  onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(57, 73, 171, 0.1)'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <FontAwesomeIcon icon={copyPasswordText === 'Copied!' ? faCheck : faCopy} className="me-2" />
                  {copyPasswordText}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomSelection; 