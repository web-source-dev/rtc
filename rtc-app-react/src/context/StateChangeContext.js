import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAttention } from './AttentionContext';
import { SocketContext } from './SocketContext';
import { useAppState } from '../hooks/useAppState';

export const StateChangeContext = createContext();

export const useStateChange = () => useContext(StateChangeContext);

// Maximum number of alerts to store in history
const MAX_ALERT_HISTORY = 50;

// Debounce time for state changes (in milliseconds)
const DEBOUNCE_TIME = 3000;

// Maximum age of alerts to retain (in milliseconds)
const MAX_ALERT_AGE = 24 * 60 * 60 * 1000; // 24 hours

export const StateChangeProvider = ({ children }) => {
  const { attentionData, roomAttentionData } = useAttention();
  const { participants, isRoomCreator } = useContext(SocketContext);
  const { addNotification } = useAppState();

  // State for alerts
  const [stateChangeAlerts, setStateChangeAlerts] = useState([]);
  const [allAlerts, setAllAlerts] = useState([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  // Track previous states to detect changes
  const prevStatesRef = useRef({});
  const alertTimeoutsRef = useRef({});
  const debounceTimersRef = useRef({});

  // Load alerts from localStorage on initial render
  useEffect(() => {
    try {
      const savedAlerts = localStorage.getItem('attention_alerts');
      if (savedAlerts) {
        const parsedAlerts = JSON.parse(savedAlerts);
        
        // Filter out old alerts
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

  // Save alerts to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('attention_alerts', JSON.stringify(allAlerts));
    } catch (error) {
      console.error('Error saving alerts to localStorage:', error);
    }
  }, [allAlerts]);

  // Save alerts enabled setting
  useEffect(() => {
    try {
      localStorage.setItem('alerts_enabled', JSON.stringify(alertsEnabled));
    } catch (error) {
      console.error('Error saving alerts enabled setting:', error);
    }
  }, [alertsEnabled]);

  // Monitor for state changes
  useEffect(() => {
    // Only run for host
    if (!isRoomCreator || !alertsEnabled) return;

    const combinedData = {
      ...roomAttentionData?.attention,
      ...attentionData
    };

    // Process each participant
    for (const participant of participants) {
      const userId = participant.id;
      const participantData = combinedData[userId];
      
      if (!participantData || !participantData.attentionState) continue;
      
      const newState = participantData.attentionState;
      const prevState = prevStatesRef.current[userId];
      
      // Skip if no previous state (first detection) or no change
      if (!prevState || prevState === newState) {
        prevStatesRef.current[userId] = newState;
        continue;
      }

      // State has changed - handle the change with debouncing to avoid alert spam
      if (debounceTimersRef.current[userId]) {
        clearTimeout(debounceTimersRef.current[userId]);
      }
      
      // Using the displayName from the participant object
      const participantName = participant.displayName || 'Anonymous';
      
      // Debounce state changes to avoid rapid alert spam
      debounceTimersRef.current[userId] = setTimeout(() => {
        // Only create alert if the state is still different from the previous one
        if (shouldCreateAlert(prevState, newState)) {
          createAlert(userId, participantName, prevState, newState);
        }
        
        // Update the previous state reference
        prevStatesRef.current[userId] = newState;
        
        // Clear the debounce timer reference
        delete debounceTimersRef.current[userId];
      }, DEBOUNCE_TIME);
    }
  }, [attentionData, roomAttentionData, participants, isRoomCreator, alertsEnabled]);

  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      // Clear debounce timers
      Object.values(debounceTimersRef.current).forEach(timer => {
        clearTimeout(timer);
      });

      // Clear alert auto-dismiss timeouts
      Object.values(alertTimeoutsRef.current).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);

  // Create an alert for a state change
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

    // Add to active alerts
    setStateChangeAlerts(prev => {
      const newAlerts = [alert, ...prev].slice(0, 10);
      return newAlerts;
    });

    // Add to all alerts history
    setAllAlerts(prev => {
      const newAllAlerts = [alert, ...prev].slice(0, MAX_ALERT_HISTORY);
      return newAllAlerts;
    });

    // We no longer send to notification system to avoid duplicate alerts
    // addNotification(message, alertType, true, 5000);

    // Auto-dismiss alert after 15 seconds
    alertTimeoutsRef.current[alertId] = setTimeout(() => {
      dismissAlert(alertId);
    }, 15000);

    return alertId;
  }, [addNotification]);

  // Determine if an alert should be created for this state change
  const shouldCreateAlert = (prevState, newState) => {
    // Critical alerts - always show these
    if (newState === 'absent' || newState === 'sleeping') {
      return true;
    }
    
    // High priority alerts - transitions between major state categories
    
    // Student was previously attentive/active and is now distracted
    if ((prevState === 'attentive' || prevState === 'active') && 
        (newState === 'looking_away' || newState === 'drowsy')) {
      return true;
    }
    
    // Student was previously distracted/absent and is now attentive
    if ((prevState === 'looking_away' || prevState === 'drowsy' || 
         prevState === 'absent' || prevState === 'sleeping' || prevState === 'darkness') && 
        (newState === 'attentive' || newState === 'active')) {
      return true;
    }
    
    // Deteriorating attention - show alerts for worsening states
    if ((prevState === 'looking_away' && newState === 'drowsy') ||
        (prevState === 'drowsy' && (newState === 'sleeping' || newState === 'absent'))) {
      return true;
    }
    
    // Darkness transitions should be shown
    if (prevState === 'darkness' || newState === 'darkness') {
      return true;
    }
    
    // No alert needed for other state changes or minor fluctuations
    return false;
  };

  // Create appropriate message for the alert
  const createAlertMessage = (name, prevState, newState) => {
    // Critical state changes
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

    // Attention deterioration
    if (newState === 'drowsy' && (prevState === 'attentive' || prevState === 'active')) {
      return `${name} appears to be getting drowsy`;
    }
    
    if (newState === 'drowsy' && prevState === 'looking_away') {
      return `${name} is now drowsy and may need attention`;
    }

    if (newState === 'looking_away' && (prevState === 'attentive' || prevState === 'active')) {
      return `${name} is looking away from the screen`;
    }

    // Attention improvement
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
    
    // Darkness
    if (newState === 'darkness' && prevState !== 'darkness') {
      return `${name}'s video feed is too dark to analyze`;
    }
    
    if (prevState === 'darkness' && newState !== 'darkness') {
      return `${name}'s video feed is now visible again`;
    }

    // Generic fallback
    const prevStateFormatted = formatStateName(prevState);
    const newStateFormatted = formatStateName(newState);
    return `${name} changed from ${prevStateFormatted} to ${newStateFormatted}`;
  };

  // Format state name for display
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

  // Determine alert type based on state
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

  // Dismiss a specific alert
  const dismissAlert = useCallback((alertId) => {
    // Remove from active alerts
    setStateChangeAlerts(prev => prev.filter(a => a.id !== alertId));

    // Mark as read in all alerts
    setAllAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, read: true } : a
    ));

    // Clear auto-dismiss timeout if it exists
    if (alertTimeoutsRef.current[alertId]) {
      clearTimeout(alertTimeoutsRef.current[alertId]);
      delete alertTimeoutsRef.current[alertId];
    }
  }, []);

  // Dismiss all alerts
  const dismissAllAlerts = useCallback(() => {
    // Clear all active alerts
    setStateChangeAlerts([]);

    // Mark all alerts as read
    setAllAlerts(prev => prev.map(a => ({ ...a, read: true })));

    // Clear all timeouts
    Object.keys(alertTimeoutsRef.current).forEach(id => {
      clearTimeout(alertTimeoutsRef.current[id]);
      delete alertTimeoutsRef.current[id];
    });
  }, []);

  // Toggle alerts on/off
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