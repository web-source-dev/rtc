import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { SocketContext } from './SocketContext';
import { setupPeriodicCapture } from '../utils/videoCapture';
import { detectAttention, getRoomAttention } from '../utils/attentionApi';
import { useAppState } from '../hooks/useAppState';

export const AttentionContext = createContext();

export const useAttention = () => useContext(AttentionContext);

export const AttentionProvider = ({ children }) => {
  const { addNotification } = useAppState();
  
  const [attentionData, setAttentionData] = useState({});
  const [roomAttentionData, setRoomAttentionData] = useState({});
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previousSyncState, setPreviousSyncState] = useState({ level: 'unknown', dominantState: null });
  
  
  const captureControlRef = useRef(null);
  const roomIntervalRef = useRef(null);
  
  const socketContext = useContext(SocketContext);
  const { socket, roomId, participants, localStream, dataChannels, isRoomCreator } = socketContext || {};
  
  const localVideoRef = useRef(null);
  
  const cleanupCapture = useCallback(() => {
    if (captureControlRef.current) {
      captureControlRef.current.stop();
      captureControlRef.current = null;
    }
    
    if (roomIntervalRef.current) {
      clearInterval(roomIntervalRef.current);
      roomIntervalRef.current = null;
    }
  }, []);
  
  const broadcastAttentionData = useCallback((attentionResult) => {
    if (!socket) return;
    
    if (!attentionResult) {
      console.warn('Attempted to broadcast undefined attention data');
      return;
    }
    
    if (!attentionResult.attentionState && !attentionResult.state) {
      console.warn('Attention data missing required state field', attentionResult);
      return;
    }
    
    const standardizedResult = {
      attentionState: attentionResult.attentionState || attentionResult.state,
      timestamp: attentionResult.timestamp || Date.now(),
      confidence: attentionResult.confidence || 100
    };
    
    if (dataChannels) {
      const attentionMessage = {
        type: 'attention',
        userId: socket.id,
        data: standardizedResult,
        timestamp: standardizedResult.timestamp
      };
      
      Object.values(dataChannels).forEach(channel => {
        if (channel && channel.readyState === 'open') {
          try {
            channel.send(JSON.stringify(attentionMessage));
          } catch (error) {
            console.error('Error sending attention data via data channel:', error);
          }
        }
      });
    }
    
    if (socketContext && socketContext.sendAttentionData && isRoomCreator && roomId) {
      try {
        const allAttentionData = {
          ...attentionData,
          [socket.id]: standardizedResult
        };
        
        const formattedData = {};
        
        Object.keys(allAttentionData).forEach(userId => {
          const userData = allAttentionData[userId];
          if (userData) {
            formattedData[userId] = {
              attentionState: userData.attentionState || userData.state || 'unknown',
              timestamp: userData.timestamp || Date.now()
            };
          }
        });
        
        if (Object.keys(formattedData).length > 0) {
          console.log("Sending attention data to server:", 
            Object.keys(formattedData).map(id => `${id}: ${formattedData[id].attentionState}`).join(', '));
          
          socketContext.sendAttentionData({
            roomId: roomId,
            attentionData: formattedData
          });
        }
      } catch (error) {
        console.error('Error preparing attention data for server:', error);
      }
    }
  }, [dataChannels, socket, socketContext, attentionData, isRoomCreator, roomId]);
  
  const handleReceivedAttentionData = useCallback((userId, data) => {
    setAttentionData(prev => {
      const newAttentionData = {
        ...prev,
        [userId]: data
      };
      
      if (isRoomCreator && data?.attentionState) {
        const currentState = data.attentionState;
        const previousState = prev[userId]?.attentionState;
        
        const participantName = participants?.find(p => p.id === userId)?.displayName || 'A participant';
        
        if (previousState && previousState !== currentState) {
          if ((previousState === 'active' || previousState === 'attentive') && 
              (currentState === 'absent' || currentState === 'sleeping')) {
            addNotification(
              `${participantName} changed from ${getAttentionStateName(previousState)} to ${getAttentionStateName(currentState)}`, 
              'warning'
            );
          } else if ((previousState === 'absent' || previousState === 'sleeping') && 
                     (currentState === 'active' || currentState === 'attentive')) {
            addNotification(
              `${participantName} is now ${getAttentionStateName(currentState)}`, 
              'success'
            );
          } else if (currentState === 'looking_away' && 
                     (previousState === 'active' || previousState === 'attentive')) {
            addNotification(
              `${participantName} is now looking away`, 
              'info'
            );
          } else if (currentState === 'drowsy' && 
                     (previousState === 'active' || previousState === 'attentive')) {
            addNotification(
              `${participantName} appears to be drowsy`, 
              'warning'
            );
          }
        }
      }
      
      return newAttentionData;
    });
  }, [isRoomCreator, participants, addNotification]);
  
  const getAttentionStateName = (state) => {
    if (!state) return 'Unknown';
    
    switch(state) {
      case 'attentive':
        return 'Attentive';
      case 'active':
        return 'Active';
      case 'looking_away':
        return 'Looking Away';
      case 'drowsy':
        return 'Drowsy';
      case 'sleeping':
        return 'Sleeping';
      case 'absent':
        return 'Absent';
      case 'darkness':
        return 'In Darkness';
      default:
        return state
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
  };
  
  const calculateSyncLevel = useCallback(() => {
    if (!socket || !participants) return { level: 'unknown', percentage: 0, dominantState: null };
    
    const combinedData = {
      ...roomAttentionData?.attention,
      ...attentionData
    };
    
    const localUserId = socket.id;
    
    const allUsers = [];
    
    if (localUserId && combinedData[localUserId]) {
      allUsers.push({ 
        id: localUserId,
        data: combinedData[localUserId] 
      });
    }
    
    if (participants && Array.isArray(participants)) {
      participants.forEach(p => {
        if (p && p.id && combinedData[p.id]) {
          allUsers.push({ 
            id: p.id,
            data: combinedData[p.id]
          });
        }
      });
    }
    
    if (allUsers.length === 0) {
      return { level: 'unknown', percentage: 0, dominantState: null };
    }
    
    const states = allUsers.reduce((acc, user) => {
      const state = user.data?.attentionState;
      if (state) {
        acc[state] = (acc[state] || 0) + 1;
      }
      return acc;
    }, {});
    
    let mostCommonState = '';
    let maxCount = 0;
    
    Object.entries(states).forEach(([state, count]) => {
      if (count > maxCount) {
        mostCommonState = state;
        maxCount = count;
      }
    });
    
    const syncPercentage = (maxCount / allUsers.length) * 100;
    
    const groupedStates = {
      attentive: (states['attentive'] || 0) + (states['active'] || 0),
      distracted: (states['looking_away'] || 0) + (states['drowsy'] || 0),
      inactive: (states['absent'] || 0) + (states['sleeping'] || 0) + (states['darkness'] || 0)
    };
    
    const dominantGroup = Object.entries(groupedStates)
      .sort((a, b) => b[1] - a[1])[0];
    
    const dominantGroupName = dominantGroup[0];
    const dominantGroupCount = dominantGroup[1];
    const groupSyncPercentage = (dominantGroupCount / allUsers.length) * 100;
    
    let syncLevel;
    if (groupSyncPercentage >= 80) {
      syncLevel = 'high';
    } else if (groupSyncPercentage >= 50) {
      syncLevel = 'medium';
    } else {
      syncLevel = 'low';
    }
    
    return { 
      level: syncLevel, 
      percentage: syncPercentage,
      dominantState: mostCommonState,
      dominantGroup: dominantGroupName,
      groupPercentage: groupSyncPercentage,
      totalParticipants: allUsers.length
    };
  }, [attentionData, roomAttentionData, socket, participants]);
  
  const checkAndNotifySyncChanges = useCallback(() => {
    if (!isRoomCreator) return;
    
    const currentSync = calculateSyncLevel();
    
    if (previousSyncState.level !== 'unknown' && 
        currentSync.level !== 'unknown' && 
        previousSyncState.level !== currentSync.level) {
      
      if (currentSync.level === 'high' && previousSyncState.level !== 'high') {
        addNotification('All participants are now in sync!', 'success');
      } else if (currentSync.level === 'low' && previousSyncState.level !== 'low') {
        addNotification('Attention synchronization has decreased', 'warning');
      }
    }
    
    if (previousSyncState.dominantState && 
        currentSync.dominantState && 
        previousSyncState.dominantState !== currentSync.dominantState) {
      
      const formattedState = currentSync.dominantState
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      addNotification(`Group attention shifted to: ${formattedState}`, 'info');
    }
    
    setPreviousSyncState(currentSync);
  }, [calculateSyncLevel, previousSyncState, addNotification, isRoomCreator]);

  const startLocalMonitoring = useCallback(() => {
    if (!localVideoRef.current || !socket) return;
    
    cleanupCapture();
    
    captureControlRef.current = setupPeriodicCapture(
      localVideoRef.current,
      async (frameData) => {
        try {
          const userId = socket.id;
          const result = await detectAttention(frameData, userId);
          
          setAttentionData(prev => ({
            ...prev,
            [userId]: result
          }));
          
          broadcastAttentionData(result);
        } catch (err) {
          console.error('Error in attention monitoring:', err);
          setError('Failed to analyze attention');
        }
      },
      { interval: 5000 }
    );
    
    captureControlRef.current.captureNow();
    
    setupRoomAttentionInterval();
  }, [socket, cleanupCapture, broadcastAttentionData]);
  
  const setupRoomAttentionInterval = useCallback(() => {
    if (!socket || !roomId) return;
    
    if (roomIntervalRef.current) {
      clearInterval(roomIntervalRef.current);
    }
    
    roomIntervalRef.current = setInterval(async () => {
      try {
        const userIds = [
          socket.id,
          ...participants.map(p => p.id)
        ];
        
        const result = await getRoomAttention(roomId, userIds);
        setRoomAttentionData(result);
        
        if (isRoomCreator) {
          checkAndNotifySyncChanges();
        }
      } catch (err) {
        console.error('Error fetching room attention:', err);
      }
    }, 10000);
  }, [socket, roomId, participants, checkAndNotifySyncChanges, isRoomCreator]);
  
  const calibrateAttention = useCallback(async () => {
    if (!localVideoRef.current || !socket) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const frameData = setupPeriodicCapture(
        localVideoRef.current, 
        () => {}, 
        { quality: 0.9 }
      ).captureNow();
      
      if (!frameData) {
        throw new Error('Failed to capture video frame');
      }
      
      const result = await detectAttention(frameData, socket.id);
      
      if (result) {
        setIsCalibrated(true);
        broadcastAttentionData(result);
      }
      
      return result;
    } catch (err) {
      console.error('Calibration error:', err);
      setError('Failed to calibrate attention detection');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [socket, broadcastAttentionData]);
  
  const setLocalVideoElement = useCallback((element) => {
    localVideoRef.current = element;
    
    if (element) {
      startLocalMonitoring();
    }
  }, [startLocalMonitoring]);
  
  useEffect(() => {
    if (localVideoRef.current) {
      startLocalMonitoring();
    } else {
      cleanupCapture();
    }
    
    return () => cleanupCapture();
  }, [startLocalMonitoring, cleanupCapture]);

  useEffect(() => {
    return () => cleanupCapture();
  }, [cleanupCapture]);
  
  useEffect(() => {
    if (!socketContext) return;
    
    socketContext.registerAttentionHandler && 
      socketContext.registerAttentionHandler(handleReceivedAttentionData);
    
    return () => {
      socketContext.unregisterAttentionHandler && 
        socketContext.unregisterAttentionHandler();
    };
  }, [socketContext, handleReceivedAttentionData]);
  
  const standardizeTimestamp = (timestamp) => {
    if (!timestamp) return Date.now();
    
    if (typeof timestamp === 'number') return timestamp;
    
    if (typeof timestamp === 'string' && /^\d+$/.test(timestamp)) {
      return parseInt(timestamp, 10);
    }
    
    try {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.getTime();
      }
    } catch (e) {
      console.error('Invalid timestamp format:', timestamp);
    }
    
    return Date.now();
  };
  
  return (
    <AttentionContext.Provider 
      value={{
        isMonitoringEnabled: true,
        attentionData,
        roomAttentionData,
        isCalibrated,
        isLoading,
        error,
        calibrateAttention,
        setLocalVideoElement,
        handleReceivedAttentionData,
        calculateSyncLevel
      }}
    >
      {children}
    </AttentionContext.Provider>
  );
}; 