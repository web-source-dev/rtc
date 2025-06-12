import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SocketContext } from '../../context/SocketContext';
import { useAttention } from '../../context/AttentionContext';
import { useStateChange } from '../../context/StateChangeContext';
import VideoTopBar from './VideoTopBar';
import VideoGrid from './VideoGrid';
import ControlBar from '../controls/ControlBar';
import ChatPanel from '../chat/ChatPanel';
import HostAttentionPanel from '../attention/HostAttentionPanel';
import ParticipantStateAlert from '../attention/ParticipantStateAlert';

const VideoChat = () => {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isHostPanelVisible, setIsHostPanelVisible] = useState(false);
  const [classTime, setClassTime] = useState(0);
  const timerRef = useRef(null);
  
  const { 
    roomId: contextRoomId, 
    participants,
    localStream,
    isRoomCreator
  } = useContext(SocketContext);
  
  const { isMonitoringEnabled } = useAttention();
  const { 
    stateChangeAlerts, 
    allAlerts, 
    dismissAlert, 
    dismissAllAlerts, 
    alertsEnabled, 
    toggleAlerts 
  } = useStateChange();
  
  const navigate = useNavigate();
  const { roomId } = useParams();
  
  const storedCreatorStatus = sessionStorage.getItem('rtc_room_creator') === 'true';
  const effectiveIsRoomCreator = isRoomCreator || storedCreatorStatus;
  
  useEffect(() => {
    if (!contextRoomId) {
      navigate('/');
    }
  }, [contextRoomId, navigate]);
  
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };
  
  useEffect(() => {
    // If we have session start time from the context, use that to initialize the timer
    // Otherwise, start at 0
    const sessionStartTime = localStorage.getItem('session_start_time');
    if (sessionStartTime) {
      const startTimeMs = parseInt(sessionStartTime, 10);
      if (!isNaN(startTimeMs)) {
        const elapsedSeconds = Math.floor((Date.now() - startTimeMs) / 1000);
        if (elapsedSeconds > 0) {
          setClassTime(elapsedSeconds);
        }
      }
    } else {
      // Store current time as session start if not already set             
      localStorage.setItem('session_start_time', Date.now().toString());
    }
    
    // Set up the timer to increment by 60 seconds every minute
    timerRef.current = setInterval(() => {
      setClassTime(prev => prev + 60);
    }, 60000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  const toggleChat = () => {
    setIsChatVisible(prev => !prev);
    if (isHostPanelVisible) setIsHostPanelVisible(false);
  };
  
  const toggleHostPanel = () => {
    if (!effectiveIsRoomCreator) return;
    setIsHostPanelVisible(prev => !prev);
    if (isChatVisible) setIsChatVisible(false);
  };
  
  // Memoize the alert component to prevent unnecessary re-renders
  const renderParticipantAlerts = () => {
    if (!effectiveIsRoomCreator || !isMonitoringEnabled) return null;
    
    return (
      <ParticipantStateAlert 
        alerts={stateChangeAlerts}
        allAlerts={allAlerts}
        onDismiss={dismissAlert}
        onDismissAll={dismissAllAlerts}
        alertsEnabled={alertsEnabled}
        onToggleAlerts={toggleAlerts}
      />
    );
  };
  
  return (
    <div className="d-flex flex-column vh-100">
      <VideoTopBar 
        roomId={roomId || contextRoomId}
        classTime={formatTime(classTime)}
      />
      
      <div className="video-content-area flex-grow-1 d-flex position-relative">
        <div className={`videos-container flex-grow-1 p-2 ${isChatVisible || isHostPanelVisible ? 'with-chat' : ''}`}>
          <VideoGrid 
            participants={participants} 
            localStream={localStream}
          />
        </div>

        <ChatPanel 
          isVisible={isChatVisible} 
          onClose={() => setIsChatVisible(false)}
        />
        
        {isHostPanelVisible && effectiveIsRoomCreator && isMonitoringEnabled && (
          <HostAttentionPanel onClose={toggleHostPanel} />
        )}
        
        {/* Show participant state alerts for hosts */}
        {renderParticipantAlerts()}
      </div>
      
      <ControlBar 
        onToggleChat={toggleChat}
        isChatOpen={isChatVisible}
        onToggleHostPanel={toggleHostPanel}
        isHostPanelOpen={isHostPanelVisible}
        isRoomCreator={effectiveIsRoomCreator}
      />
    </div>
  );
};

export default VideoChat; 