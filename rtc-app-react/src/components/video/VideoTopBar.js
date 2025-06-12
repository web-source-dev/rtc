import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faVideo } from '@fortawesome/free-solid-svg-icons';
import { useAppState } from '../../hooks/useAppState';

const VideoTopBar = ({ roomId, classTime }) => {
  const { addNotification } = useAppState();

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addNotification('Class ID copied to clipboard.', 'success', true, 3000);
  };

  return (
    <div className="video-top-bar p-3 d-flex justify-content-between align-items-center" 
         style={{ 
           backgroundColor: '#1e1e2d', 
           borderBottom: '1px solid #2d2d42',
           borderRadius: '8px 8px 0 0',
           boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
         }}>
      <div className="d-flex align-items-center">
        <div className="icon-container me-3 d-flex align-items-center justify-content-center" 
             style={{ 
               backgroundColor: '#3699FF', 
               width: '36px', 
               height: '36px', 
               borderRadius: '8px' 
             }}>
          <FontAwesomeIcon icon={faVideo} style={{ color: 'white' }} />
        </div>
        <h3 className="mb-0 me-3 fw-bold" style={{ color: '#ffffff' }}>Student Monitoring</h3>
        
        <div className="class-info d-flex align-items-center ms-2 py-1 px-3" 
             style={{ 
               backgroundColor: 'rgba(54, 153, 255, 0.1)', 
               borderRadius: '6px',
               border: '1px solid rgba(54, 153, 255, 0.2)'
             }}>
          <span style={{ color: '#e0e0e0', fontSize: '0.9rem' }}>
            Class: <span className="fw-bold text-primary">{roomId}</span>
          </span>
          <button 
            className="btn btn-sm ms-2" 
            onClick={() => copyToClipboard(roomId)}
            style={{ 
              backgroundColor: 'transparent', 
              border: 'none', 
              color: '#3699FF',
              transition: 'all 0.2s ease'
            }}
            title="Copy class ID"
          >
            <FontAwesomeIcon icon={faCopy} />
          </button>
        </div>
      </div>
      
      <div>
        <span className="class-time px-3 py-2" 
              style={{ 
                backgroundColor: 'rgba(50, 50, 72, 0.5)', 
                color: '#e0e0e0', 
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
          {classTime}
        </span>
      </div>
    </div>
  );
};

export default VideoTopBar; 