import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSignOutAlt, faUserGraduate, faChalkboardTeacher, faDoorOpen, faChartLine } from '@fortawesome/free-solid-svg-icons';
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
    <div className="d-flex flex-column justify-content-center align-items-center vh-100" style={{ backgroundColor: '#323248' }}>
      <div className="card shadow-lg rounded-4 p-4 mx-auto" style={{ maxWidth: '500px', backgroundColor: '#252536', color: '#e0e0e0', border: '1px solid #454564' }}>
        <div className="card-body">
          <div className="text-center mb-4">
            <h1 className="display-6 fw-bold text-primary mb-0">Student Monitoring</h1>
            <p className="text-muted">Live Online Classes Platform</p>
            {user && (
              <div className="mt-2">
                <span className="badge bg-success">Logged in as {user.name}</span>
                {isInstructor && (
                  <span className="badge bg-primary ms-2">
                    <FontAwesomeIcon icon={faChalkboardTeacher} className="me-1" />
                    Instructor
                  </span>
                )}
                {isStudent && (
                  <span className="badge bg-info ms-2">
                    <FontAwesomeIcon icon={faUserGraduate} className="me-1" />
                    Student
                  </span>
                )}
                <button 
                  className="btn btn-sm btn-outline-danger ms-2"
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="me-1" />
                  Logout
                </button>
              </div>
            )}
          </div>
          
          {isInstructor && (
            <>
              <div className="d-grid gap-2 mb-3">
                <button 
                  className="btn btn-lg"
                  style={{ backgroundColor: '#3949AB', color: '#ffffff' }}
                  onClick={handleCreateRoom}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Create New Class
                </button>

                <Link 
                  to="/instructor/dashboard"
                  className="btn btn-lg"
                  style={{ backgroundColor: '#252536', color: '#e0e0e0', borderColor: '#3949AB' }}
                >
                  <FontAwesomeIcon icon={faChartLine} className="me-2" />
                  View Class Analytics
                </Link>
              </div>
              
              <div className="mb-3">
                <label htmlFor="room-password-input" className="form-label">Class Password (optional)</label>
                <input 
                  type="password" 
                  className="form-control border-0" 
                  style={{ backgroundColor: '#323248', color: '#e0e0e0' }}
                  id="room-password-input" 
                  placeholder="Class password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  disabled={!isPasswordProtected}
                />
              </div>
              
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="password-protect"
                  checked={isPasswordProtected}
                  onChange={(e) => setIsPasswordProtected(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="password-protect">Password Protect</label>
              </div>
              
              {!isStudent && (
                <div className="separator my-3 text-white">
                  <span>or</span>
                </div>
              )}
            </>
          )}
          
          {(isStudent || !user) && (
            <div className="mb-3">
              <label htmlFor="room-id-input" className="form-label">Class ID</label>
              <div className="input-group">
                <input 
                  type="text" 
                  className="form-control border-0" 
                  style={{ backgroundColor: '#323248', color: '#e0e0e0' }}
                  id="room-id-input" 
                  placeholder="Enter class code"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
                <button 
                  className="btn"
                  style={{ backgroundColor: '#3949AB', color: '#ffffff', borderColor: '#3949AB' }}
                  onClick={handleJoinRoom}
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
        <div className="mt-4 card p-3 text-center" style={{ maxWidth: '500px', backgroundColor: '#252536', color: '#e0e0e0', border: '1px solid #454564' }}>
          <h5 className="card-title">Share this class info</h5>
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <span className="fs-5 fw-bold">{currentRoomId}</span>
            <button 
              className="btn btn-sm"
              style={{ borderColor: '#3949AB', color: '#3949AB' }}
              onClick={() => copyToClipboard(currentRoomId, setCopyRoomIdText)}
            >
              {copyRoomIdText}
            </button>
          </div>
          {currentRoomPassword && (
            <div className="mt-2">
              <p className="mb-1">Password:</p>
              <div className="d-flex align-items-center justify-content-center gap-2">
                <span className="fw-bold">{currentRoomPassword}</span>
                <button 
                  className="btn btn-sm"
                  style={{ borderColor: '#3949AB', color: '#3949AB' }}
                  onClick={() => copyToClipboard(currentRoomPassword, setCopyPasswordText)}
                >
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