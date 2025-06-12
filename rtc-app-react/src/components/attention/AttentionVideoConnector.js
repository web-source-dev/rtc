import React, { useRef, useEffect } from 'react';
import { useAttention } from '../../context/AttentionContext';


const AttentionVideoConnector = ({ children }) => {
  const videoRef = useRef(null);
  const { setLocalVideoElement, isMonitoringEnabled } = useAttention();
  
  useEffect(() => {
    if (videoRef.current) {
      const videoElement = videoRef.current.querySelector('video');
      
      if (videoElement) {
        console.log('Connected video element to attention monitoring');
        setLocalVideoElement(videoElement);
      }
    }
  }, [setLocalVideoElement, isMonitoringEnabled]);
  
  return (
    <div ref={videoRef} className="attention-video-connector">
      {children}
    </div>
  );
};

export default AttentionVideoConnector; 