import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
  faDesktop,
  faBars,
  faTimes,
  faChartBar,
  faCommentAlt,
  faSignOutAlt,
  faPhoneSlash,
  faEllipsisV,
  faUsersSlash,
  faBell,
  faBellSlash
} from '@fortawesome/free-solid-svg-icons';
import { SocketContext } from '../../context/SocketContext';
import { useAttention } from '../../context/AttentionContext';
import { useStateChange } from '../../context/StateChangeContext';

const ControlBar = ({ 
  onToggleChat, 
  isChatOpen,
  onToggleHostPanel,
  isHostPanelOpen,
  isRoomCreator
}) => {
  const [isControlsMenuOpen, setIsControlsMenuOpen] = useState(false);
  
  const { 
    toggleAudio, 
    toggleVideo, 
    startScreenSharing, 
    stopScreenSharing,
    isAudioEnabled, 
    isVideoEnabled, 
    isScreenSharing,
    leaveRoom,
    showControlsMenu
  } = useContext(SocketContext);
  
  const { isMonitoringEnabled } = useAttention();
  const { alertsEnabled, toggleAlerts } = useStateChange();
  const navigate = useNavigate();
  
  const storedCreatorStatus = sessionStorage.getItem('rtc_room_creator') === 'true';
  const effectiveIsRoomCreator = isRoomCreator || storedCreatorStatus;
  
  const handleScreenSharing = async () => {
    try {
      if (isScreenSharing) {
        stopScreenSharing();
      } else {
        await startScreenSharing();
      }
    } catch (error) {
      console.error('Error handling screen sharing:', error);
    }
  };
  
  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/');
  };
  
  const toggleControlsMenu = () => {
    setIsControlsMenuOpen(prev => !prev);
  };
  
  return (
    <div className="video-controls-bar p-2 d-flex justify-content-center align-items-center position-relative" style={{ backgroundColor: '#252536', borderTop: '1px solid #454564' }}>
      <button 
        className="control-btn d-md-none position-absolute start-0 ms-2"
        onClick={toggleControlsMenu}
        aria-label="Toggle controls menu"
      >
        <FontAwesomeIcon icon={faBars} />
      </button>
      
      <div className={`d-flex gap-2 ${showControlsMenu ? 'd-flex' : 'd-none d-md-flex'}`}>
        <button 
          className={`control-btn ${!isAudioEnabled ? 'muted' : ''}`}
          onClick={toggleAudio}
          aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          aria-pressed={!isAudioEnabled}
          style={{ 
            backgroundColor: isAudioEnabled ? '#323248' : '#dc3545',
            color: '#e0e0e0',
            border: '1px solid #454564'
          }}
        >
          <FontAwesomeIcon icon={isAudioEnabled ? faMicrophone : faMicrophoneSlash} />
        </button>
        
        <button 
          className={`control-btn ${!isVideoEnabled ? 'muted' : ''}`}
          onClick={toggleVideo}
          aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          aria-pressed={!isVideoEnabled}
          style={{ 
            backgroundColor: isVideoEnabled ? '#323248' : '#dc3545',
            color: '#e0e0e0',
            border: '1px solid #454564'
          }}
        >
          <FontAwesomeIcon icon={isVideoEnabled ? faVideo : faVideoSlash} />
        </button>
        
        <button 
          className={`control-btn ${isScreenSharing ? 'active' : ''}`}
          onClick={handleScreenSharing}
          aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
          aria-pressed={isScreenSharing}
          style={{ 
            backgroundColor: isScreenSharing ? '#3949AB' : '#323248',
            color: '#e0e0e0',
            border: '1px solid #454564'
          }}
        >
          <FontAwesomeIcon icon={faDesktop} />
        </button>
        
        <button 
          className={`control-btn ${isChatOpen ? 'active' : ''}`}
          onClick={onToggleChat}
          aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
          aria-pressed={isChatOpen}
          style={{ 
            backgroundColor: isChatOpen ? '#3949AB' : '#323248',
            color: '#e0e0e0',
            border: '1px solid #454564'
          }}
        >
          <FontAwesomeIcon icon={faCommentAlt} />
        </button>
        
        {effectiveIsRoomCreator && isMonitoringEnabled && (
          <>
          <button
              className={`control-btn ${isHostPanelOpen ? 'active' : ''}`}
            onClick={onToggleHostPanel}
              aria-label={isHostPanelOpen ? 'Close attention panel' : 'Open attention panel'}
              aria-pressed={isHostPanelOpen}
              style={{ 
                backgroundColor: isHostPanelOpen ? '#3949AB' : '#323248',
                color: '#e0e0e0',
                border: '1px solid #454564'
              }}
            title={isHostPanelOpen ? 'Close attention panel' : 'Open attention panel'}
          >
            <FontAwesomeIcon icon={isHostPanelOpen ? faTimes : faChartBar} />
          </button>
            
            <button
              className={`control-btn ${alertsEnabled ? 'active' : ''}`}
              onClick={toggleAlerts}
              aria-label={alertsEnabled ? 'Disable alerts' : 'Enable alerts'}
              aria-pressed={alertsEnabled}
              style={{ 
                backgroundColor: alertsEnabled ? '#3949AB' : '#323248',
                color: '#e0e0e0',
                border: '1px solid #454564'
              }}
              title={alertsEnabled ? 'Disable participant alerts' : 'Enable participant alerts'}
            >
              <FontAwesomeIcon icon={alertsEnabled ? faBell : faBellSlash} />
            </button>
          </>
        )}
        
        <div className="position-relative d-md-none">
          <button
            className="btn btn-control rounded-circle btn-secondary"
            onClick={toggleControlsMenu}
            title="More options"
          >
            <FontAwesomeIcon icon={faEllipsisV} />
          </button>
          
          {isControlsMenuOpen && (
            <div className="position-absolute bottom-100 end-0 mb-2 bg-dark rounded p-2 shadow">
              <button
                className="btn btn-danger d-block mb-2"
                onClick={handleLeaveRoom}
                title="Leave room"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                Leave
              </button>
            </div>
          )}
        </div>
        
        <button 
          className="control-btn leave"
          onClick={handleLeaveRoom}
          aria-label="Leave room"
          style={{ 
            backgroundColor: '#dc3545',
            color: '#ffffff',
            border: '1px solid #b02a37'
          }}
        >
          <FontAwesomeIcon icon={isRoomCreator ? faUsersSlash : faPhoneSlash} />
        </button>
      </div>
    </div>
  );
};

export default ControlBar; 