import { useCallback, useRef, useState } from 'react';
import { useAppState, ERROR_TYPES } from './useAppState';

const useWebRTC = () => {
  const { setAppError, addNotification } = useAppState();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState('new');
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  
  const getUserMedia = useCallback(async (constraints = { video: true, audio: true }) => {
    try {
      setIsConnecting(true);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setIsConnecting(false);
      return stream;
    } catch (error) {
      setIsConnecting(false);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setAppError(
          ERROR_TYPES.MEDIA_ACCESS,
          'Permission to access camera or microphone was denied',
          error.message
        );
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setAppError(
          ERROR_TYPES.MEDIA_ACCESS,
          'No camera or microphone found',
          error.message
        );
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setAppError(
          ERROR_TYPES.MEDIA_ACCESS,
          'Camera or microphone is already in use',
          error.message
        );
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        setAppError(
          ERROR_TYPES.MEDIA_ACCESS,
          'Camera or microphone constraints not satisfied',
          error.message
        );
      } else {
        setAppError(
          ERROR_TYPES.MEDIA_ACCESS,
          'Error accessing camera or microphone',
          error.message
        );
      }
      
      throw error;
    }
  }, [setAppError]);
  
  const createPeerConnection = useCallback((configuration, userId) => {
    try {
      const pc = new RTCPeerConnection(configuration);
      
      pc.oniceconnectionstatechange = () => {
        setConnectionState(pc.iceConnectionState);
        
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current += 1;
            addNotification(
              `Connection issue detected. Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`,
              'warning'
            );
            
            if (pc.restartIce) {
              setTimeout(() => {
                if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
                  pc.restartIce();
                }
              }, 2000);
            }
          } else {
            setAppError(
              ERROR_TYPES.PEER_CONNECTION,
              'Connection to peer failed',
              `ICE state: ${pc.iceConnectionState}`
            );
          }
        }
        
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          reconnectAttempts.current = 0;
        }
      };
      
      return pc;
    } catch (error) {
      setAppError(
        ERROR_TYPES.PEER_CONNECTION,
        'Failed to create peer connection',
        error.message
      );
      throw error;
    }
  }, [setAppError, addNotification]);
  
  const getDisplayMedia = useCallback(async (options = {}) => {
    try {
      setIsConnecting(true);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          ...options.video
        }
      });
      setIsConnecting(false);
      return stream;
    } catch (error) {
      setIsConnecting(false);
      
      if (error.name === 'NotAllowedError') {
        setAppError(
          ERROR_TYPES.MEDIA_ACCESS,
          'Permission to share screen was denied',
          error.message
        );
      } else {
        setAppError(
          ERROR_TYPES.MEDIA_ACCESS,
          'Error accessing screen sharing',
          error.message
        );
      }
      
      throw error;
    }
  }, [setAppError]);
    
  const checkWebRTCSupport = useCallback(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setAppError(
        ERROR_TYPES.PEER_CONNECTION,
        'WebRTC is not supported in this browser',
        'navigator.mediaDevices.getUserMedia is not available'
      );
      return false;
    }
    
    if (!window.RTCPeerConnection) {
      setAppError(
        ERROR_TYPES.PEER_CONNECTION,
        'WebRTC is not supported in this browser',
        'RTCPeerConnection is not available'
      );
      return false;
    }
    
    return true;
  }, [setAppError]);
  
  return {
    getUserMedia,
    createPeerConnection,
    getDisplayMedia,
    checkWebRTCSupport,
    isConnecting,
    connectionState
  };
};

export default useWebRTC; 