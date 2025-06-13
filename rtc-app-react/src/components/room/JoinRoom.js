import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SocketContext } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useAppState } from '../../hooks/useAppState';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDoorOpen, faLock, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const JoinRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState({});
  const [roomJoinAttempted, setRoomJoinAttempted] = useState(false);
  
  const { joinRoom, roomId: contextRoomId, socket } = useContext(SocketContext);
  const { user } = useAuth();
  const { isLoading, error: appStateError, addNotification } = useAppState();
  
  const isInstructor = user?.role === 'instructor';
  
  useEffect(() => {
    if (user && isInstructor) {
      addNotification('Instructors cannot join rooms. Please create a room instead.', 'warning');
      navigate('/');
      return;
    }
    
    console.log('JoinRoom component - Current state:', {
      roomId,
      contextRoomId,
      socketConnected: socket?.connected,
      user,
      isLoading,
      appStateError
    });
    
    setDebugInfo({
      roomId,
      contextRoomId,
      socketConnected: socket?.connected,
      hasUser: !!user,
      isLoading,
      hasError: !!appStateError,
      joinAttempted: roomJoinAttempted
    });
    
    if (appStateError && roomJoinAttempted) {
      setError(appStateError.message || 'Error joining room');
    }
  }, [roomId, contextRoomId, socket, user, isLoading, appStateError, roomJoinAttempted, navigate, isInstructor, addNotification]);
  
  useEffect(() => {
    if (contextRoomId) {
      console.log('Room ID set in context, navigating to setup', contextRoomId);
      navigate('/setup');
    }
  }, [contextRoomId, navigate]);
  
  useEffect(() => {
    if (!socket && !isLoading) {
      console.error('No socket connection available');
      setError('Connection to server not established. Please go back and try again.');
    } else if (socket) {
      console.log('Socket is available:', {
        id: socket.id,
        connected: socket.connected
      });
      setError('');
    }
  }, [socket, isLoading]);
  
  const handleJoinRoom = () => {
    if (isInstructor) {
      setError('Instructors cannot join rooms. Please create a room instead.');
      return;
    }
    
    if (!socket) {
      console.error('Cannot join room: No socket connection');
      setError('Connection to server not established. Please go back and try again.');
      return;
    }
    
    if (!socket.connected) {
      console.error('Cannot join room: Socket not connected');
      setError('Socket not connected to server. Please go back and try again.');
      return;
    }
    
    const displayName = user?.name || 'Anonymous';
    
    console.log('Joining room with data:', {
      roomId,
      password: password ? '[REDACTED]' : '',
      displayName
    });
    
    setError('');
    setRoomJoinAttempted(true);
    
    joinRoom({
      roomId,
      password,
      displayName
    });
  };
  
  useEffect(() => {
    if (roomId && socket && socket.connected && !roomJoinAttempted && !isLoading && !error && !isInstructor) {
      if (/^[A-Z0-9]{6,8}$/.test(roomId)) {
        console.log('Auto-joining room:', roomId);
        setRoomJoinAttempted(true);
        
        const displayName = user?.name || 'Anonymous';
        
        joinRoom({
          roomId,
          password,
          displayName
        });
      }
    }
  }, [roomId, socket, isLoading, error, roomJoinAttempted, password, user, joinRoom, isInstructor]);
  
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
            <h1 className="display-6 fw-bold mb-2" style={{ color: '#3949AB' }}>Join Class</h1>
            <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
              <span className="badge bg-dark bg-opacity-75 px-3 py-2">
                Class ID: {roomId}
              </span>
            </div>
            {user && (
              <div className="mt-3">
                <span className="badge bg-success px-3 py-2">
                  <FontAwesomeIcon icon={faDoorOpen} className="me-2" />
                  Joining as {user.name}
                </span>
                {user.role && (
                  <span className="badge bg-info ms-2 px-3 py-2">
                    {user.role}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {error && (
            <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              <div>
                {error}
                <div className="mt-2 small">
                  If you're sure this room exists, try refreshing the page or creating a new room.
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="room-password-input" className="form-label d-flex align-items-center">
              <FontAwesomeIcon icon={faLock} className="me-2" style={{ color: '#3949AB' }} />
              Class Password (if required)
            </label>
            <input 
              type="password" 
              className="form-control form-control-lg border-0" 
              style={{ 
                backgroundColor: 'rgba(50, 50, 72, 0.5)', 
                color: '#e0e0e0',
                borderRadius: '8px',
                padding: '0.75rem 1rem'
              }}
              id="room-password-input" 
              placeholder="Enter class password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="d-grid gap-2 mb-4">
            <button 
              className="btn btn-lg"
              style={{ 
                backgroundColor: '#3949AB', 
                color: '#ffffff',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                transition: 'all 0.3s ease'
              }}
              onClick={handleJoinRoom}
              disabled={isLoading || !socket || isInstructor}
              onMouseOver={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#2c3a8c')}
              onMouseOut={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#3949AB')}
            >
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faDoorOpen} className="me-2" />
                  Join Class
                </>
              )}
            </button>
          </div>
          
          <div className="text-center">
            <button 
              className="btn btn-link"
              style={{ 
                color: '#adb5bd',
                textDecoration: 'none',
                transition: 'all 0.3s ease'
              }}
              onClick={() => navigate('/')}
              disabled={isLoading}
              onMouseOver={(e) => !e.target.disabled && (e.target.style.color = '#ffffff')}
              onMouseOut={(e) => !e.target.disabled && (e.target.style.color = '#adb5bd')}
            >
              Cancel
            </button>
          </div>
          
          <div className="mt-4 small text-muted">
            <details>
              <summary className="cursor-pointer">Debug Info</summary>
              <pre className="mt-2 p-3 rounded-3" 
                   style={{ 
                     backgroundColor: 'rgba(50, 50, 72, 0.5)',
                     fontSize: '0.8rem'
                   }}>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom; 