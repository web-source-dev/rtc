import React, { useEffect, useRef, useState, useContext, memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignal } from '@fortawesome/free-solid-svg-icons';
import VideoParticipant from './VideoParticipant';
import { SocketContext } from '../../context/SocketContext';
import AttentionVideoConnector from '../attention/AttentionVideoConnector';

const LocalVideo = memo(({ localStream, userName = "You" }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
    
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [localStream]);

  console.log(`Rendering local video with display name: "${userName}"`);

  return (
    <div className="video-container local-video-container position-relative mb-2">
      {localStream && (
        <video 
          ref={videoRef}
          id="local-video"
          autoPlay 
          playsInline 
          muted 
          className="rounded-3"
        />
      )}
      <div className="video-overlay" style={{ zIndex: 50, background: 'rgba(37, 37, 54, 0.8)' }}>
        <div 
          className="video-label rounded-pill px-2 py-1" 
          id="local-video-label"
          style={{ color: '#ffffff', fontWeight: 'bold' }}
          key={`local-label-${userName}`}
        >
          {userName}
        </div>
        <div className="connection-status">
          <span className="status-icon connected">
            <FontAwesomeIcon icon={faSignal} />
          </span>
        </div>
      </div>
    </div>
  );
});

const VideoGrid = ({ participants, localStream }) => {
  const [columns, setColumns] = useState(2);
  const [isMobile, setIsMobile] = useState(false);
  
  const gridRef = useRef(null);
  
  const { socket } = useContext(SocketContext);
  const localUserId = socket?.id;
  
  // Filter out the local user from participants list - they'll be shown separately
  const filteredParticipants = participants.filter(p => {
    if (p.id === localUserId) {
      return false;
    }
    return true;
  });
  
  // Sort participants with active streams first
  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    if (a.stream && !a.inactive && (!b.stream || b.inactive)) return -1;
    if (b.stream && !b.inactive && (!a.stream || a.inactive)) return 1;
    
    if (!a.inactive && b.inactive) return -1;
    if (!b.inactive && a.inactive) return 1;
    
    return a.displayName.localeCompare(b.displayName);
  });
  
  // Debug information for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("Current participants and their display names:");
      sortedParticipants.forEach(p => {
        console.log(`Participant ${p.id}: "${p.displayName}"`);
      });
    }
  }, [sortedParticipants]);
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      const mobile = width < 768 || (width < height && width < 992);
      setIsMobile(mobile);
      
      const totalParticipants = sortedParticipants.length + 1;
      
      let cols = 2;
      
      if (mobile) {
          cols = 1;
      } else {
        if (totalParticipants <= 1) {
          cols = 1;
        } else if (totalParticipants <= 4) {
          cols = 2;
        } else if (totalParticipants <= 9) {
          cols = 3;
        } else {
          cols = 4;
        }
      }
      
      setColumns(cols);
    };
    
    handleResize();
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [sortedParticipants.length]);
  
  // Calculate grid style based on number of participants
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: isMobile ? '8px' : '16px',
    width: '100%',
    maxHeight: 'calc(100vh - 180px)',
    overflowY: 'auto',
    padding: '16px'
  };
  
  return (
    <div 
      ref={gridRef}
      id="all-videos-grid" 
      className="all-videos-grid"
      style={gridStyle}
    >
      {/* Local video display */}
      <AttentionVideoConnector>
        <LocalVideo localStream={localStream} userName="You" />
      </AttentionVideoConnector>
      
      {/* Active remote participants */}
      {sortedParticipants
        .filter(p => !p.inactive)
        .map(participant => (
          <VideoParticipant 
            key={participant.id}
            participant={participant}
          />
        ))
      }
      
      {/* Inactive remote participants */}
      {sortedParticipants
        .filter(p => p.inactive)
        .map(participant => (
          <div key={participant.id} className="video-container reconnecting position-relative mb-2">
            <div className="placeholder-video rounded-3 d-flex align-items-center justify-content-center bg-dark" style={{ backgroundColor: '#252536' }}>
              <div className="text-center text-white">
                <div className="spinner-border spinner-border-sm text-light mb-1" role="status">
                  <span className="visually-hidden">Reconnecting...</span>
                </div>
                <p className="mb-0 small">Reconnecting...</p>
              </div>
            </div>
            <div className="video-overlay" style={{ zIndex: 50, background: 'rgba(37, 37, 54, 0.8)' }}>
              <div 
                className="video-label rounded-pill px-2 py-1" 
                style={{ color: '#ffffff', fontWeight: 'bold' }}
                key={`label-reconnect-${participant.id}-${participant.displayName}`}
              >
                {participant.displayName} <span className="badge bg-warning text-dark small">Reconnecting</span>
              </div>
            </div>
          </div>
        ))
      }
    </div>
  );
};

export default VideoGrid; 