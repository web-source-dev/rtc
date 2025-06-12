import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAttention } from './AttentionContext';
import { SocketContext } from './SocketContext';
import { useAppState } from '../hooks/useAppState';

export const StateChangeContext = createContext();

export const useStateChange = () => useContext(StateChangeContext);

const MAX_ALERT_HISTORY = 50;

const DEBOUNCE_TIME = 3000;

const MAX_ALERT_AGE = 24 * 60 * 60 * 1000;

export const StateChangeProvider = ({ children }) => {
  const { attentionData, roomAttentionData } = useAttention();
  const { participants, isRoomCreator } = useContext(SocketContext);
  const { addNotification } = useAppState();

  const [stateChangeAlerts, setStateChangeAlerts] = useState([]);
  const [allAlerts, setAllAlerts] = useState([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const prevStatesRef = useRef({});
  const alertTimeoutsRef = useRef({});
  const debounceTimersRef = useRef({});

  useEffect(() => {
    try {
      const savedAlerts = localStorage.getItem('attention_alerts');
      if (savedAlerts) {
        const parsedAlerts = JSON.parse(savedAlerts);
        
        const now = Date.now();
        const recentAlerts = parsedAlerts.filter(
          alert => now - alert.timestamp < MAX_ALERT_AGE
        );
        
        setAllAlerts(recentAlerts);
      }
      
      const alertsEnabledSetting = localStorage.getItem('alerts_enabled');
      if (alertsEnabledSetting !== null) {
        setAlertsEnabled(JSON.parse(alertsEnabledSetting));
      }
    } catch (error) {
      console.error('Error loading alerts from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('attention_alerts', JSON.stringify(allAlerts));
    } catch (error) {
      console.error('Error saving alerts to localStorage:', error);
    }
  }, [allAlerts]);

  useEffect(() => {
    try {
      localStorage.setItem('alerts_enabled', JSON.stringify(alertsEnabled));
    } catch (error) {
      console.error('Error saving alerts enabled setting:', error);
    }
  }, [alertsEnabled]);

  useEffect(() => {
    if (!isRoomCreator || !alertsEnabled) return;

    const combinedData = {
      ...roomAttentionData?.attention,
      ...attentionData
    };

    for (const participant of participants) {
      const userId = participant.id;
      const participantData = combinedData[userId];
      
      if (!participantData || !participantData.attentionState) continue;
      
      const newState = participantData.attentionState;
      const prevState = prevStatesRef.current[userId];

      if (!prevState || prevState === newState) {
        prevStatesRef.current[userId] = newState;
        continue;
      }

      if (debounceTimersRef.current[userId]) {
        clearTimeout(debounceTimersRef.current[userId]);
      }
      
      const participantName = participant.displayName || 'Anonymous';
      
      debounceTimersRef.current[userId] = setTimeout(() => {
        if (shouldCreateAlert(prevState, newState)) {
          createAlert(userId, participantName, prevState, newState);
        }
        
        prevStatesRef.current[userId] = newState;
        
        delete debounceTimersRef.current[userId];
      }, DEBOUNCE_TIME);
    }
  }, [attentionData, roomAttentionData, participants, isRoomCreator, alertsEnabled]);

  useEffect(() => {
    return () => {
      Object.values(debounceTimersRef.current).forEach(timer => {
        clearTimeout(timer);
      });

      Object.values(alertTimeoutsRef.current).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);

  const createAlert = useCallback((userId, participantName, prevState, newState) => {
    const alertId = `${userId}-${Date.now()}`;
    const alertType = getAlertType(newState);
    const message = createAlertMessage(participantName, prevState, newState);
    
    const alert = {
      id: alertId,
      participantId: userId,
      participantName,
      prevState,
      newState,
      message,
      alertType,
      timestamp: Date.now(),
      read: false
    };

    setStateChangeAlerts(prev => {
      const newAlerts = [alert, ...prev].slice(0, 10);
      return newAlerts;
    });

    setAllAlerts(prev => {
      const newAllAlerts = [alert, ...prev].slice(0, MAX_ALERT_HISTORY);
      return newAllAlerts;
    });

    alertTimeoutsRef.current[alertId] = setTimeout(() => {
      dismissAlert(alertId);
    }, 15000);

    return alertId;
  }, [addNotification]);

  const shouldCreateAlert = (prevState, newState) => {
    if (newState === 'absent' || newState === 'sleeping') {
      return true;
    }
    
    if ((prevState === 'attentive' || prevState === 'active') && 
        (newState === 'looking_away' || newState === 'drowsy')) {
      return true;
    }
    
    if ((prevState === 'looking_away' || prevState === 'drowsy' || 
         prevState === 'absent' || prevState === 'sleeping' || prevState === 'darkness') && 
        (newState === 'attentive' || newState === 'active')) {
      return true;
    }
    
    if ((prevState === 'looking_away' && newState === 'drowsy') ||
        (prevState === 'drowsy' && (newState === 'sleeping' || newState === 'absent'))) {
      return true;
    }
    
    if (prevState === 'darkness' || newState === 'darkness') {
      return true;
    }
    
    return false;
  };

  const createAlertMessage = (name, prevState, newState) => {
    if (newState === 'absent' && prevState === 'active') {
      return `${name} has left the class unexpectedly`;
    }
    
    if (newState === 'absent' && (prevState === 'attentive' || prevState === 'looking_away')) {
      return `${name} is no longer visible in the camera`;
    }
    
    if (newState === 'absent') {
      return `${name} is now absent from the class`;
    }

    if (newState === 'sleeping' && (prevState === 'attentive' || prevState === 'active')) {
      return `${name} appears to have fallen asleep during class`;
    }
    
    if (newState === 'sleeping') {
      return `${name} appears to be sleeping`;
    }

    if (newState === 'drowsy' && (prevState === 'attentive' || prevState === 'active')) {
      return `${name} appears to be getting drowsy`;
    }
    
    if (newState === 'drowsy' && prevState === 'looking_away') {
      return `${name} is now drowsy and may need attention`;
    }

    if (newState === 'looking_away' && (prevState === 'attentive' || prevState === 'active')) {
      return `${name} is looking away from the screen`;
    }

    if ((newState === 'attentive' || newState === 'active') && prevState === 'absent') {
      return `${name} has returned to class and is now attentive`;
    }
    
    if ((newState === 'attentive' || newState === 'active') && prevState === 'sleeping') {
      return `${name} has woken up and is now attentive`;
    }
    
    if ((newState === 'attentive' || newState === 'active') && prevState === 'drowsy') {
      return `${name} is no longer drowsy and is now focused`;
    }
    
    if ((newState === 'attentive' || newState === 'active') && prevState === 'looking_away') {
      return `${name} is now focused on the screen again`;
    }
    
    if (newState === 'attentive' || newState === 'active') {
      return `${name} is now attentive`;
    }
    
    if (newState === 'darkness' && prevState !== 'darkness') {
      return `${name}'s video feed is too dark to analyze`;
    }
    
    if (prevState === 'darkness' && newState !== 'darkness') {
      return `${name}'s video feed is now visible again`;
    }

    const prevStateFormatted = formatStateName(prevState);
    const newStateFormatted = formatStateName(newState);
    return `${name} changed from ${prevStateFormatted} to ${newStateFormatted}`;
  };

  const formatStateName = (state) => {
    switch (state) {
      case 'attentive': return 'attentive';
      case 'active': return 'active';
      case 'looking_away': return 'looking away';
      case 'drowsy': return 'drowsy';
      case 'sleeping': return 'sleeping';
      case 'absent': return 'absent';
      case 'darkness': return 'in darkness';
      default: return state;
    }
  };

  const getAlertType = (state) => {
    switch (state) {
      case 'attentive':
      case 'active':
        return 'success';
      case 'looking_away':
        return 'info';
      case 'drowsy':
        return 'warning';
      case 'sleeping':
      case 'absent':
        return 'danger';
      case 'darkness':
      default:
        return 'secondary';
    }
  };

  const dismissAlert = useCallback((alertId) => {
    setStateChangeAlerts(prev => prev.filter(a => a.id !== alertId));

    setAllAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, read: true } : a
    ));

    if (alertTimeoutsRef.current[alertId]) {
      clearTimeout(alertTimeoutsRef.current[alertId]);
      delete alertTimeoutsRef.current[alertId];
    }
  }, []);

  const dismissAllAlerts = useCallback(() => {
    setStateChangeAlerts([]);

    setAllAlerts(prev => prev.map(a => ({ ...a, read: true })));

    Object.keys(alertTimeoutsRef.current).forEach(id => {
      clearTimeout(alertTimeoutsRef.current[id]);
      delete alertTimeoutsRef.current[id];
    });
  }, []);

  const toggleAlerts = useCallback((newState) => {
    setAlertsEnabled(typeof newState === 'boolean' ? newState : !alertsEnabled);
  }, [alertsEnabled]);

  return (
    <StateChangeContext.Provider
      value={{
        stateChangeAlerts,
        allAlerts,
        dismissAlert,
        dismissAllAlerts,
        alertsEnabled,
        toggleAlerts
      }}
    >
      {children}
    </StateChangeContext.Provider>
  );
};

export default StateChangeProvider; 