import React, { useEffect, useRef, useState, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faVideoSlash, 
  faMicrophoneLinesSlash,
  faSignal
} from '@fortawesome/free-solid-svg-icons';
import AttentionVideoConnector from '../attention/AttentionVideoConnector';
import { SocketContext } from '../../context/SocketContext';

const VideoParticipant = ({ participant }) => {
  const videoRef = useRef(null);
  const { socket } = useContext(SocketContext);
  
  const [videoError, setVideoError] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  
  const handleVideoError = () => {
    console.error(`Error playing video for ${participant.id}`);
    setVideoError(true);
  };
  
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (videoElement && participant.stream) {
      videoElement.srcObject = participant.stream;
      
      if (participant.stream && participant.stream.getVideoTracks().length > 0) {
        const videoTrack = participant.stream.getVideoTracks()[0];
        
        if (videoTrack.muted) {
          setConnectionStatus('poor');
        } else {
          setConnectionStatus('connected');
        }
      }
    }
    
    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [participant.stream, participant.id]);
  
  useEffect(() => {
    if (!participant.stream) return;
    
    const audioTracks = participant.stream.getAudioTracks();
    if (audioTracks.length === 0) return;
    
    let audioContext;
    let analyser;
    let dataArray;
    let source;
    let animationFrame;
    
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      source = audioContext.createMediaStreamSource(participant.stream);
      source.connect(analyser);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      
      const checkAudioLevel = () => {
        if (!analyser) return;
        
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        setIsSpeaking(average > 20);
        
        animationFrame = requestAnimationFrame(checkAudioLevel);
      };
      
      checkAudioLevel();
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      if (source) {
        source.disconnect();
      }
      
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [participant.stream]);
  
  const isAudioEnabled = participant.stream ? 
    participant.stream.getAudioTracks().some(track => track.enabled) : false;
  
  const isVideoEnabled = participant.stream ? 
    participant.stream.getVideoTracks().some(track => track.enabled) : false;
  
  // Check if this is the local user
  const localUserId = socket?.id;
  const isLocalUser = participant.id === localUserId;
  
  // Get display name - use "You" for local user, otherwise use the participant's displayName
  const displayName = isLocalUser ? "You" : (participant.displayName || `Participant ${participant.id.substring(0, 4)}`);

  const renderConnectionStatus = () => {
    if (participant.inactive) {
      return (
        <span className="status-icon reconnecting">
          <FontAwesomeIcon icon={faSignal} className="text-warning" pulse />
        </span>
      );
    }
    
    switch (connectionStatus) {
      case 'poor':
        return (
          <span className="status-icon poor">
            <FontAwesomeIcon icon={faSignal} className="text-warning" />
          </span>
        );
      case 'reconnecting':
        return (
          <span className="status-icon reconnecting">
            <FontAwesomeIcon icon={faSignal} className="text-warning" pulse />
          </span>
        );
      case 'connected':
      default:
        return (
          <span className="status-icon connected">
            <FontAwesomeIcon icon={faSignal} className="text-success" />
          </span>
        );
    }
  };
  
  return (
    <AttentionVideoConnector participantId={participant.id}>
      <div 
        className={`video-container ${isSpeaking ? 'speaking' : ''} ${!isVideoEnabled || videoError ? 'disabled' : ''}`}
        id={`remote-video-container-${participant.id}`}
        aria-label={`${displayName}'s video feed`}
        data-participant-id={participant.id}
        data-participant-name={displayName}
      >
        {participant.stream && (
          <video
            ref={videoRef}
            id={`remote-video-${participant.id}`}
            autoPlay
            playsInline
            className="rounded-3"
            onError={handleVideoError}
          />
        )}
        
        {(!isVideoEnabled || videoError) && (
          <div className="video-placeholder rounded-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#252536' }}>
            <div className="avatar-circle" style={{ backgroundColor: '#323248', color: '#e0e0e0' }}>
              {displayName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <FontAwesomeIcon icon={faVideoSlash} className="video-disabled-icon" />
          </div>
        )}
          
        <div className="video-overlay" style={{ zIndex: 50, background: 'rgba(37, 37, 54, 0.8)' }}>
          <div 
            className="video-label rounded-pill px-2 py-1" 
            style={{ color: '#ffffff', fontWeight: 'bold' }}
            key={`label-${participant.id}-${displayName}`}
          >
            {displayName}
            {!isAudioEnabled && (
              <FontAwesomeIcon icon={faMicrophoneLinesSlash} className="ms-2" />
            )}
          </div>
          <div className="connection-status">
            {renderConnectionStatus()}
          </div>
        </div>
      </div>
    </AttentionVideoConnector>
  );
};

export default React.memo(VideoParticipant);