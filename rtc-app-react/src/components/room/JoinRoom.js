import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SocketContext } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useAppState } from '../../hooks/useAppState';

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
    // If user is an instructor, redirect to home page
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
    
    // Get display name from user object if authenticated, otherwise use "Anonymous"
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
        
        // Use authenticated user name from server if available
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
    <div className="d-flex flex-column justify-content-center align-items-center vh-100" style={{ backgroundColor: '#323248' }}>
      <div className="card shadow-lg rounded-4 p-4 mx-auto" style={{ maxWidth: '500px', backgroundColor: '#252536', color: '#e0e0e0', border: '1px solid #454564' }}>
        <div className="card-body">
          <div className="text-center mb-4">
            <h1 className="display-6 fw-bold text-primary mb-0">Join Class</h1>
            <p className="text-muted">Class ID: {roomId}</p>
            {user && (
              <div className="mt-2">
                <span className="badge bg-success">Joining as {user.name}</span>
                {user.role && (
                  <span className="badge bg-info ms-2">{user.role}</span>
                )}
              </div>
            )}
          </div>
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
              <div className="mt-2">
                <small>If you're sure this room exists, try refreshing the page or creating a new room.</small>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="room-password-input" className="form-label">Class Password (if required)</label>
            <input 
              type="password" 
              className="form-control border-0" 
              style={{ backgroundColor: '#323248', color: '#e0e0e0' }}
              id="room-password-input" 
              placeholder="Class password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="d-grid">
            <button 
              className="btn btn-lg"
              style={{ backgroundColor: '#3949AB', color: '#ffffff' }}
              onClick={handleJoinRoom}
              disabled={isLoading || !socket || isInstructor}
            >
              {isLoading ? 'Connecting...' : 'Join Class'}
            </button>
          </div>
          
          <div className="text-center mt-3">
            <button 
              className="btn btn-link"
              style={{ color: '#adb5bd' }}
              onClick={() => navigate('/')}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
          
          <div className="mt-4 small text-muted">
            <details>
              <summary>Debug Info</summary>
              <pre className="mt-2" style={{ fontSize: '0.8rem' }}>
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